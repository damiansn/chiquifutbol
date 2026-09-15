import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// URLs de los equipos de la Liga Profesional
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
            return NextResponse.json(
                { error: "Falta el parámetro 'team'" },
                { status: 400 }
            );
        }

        const cleanTeam = teamName.toLowerCase().trim();
        const targetUrl = URLS_EQUIPOS[cleanTeam];

        if (!targetUrl) {
            return NextResponse.json(
                {
                    error: `No se encontró la URL para el equipo: ${teamName}`
                },
                { status: 404 }
            );
        }

        console.log(`Consultando fixture de ${teamName}`);
        console.log(`URL: ${targetUrl}`);

        const res = await fetch(targetUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
            },

            // No dejamos que Next.js conserve un fixture viejo demasiado tiempo.
            cache: "no-store"
        });

        if (!res.ok) {
            throw new Error(
                `Promiedos respondió con estado ${res.status}`
            );
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const matches = [];

        $("table tr").each((index, element) => {
            const $row = $(element);

            const cells = $row
                .find("td")
                .map((_, cell) => $(cell).text().trim())
                .get();

            if (cells.length < 3) {
                return;
            }

            // Evitamos encabezados.
            const textoFila = cells.join(" ").toLowerCase();

            if (
                textoFila.includes("fecha") &&
                textoFila.includes("rival")
            ) {
                return;
            }

            const fecha = cells[0] || "";
            const condicion = cells[1] || "";
            const rival = cells[2] || "";

            let horaOResultado = "";

            if (cells.length >= 4) {
                horaOResultado = cells[3] || "";
            }

            if (!fecha || !rival) {
                return;
            }

            // Evitamos filas que claramente no son partidos.
            if (
                rival.length < 2 ||
                rival.toLowerCase() === "equipo" ||
                rival.toLowerCase() === "rival"
            ) {
                return;
            }

            matches.push({
                id: `${cleanTeam}-${index}-${Date.now()}`,
                fecha,
                condicion,
                rival,
                horaOResultado,
                rawText: `${fecha} ${condicion} ${rival} ${horaOResultado}`.trim()
            });
        });

        /*
         * Eliminamos posibles duplicados.
         */
        const uniqueMatches = [];

        const seen = new Set();

        for (const match of matches) {
            const key = [
                match.fecha,
                match.condicion,
                match.rival,
                match.horaOResultado
            ]
                .join("|")
                .toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                uniqueMatches.push(match);
            }
        }

        /*
         * Devolvemos los primeros 20 partidos.
         *
         * Esto es independiente de Ayer/Hoy/Mañana.
         */
        const finalMatches = uniqueMatches.slice(0, 20);

        console.log(
            `Se encontraron ${finalMatches.length} partidos para ${teamName}`
        );

        return NextResponse.json({
            team: teamName,
            matches: finalMatches,

            // Lo dejamos preparado para una futura paginación.
            nextDateParam: null
        });

    } catch (error) {
        console.error("Error en team-fixture API:", error);

        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Error interno del servidor al obtener el fixture"
            },
            { status: 500 }
        );
    }
}