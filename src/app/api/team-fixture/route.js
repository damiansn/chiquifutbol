import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    const searchNormalized = teamName.toLowerCase().trim();

    // 1. Hacemos un fetch a la home de Promiedos para descubrir dinámicamente el link exacto del equipo (con su hash)
    const homeRes = await fetch("https://www.promiedos.com.ar/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 300 }
    });

    if (!homeRes.ok) {
      throw new Error("No se pudo conectar con Promiedos para buscar el equipo");
    }

    const homeHtml = await homeRes.text();
    const $home = cheerio.load(homeHtml);

    let teamRelativeUrl = "";

    // Buscamos en todos los links que contengan '/team/'
    $home('a[href*="/team/"]').each((_, el) => {
      const $el = $home(el);
      const nameText = $el.text().toLowerCase().trim();
      const href = $el.attr('href');

      // Si el texto del link coincide con el equipo que buscas (o contiene parte clave)
      if (nameText && (nameText === searchNormalized || searchNormalized.includes(nameText) || nameText.includes(searchNormalized))) {
        teamRelativeUrl = href;
        return false; // rompe el each si encuentra coincidencia exacta
      }
    });

    // Fallback por si el equipo no está listado en la home de hoy (armamos una ruta base o avisamos)
    if (!teamRelativeUrl) {
      return NextResponse.json({ 
        matches: [], 
        error: "El equipo no se encuentra en los partidos activos de hoy para autodetectar su enlace." 
      });
    }

    const teamUrl = `https://www.promiedos.com.ar${teamRelativeUrl}`;

    // 2. Hacemos fetch a la página específica y limpia del equipo
    const teamRes = await fetch(teamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 300 }
    });

    if (!teamRes.ok) {
      throw new Error("No se pudo obtener el fixture del equipo");
    }

    const teamHtml = await teamRes.text();
    const $ = cheerio.load(teamHtml);
    const matches = [];

    // 3. Recorremos la tabla ordenada de "Próximos Partidos"
    $('tr').each((_, el) => {
      const $el = $(el);
      const cols = $el.find('td');

      if (cols.length >= 4) {
        const dia = $(cols[0]).text().trim(); // Ej: 19/09
        const condicion = $(cols[1]).text().trim(); // Ej: V o L
        const rival = $(cols[2]).text().trim(); // Ej: Gimnasia
        const hora = $(cols[3]).text().trim(); // Ej: 14:30

        // Validamos que sea una fila de partido real
        if (dia.includes('/') && hora.includes(':')) {
          const textoEnfrentamiento = condicion === 'V' 
            ? `${teamName.toUpperCase()} (Visita) vs ${rival}` 
            : `${teamName.toUpperCase()} (Local) vs ${rival}`;

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

    // Limitamos a los primeros 2 partidos para mantener la página rápida y on-demand como pediste
    const limitedMatches = matches.slice(0, 2);

    return NextResponse.json({
      matches: limitedMatches,
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}