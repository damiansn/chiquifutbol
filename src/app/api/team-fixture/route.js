import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ==========================================
// URLS DE LOS EQUIPOS
// ==========================================

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


// ==========================================
// CONVIERTE DD/MM A YYYY-MM-DD
// ==========================================

function convertirFecha(fechaTexto) {
    if (!fechaTexto) return null;

    const partes = fechaTexto.trim().split("/");

    if (partes.length !== 2) {
        return null;
    }

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);

    if (
        isNaN(dia) ||
        isNaN(mes) ||
        dia < 1 ||
        dia > 31 ||
        mes < 1 ||
        mes > 12
    ) {
        return null;
    }

    const ahora = new Date();

    let anio = ahora.getFullYear();

    let fecha = new Date(anio, mes - 1, dia);

    /*
     * Si la fecha ya pasó, suponemos que corresponde
     * al próximo año.
     *
     * Esto permite manejar correctamente partidos
     * de enero/febrero cuando estamos a fin de año.
     */
    const hoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

    if (fecha < hoy) {
        anio++;
    }

    return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}


// ==========================================
// API
// ==========================================

export async function GET(request) {

    try {

        const { searchParams } = new URL(request.url);

        const teamName = searchParams.get("team");

        if (!teamName) {
            return NextResponse.json(
                {
                    error: "Falta el parámetro 'team'"
                },
                {
                    status: 400
                }
            );
        }


        // ==========================================
        // BUSCAR URL DEL EQUIPO
        // ==========================================

        const cleanTeam = teamName
            .toLowerCase()
            .trim();

        const targetUrl = URLS_EQUIPOS[cleanTeam];

        if (!targetUrl) {

            return NextResponse.json(
                {
                    error: `No se encontró la URL para el equipo: ${teamName}`
                },
                {
                    status: 404
                }
            );
        }


        console.log("------------------------------------------");
        console.log(`Consultando fixture: ${teamName}`);
        console.log(`URL: ${targetUrl}`);
        console.log("------------------------------------------");


        // ==========================================
        // CONSULTAR PROMIEDOS
        // ==========================================

        const res = await fetch(targetUrl, {

            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

                "Accept-Language":
                    "es-AR,es;q=0.9,en;q=0.8"
            },

            cache: "no-store"
        });


        if (!res.ok) {

            throw new Error(
                `Promiedos respondió con estado ${res.status}`
            );

        }


        const html = await res.text();

        const $ = cheerio.load(html);


        // ==========================================
        // EXTRAER PRÓXIMOS PARTIDOS
        // ==========================================

        const matches = [];


        $("table tr").each((index, element) => {

            const $row = $(element);

            const cells = $row
                .find("td")
                .map((_, cell) => {
                    return $(cell)
                        .text()
                        .replace(/\s+/g, " ")
                        .trim();
                })
                .get();


            /*
             * Promiedos actualmente entrega:
             *
             * Día | L/V | vs Equipo | Hora
             *
             * Ejemplo:
             *
             * 19/09 | V | Gimnasia | 14:30
             */

            if (cells.length < 4) {
                return;
            }


            const fechaOriginal = cells[0];
            const condicion = cells[1].toUpperCase();
            const rival = cells[2];
            const hora = cells[3];


            // ==========================================
            // VALIDACIONES
            // ==========================================

            if (!fechaOriginal || !condicion || !rival) {
                return;
            }


            // Ignorar encabezados

            if (
                fechaOriginal.toLowerCase().includes("día") ||
                fechaOriginal.toLowerCase().includes("fecha") ||
                rival.toLowerCase().includes("vs equipo") ||
                rival.toLowerCase() === "equipo"
            ) {
                return;
            }


            // Solo aceptamos L o V

            if (condicion !== "L" && condicion !== "V") {
                return;
            }


            // Convertimos fecha DD/MM → YYYY-MM-DD

            const fecha = convertirFecha(fechaOriginal);

            if (!fecha) {
                return;
            }


            // ==========================================
            // DETERMINAR LOCAL Y VISITANTE
            // ==========================================

            let homeTeam = "";
            let awayTeam = "";


            if (condicion === "L") {

                // El equipo buscado juega de local

                homeTeam = teamName;
                awayTeam = rival;

            } else {

                // El equipo buscado juega de visitante

                homeTeam = rival;
                awayTeam = teamName;

            }


            // ==========================================
            // CREAR PARTIDO
            // ==========================================

            matches.push({

                id: `${cleanTeam}-${fecha}-${hora}-${rival}-${index}`,

                date: fecha,

                time: hora,

                league: "Liga Profesional Argentina",

                homeTeam: homeTeam,

                awayTeam: awayTeam,

                // También dejamos estos datos disponibles
                // por compatibilidad.

                local: homeTeam,

                visiting: awayTeam,

                rival: rival,

                condicion: condicion,

                score: null,

                rawText:
                    `${fechaOriginal} ${condicion} ${rival} ${hora}`
                        .trim()
            });

        });


        // ==========================================
        // ELIMINAR DUPLICADOS
        // ==========================================

        const uniqueMatches = [];

        const seen = new Set();


        for (const match of matches) {

            const key =
                `${match.date}|${match.time}|${match.homeTeam}|${match.awayTeam}`
                    .toLowerCase();


            if (!seen.has(key)) {

                seen.add(key);

                uniqueMatches.push(match);

            }

        }


        // ==========================================
        // LIMITAR RESULTADOS
        // ==========================================

        const finalMatches =
            uniqueMatches.slice(0, 20);


        console.log(
            `Partidos encontrados para ${teamName}: ${finalMatches.length}`
        );


        // ==========================================
        // RESPUESTA
        // ==========================================

        return NextResponse.json({

            team: teamName,

            matches: finalMatches,

            nextDateParam: null

        });

    } catch (error) {

        console.error(
            "Error en team-fixture API:",
            error
        );


        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Error interno del servidor al obtener el fixture"
            },
            {
                status: 500
            }
        );

    }

}