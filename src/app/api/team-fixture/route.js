import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

// ==========================================
// URLS DE LOS EQUIPOS DE PRIMERA
// ==========================================

const URLS_EQUIPOS = {
    "argentinos juniors": "https://www.promiedos.com.ar/team/argentinos-juniors/ihf",
    "atletico tucuman": "https://www.promiedos.com.ar/team/atletico-tucuman/iea",
    "banfield": "https://www.promiedos.com.ar/team/banfield/igb",
    "barracas central": "https://www.promiedos.com.ar/team/barracas-central/bbjf",
    "belgrano": "https://www.promiedos.com.ar/team/belgrano/ihb",
    "boca juniors": "https://www.promiedos.com.ar/team/boca-juniors/igg",
    "central cordoba": "https://www.promiedos.com.ar/team/central-cordoba-sde/bhbf",
    "defensa y justicia": "https://www.promiedos.com.ar/team/defensa-y-justicia/hcbh",
    "deportivo riestra": "https://www.promiedos.com.ar/team/deportivo-riestra/bbjea",
    "estudiantes": "https://www.promiedos.com.ar/team/estudiantes/ihb",
    "estudiantes rio cuarto": "https://www.promiedos.com.ar/team/estudiantes-rio-cuarto/cefb",
    "gimnasia la plata": "https://www.promiedos.com.ar/team/gimnasia-la-plata/iia",
    "gimnasia mendoza": "https://www.promiedos.com.ar/team/gimnasia-mendoza/bbjbf",
    "godoy cruz": "https://www.promiedos.com.ar/team/godoy-cruz/ihf",
    "huracan": "https://www.promiedos.com.ar/team/huracan/iie",
    "independiente": "https://www.promiedos.com.ar/team/independiente/igh",
    "independiente rivadavia": "https://www.promiedos.com.ar/team/independiente-rivadavia/ccbe",
    "instituto": "https://www.promiedos.com.ar/team/instituto-ac-cordoba/hchc",
    "lanus": "https://www.promiedos.com.ar/team/lanus/igc",
    "newells": "https://www.promiedos.com.ar/team/newells-old-boys/ihc",
    "platense": "https://www.promiedos.com.ar/team/platense/igb",
    "racing": "https://www.promiedos.com.ar/team/racing-club/ihc",
    "river plate": "https://www.promiedos.com.ar/team/river-plate/igi",
    "rosario central": "https://www.promiedos.com.ar/team/rosario-central/ihc",
    "san lorenzo": "https://www.promiedos.com.ar/team/san-lorenzo/ihc",
    "san martin san juan": "https://www.promiedos.com.ar/team/san-martin-san-juan/cefh",
    "sarmiento": "https://www.promiedos.com.ar/team/sarmiento-junin/ihc",
    "talleres": "https://www.promiedos.com.ar/team/talleres-cordoba/ihc",
    "tigre": "https://www.promiedos.com.ar/team/tigre/ihc",
    "union": "https://www.promiedos.com.ar/team/union-santa-fe/ihc",
    "velez sarsfield": "https://www.promiedos.com.ar/team/velez-sarsfield/ihc"
};

// ==========================================
// NOMBRES
// ==========================================

const NOMBRES_EQUIPOS = {
    "argentinos juniors": "Argentinos Juniors",
    "atletico tucuman": "Atlético Tucumán",
    "banfield": "Banfield",
    "barracas central": "Barracas Central",
    "belgrano": "Belgrano",
    "boca juniors": "Boca Juniors",
    "central cordoba": "Central Córdoba",
    "defensa y justicia": "Defensa y Justicia",
    "deportivo riestra": "Deportivo Riestra",
    "estudiantes": "Estudiantes",
    "estudiantes rio cuarto": "Estudiantes Río Cuarto",
    "gimnasia la plata": "Gimnasia La Plata",
    "gimnasia mendoza": "Gimnasia Mendoza",
    "godoy cruz": "Godoy Cruz",
    "huracan": "Huracán",
    "independiente": "Independiente",
    "independiente rivadavia": "Independiente Rivadavia",
    "instituto": "Instituto",
    "lanus": "Lanús",
    "newells": "Newell's",
    "platense": "Platense",
    "racing": "Racing",
    "river plate": "River Plate",
    "rosario central": "Rosario Central",
    "san lorenzo": "San Lorenzo",
    "san martin san juan": "San Martín San Juan",
    "sarmiento": "Sarmiento",
    "talleres": "Talleres",
    "tigre": "Tigre",
    "union": "Unión",
    "velez sarsfield": "Vélez Sarsfield"
};

// ==========================================
// NORMALIZAR
// ==========================================

function normalizar(texto = "") {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// ==========================================
// FILTRAR RESERVA / JUVENIL / FEMENINO
// ==========================================

function esCompetenciaNoDeseada(texto = "") {
    const t = normalizar(texto);

    return (
        t.includes("reserva") ||
        t.includes("sub 20") ||
        t.includes("sub-20") ||
        t.includes("sub 19") ||
        t.includes("sub-19") ||
        t.includes("sub 17") ||
        t.includes("sub-17") ||
        t.includes("femenino") ||
        t.includes("femenina")
    );
}

// ==========================================
// LISTA
// ==========================================

function obtenerEquipos() {
    return Object.keys(URLS_EQUIPOS)
        .map(id => ({
            id,
            name: NOMBRES_EQUIPOS[id],
            url: URLS_EQUIPOS[id]
        }))
        .sort((a, b) =>
            a.name.localeCompare(b.name, "es")
        );
}

// ==========================================
// EXTRAER PARTIDOS DESDE EL DOM
// ==========================================

async function obtenerFixtureDesdePagina(page, nombreEquipo) {

    return await page.evaluate((nombreEquipo) => {

        const resultados = [];

        const normalizar = texto =>
            (texto || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        const elementos = [
            ...document.querySelectorAll("tr"),
            ...document.querySelectorAll("div"),
            ...document.querySelectorAll("li")
        ];

        for (const elemento of elementos) {

            const texto =
                (elemento.innerText || "")
                    .replace(/\u00a0/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

            if (!texto) continue;

            /*
             * Buscamos exactamente el patrón:
             *
             * 19/09 L Huracán 18:00
             *
             * o
             *
             * 07/10 V Sarmiento 18:30
             */

            const match = texto.match(
                /^(\d{1,2}\/\d{1,2})\s+([LV])\s+(.+?)\s+(\d{1,2}:\d{2})$/
            );

            if (!match) continue;

            const fecha = match[1];
            const condicion = match[2];
            const rival = match[3].trim();
            const hora = match[4];

            if (!rival) continue;

            const rivalNormalizado = normalizar(rival);

            if (
                rivalNormalizado.includes("reserva") ||
                rivalNormalizado.includes("femenino") ||
                rivalNormalizado.includes("femenina") ||
                rivalNormalizado.includes("sub 20") ||
                rivalNormalizado.includes("sub-20") ||
                rivalNormalizado.includes("sub 19") ||
                rivalNormalizado.includes("sub-19")
            ) {
                continue;
            }

            resultados.push({
                fecha,
                condicion,
                rival,
                hora,
                texto
            });
        }

        return resultados;

    }, nombreEquipo);
}

// ==========================================
// GET
// ==========================================

export async function GET(request) {

    let browser = null;

    try {

        const { searchParams } =
            new URL(request.url);

        const list =
            searchParams.get("list");

        const team =
            searchParams.get("team");


        // ======================================
        // LISTA DE EQUIPOS
        // ======================================

        if (list === "true") {

            return NextResponse.json(
                obtenerEquipos()
            );
        }


        // ======================================
        // VALIDAR
        // ======================================

        if (!team) {

            return NextResponse.json(
                {
                    error: "Falta parámetro team"
                },
                {
                    status: 400
                }
            );
        }


        const teamId =
            normalizar(team);

        const url =
            URLS_EQUIPOS[teamId];

        if (!url) {

            return NextResponse.json(
                {
                    error: "Equipo no encontrado",
                    team
                },
                {
                    status: 404
                }
            );
        }


        const nombreEquipo =
            NOMBRES_EQUIPOS[teamId] || team;


        console.log("");
        console.log("======================================");
        console.log("TEAM FIXTURE");
        console.log("Equipo:", nombreEquipo);
        console.log("URL:", url);
        console.log("======================================");


        // ======================================
        // PUPPETEER
        // ======================================

        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-zygote",
                "--single-process"
            ]
        });


        const page =
            await browser.newPage();


        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36"
        );


        await page.setViewport({
            width: 1366,
            height: 768
        });


        console.log("Cargando Promiedos...");


        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000
        });


        console.log(
            "Página cargada:",
            await page.title()
        );


        // ======================================
        // ESPERAR CONTENIDO
        // ======================================

        await new Promise(resolve =>
            setTimeout(resolve, 1500)
        );


        // ======================================
        // EXTRAER
        // ======================================

        let encontrados =
            await obtenerFixtureDesdePagina(
                page,
                nombreEquipo
            );


        console.log(
            "PARTIDOS ENCONTRADOS:",
            encontrados.length
        );


        // ======================================
        // FALLBACK: BUSCAR TEXTO DENTRO DE TODO
        // ======================================

        if (encontrados.length === 0) {

            console.log(
                "No se encontraron filas exactas. Buscando bloques..."
            );


            const textos =
                await page.evaluate(() => {

                    const todos = [];

                    document
                        .querySelectorAll("body *")
                        .forEach(elemento => {

                            const texto =
                                (elemento.innerText || "")
                                    .replace(/\u00a0/g, " ")
                                    .replace(/\s+/g, " ")
                                    .trim();

                            if (
                                texto &&
                                texto.length < 1000 &&
                                /\d{1,2}\/\d{1,2}/.test(texto) &&
                                /\d{1,2}:\d{2}/.test(texto)
                            ) {
                                todos.push(texto);
                            }
                        });

                    return todos;
                });


            for (const texto of textos) {

                const match =
                    texto.match(
                        /(\d{1,2}\/\d{1,2})\s+([LV])\s+(.+?)\s+(\d{1,2}:\d{2})/
                    );

                if (!match) continue;

                const fecha = match[1];
                const condicion = match[2];
                const rival = match[3].trim();
                const hora = match[4];

                if (!rival) continue;

                if (esCompetenciaNoDeseada(rival)) {
                    continue;
                }

                encontrados.push({
                    fecha,
                    condicion,
                    rival,
                    hora,
                    texto
                });
            }
        }


        // ======================================
        // CERRAR BROWSER
        // ======================================

        await browser.close();
        browser = null;


        // ======================================
        // CONVERTIR AL FORMATO DE TU FRONTEND
        // ======================================

        const partidos = [];

        const ids = new Set();


        for (const item of encontrados) {

            const fecha =
                item.fecha;

            const condicion =
                item.condicion;

            const rival =
                item.rival;

            const hora =
                item.hora;


            const id =
                `${teamId}-${fecha}-${condicion}-${normalizar(rival)}-${hora}`;


            if (ids.has(id)) {
                continue;
            }

            ids.add(id);


            let homeTeam;
            let awayTeam;


            if (condicion === "L") {

                homeTeam =
                    nombreEquipo;

                awayTeam =
                    rival;

            } else {

                homeTeam =
                    rival;

                awayTeam =
                    nombreEquipo;
            }


            partidos.push({

                id,

                date: fecha,

                time: hora,

                league:
                    "Liga Profesional Argentina",

                competition:
                    "Liga Profesional Argentina",

                homeTeam,

                awayTeam,

                local:
                    homeTeam,

                visiting:
                    awayTeam,

                rival,

                condicion,

                score: null,

                teams: [
                    {
                        name: homeTeam
                    },
                    {
                        name: awayTeam
                    }
                ],

                rawText:
                    item.texto
            });
        }


        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "RESULTADO:",
            partidos.length,
            "PARTIDOS"
        );
        console.log(
            "======================================"
        );


        for (const partido of partidos) {

            console.log(
                partido.date,
                partido.condicion,
                partido.rival,
                partido.time
            );
        }


        return NextResponse.json({

            team: {
                id: teamId,
                name: nombreEquipo
            },

            matches: partidos,

            fixtures: partidos,

            nextDateParam: null

        });

    } catch (error) {

        console.error(
            "ERROR TEAM FIXTURE:",
            error
        );


        if (browser) {

            try {
                await browser.close();
            } catch {}
        }


        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Error obteniendo fixture"
            },
            {
                status: 500
            }
        );
    }
}