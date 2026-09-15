import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Diccionario exacto con las URLs de los equipos que proporcionaste
const URLS_EQUIPOS = {
    "velez sarsfield": "https://www.promiedos.com.ar/team/velez-sarsfield/ihc",
    "defensa y justicia": "https://www.promiedos.com.ar/team/defensa-y-justicia/hcbh",
    "gimnasia mendoza": "https://www.promiedos.com.ar/team/gimnasia-mendoza/bbjbf",
    "instituto": "https://www.promiedos.com.ar/team/instituto-ac-cordoba/hchc",
    "instituto ac cordoba": "https://www.promiedos.com.ar/team/instituto-ac-cordoba/hchc",
    "boca juniors": "https://www.promiedos.com.ar/team/boca-juniors/igg",
    "boca": "https://www.promiedos.com.ar/team/boca-juniors/igg",
    "independiente": "https://www.promiedos.com.ar/team/independiente/ihe",
    "lanus": "https://www.promiedos.com.ar/team/lanus/igj",
    "union": "https://www.promiedos.com.ar/team/union-santa-fe/hcag",
    "union santa fe": "https://www.promiedos.com.ar/team/union-santa-fe/hcag",
    "newells": "https://www.promiedos.com.ar/team/newell's-old-boys/ihh",
    "newell's old boys": "https://www.promiedos.com.ar/team/newell's-old-boys/ihh",
    "san lorenzo": "https://www.promiedos.com.ar/team/san-lorenzo/igf",
    "estudiantes de la plata": "https://www.promiedos.com.ar/team/estudiantes-de-la-plata/igh",
    "estudiantes": "https://www.promiedos.com.ar/team/estudiantes-de-la-plata/igh",
    "riestra": "https://www.promiedos.com.ar/team/riestra/bbjea",
    "deportivo riestra": "https://www.promiedos.com.ar/team/riestra/bbjea",
    "platense": "https://www.promiedos.com.ar/team/platense/hcah",
    "talleres": "https://www.promiedos.com.ar/team/talleres-cordoba/jche",
    "talleres cordoba": "https://www.promiedos.com.ar/team/talleres-cordoba/jche",
    "central cordoba": "https://www.promiedos.com.ar/team/central-cordoba-sde/beafh",
    "central cordoba sde": "https://www.promiedos.com.ar/team/central-cordoba-sde/beafh",
    "argentinos juniors": "https://www.promiedos.com.ar/team/argentinos-juniors/ihb",
    "argentinos": "https://www.promiedos.com.ar/team/argentinos-juniors/ihb",
    "sarmiento": "https://www.promiedos.com.ar/team/sarmiento-junin/hbbh",
    "sarmiento junin": "https://www.promiedos.com.ar/team/sarmiento-junin/hbbh",
    "gimnasia la plata": "https://www.promiedos.com.ar/team/gimnasia-la-plata/iia",
    "rosario central": "https://www.promiedos.com.ar/team/rosario-central/ihf",
    "independiente rivadavia": "https://www.promiedos.com.ar/team/independiente-rivadavia/hcch",
    "belgrano": "https://www.promiedos.com.ar/team/belgrano/fhid",
    "river plate": "https://www.promiedos.com.ar/team/river-plate/igi",
    "river": "https://www.promiedos.com.ar/team/river-plate/igi",
    "atletico tucuman": "https://www.promiedos.com.ar/team/atletico-tucuman/gbfc",
    "huracan": "https://www.promiedos.com.ar/team/huracan/iie",
    "tigre": "https://www.promiedos.com.ar/team/tigre/iid",
    "barracas central": "https://www.promiedos.com.ar/team/barracas-central/jafb",
    "barracas": "https://www.promiedos.com.ar/team/barracas-central/jafb",
    "banfield": "https://www.promiedos.com.ar/team/banfield/ihi",
    "estudiantes rio cuarto": "https://www.promiedos.com.ar/team/estudiantes-rio-cuarto/bheaf",
    "aldosivi": "https://www.promiedos.com.ar/team/aldosivi/hccd",
    "racing club": "https://www.promiedos.com.ar/team/racing-club/ihg",
    "racing": "https://www.promiedos.com.ar/team/racing-club/ihg"
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    const cleanTeam = teamName.toLowerCase().trim();
    const targetUrl = URLS_EQUIPOS[cleanTeam];

    if (!targetUrl) {
      return NextResponse.json({ error: `No se encontró la URL para el equipo: ${teamName}` }, { status: 404 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 300 } // Caché por 5 minutos
    });

    if (!res.ok) {
      throw new Error("No se pudo conectar con Promiedos para este equipo");
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches = [];

    // Recorremos las filas de las tablas del fixture del equipo
    $("table tr").each((_, el) => {
      const $el = $(el);
      const cols = $el.find("td");

      // Validamos que la fila tenga celdas suficientes para extraer los datos ordenados
      if (cols.length >= 3) {
        const fecha = $(cols[0]).text().trim();
        const condicion = $(cols[1]).text().trim(); // Ej: 'L' o 'V'
        const rival = $(cols[2]).text().trim();
        const horaOResultado = cols.length > 3 ? $(cols[3]).text().trim() : "";

        // Verificamos que al menos contenga fecha y rival para descartar filas vacías o de cabecera
        if (fecha && rival) {
          matches.push({
            id: Math.random().toString(36).substring(2, 9),
            fecha,
            condicion,
            rival,
            horaOResultado,
            rawText: `${fecha} ${condicion} ${rival} ${horaOResultado}`.trim(),
          });
        }
      }
    });

    return NextResponse.json({
      matches: matches.slice(0, 10), // Primeros 10 registros
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}