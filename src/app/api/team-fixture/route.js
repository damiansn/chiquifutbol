import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Diccionario rápido con los links directos de los equipos en Promiedos
const teamUrls = {
  "banfield": "https://www.promiedos.com.ar/team/banfield/ihi",
  "atletico tucuman": "https://www.promiedos.com.ar/team/atletico-tucuman/gbfc",
  "boca juniors": "https://www.promiedos.com.ar/team/boca-juniors/...", // sumás los que necesites
  "river plate": "https://www.promiedos.com.ar/team/river-plate/...",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    const normalizedTeam = teamName.toLowerCase().trim();
    const targetUrl = teamUrls[normalizedTeam];

    if (!targetUrl) {
      return NextResponse.json({ error: "Equipo no encontrado en el diccionario" }, { status: 404 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 300 } // Caché de 5 minutos para que vuele
    });

    if (!res.ok) {
      throw new Error("No se pudo obtener la página del equipo en Promiedos");
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches = [];

    // Recorremos directamente las filas de la tabla de próximos partidos
    // Buscamos la tabla que contenga el título o sección de "Próximos Partidos"
    $('tr').each((_, el) => {
      const $el = $(el);
      const cols = $el.find('td');

      // Las filas de partidos tienen celdas específicas (Día, L/V, Equipo, Hora)
      if (cols.length >= 4) {
        const dia = $(cols[0]).text().trim(); // Ej: 19/09
        const condicion = $(cols[1]).text().trim(); // Ej: V o L
        const rival = $(cols[2]).text().trim(); // Ej: Gimnasia
        const hora = $(cols[3]).text().trim(); // Ej: 14:30

        // Validamos que parezca una fecha y hora real
        if (dia.includes('/') && hora.includes(':')) {
          const textoEnfrentamiento = condicion === 'V' 
            ? `${normalizedTeam.toUpperCase()} (Visita) vs ${rival}` 
            : `${normalizedTeam.toUpperCase()} (Local) vs ${rival}`;

          matches.push({
            id: Math.random().toString(36).substring(2, 9),
            rawText: textoEnfrentamiento,
            league: `Fixture de ${teamName}`,
            date: dia,
            time: hora
          });
        }
      }
    });

    // Devolvemos los próximos partidos ordenados (limitado a los primeros 2 o los que prefieras)
    const limitedMatches = matches.slice(0, 2);

    return NextResponse.json({
      matches: limitedMatches,
      nextDateParam: null // Acá ya no hace falta paginar por semana porque te da todo el fixture directo
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}