import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ==========================================
// EQUIPOS DE PRIMERA
// ==========================================

const URLS_EQUIPOS = {
    "argentinos juniors":
        "https://www.promiedos.com.ar/team/argentinos-juniors/ihf",

    "atletico tucuman":
        "https://www.promiedos.com.ar/team/atletico-tucuman/iea",

    "banfield":
        "https://www.promiedos.com.ar/team/banfield/igb",

    "barracas central":
        "https://www.promiedos.com.ar/team/barracas-central/bbjf",

    "belgrano":
        "https://www.promiedos.com.ar/team/belgrano/ihb",

    "boca juniors":
        "https://www.promiedos.com.ar/team/boca-juniors/igg",

    "central cordoba":
        "https://www.promiedos.com.ar/team/central-cordoba-sde/bhbf",

    "defensa y justicia":
        "https://www.promiedos.com.ar/team/defensa-y-justicia/hcbh",

    "deportivo riestra":
        "https://www.promiedos.com.ar/team/deportivo-riestra/bbjea",

    "estudiantes":
        "https://www.promiedos.com.ar/team/estudiantes/ihb",

    "estudiantes rio cuarto":
        "https://www.promiedos.com.ar/team/estudiantes-rio-cuarto/cefb",

    "gimnasia la plata":
        "https://www.promiedos.com.ar/team/gimnasia-la-plata/iia",

    "gimnasia mendoza":
        "https://www.promiedos.com.ar/team/gimnasia-mendoza/bbjbf",

    "godoy cruz":
        "https://www.promiedos.com.ar/team/godoy-cruz/ihf",

    "huracan":
        "https://www.promiedos.com.ar/team/huracan/iie",

    "independiente":
        "https://www.promiedos.com.ar/team/independiente/igh",

    "independiente rivadavia":
        "https://www.promiedos.com.ar/team/independiente-rivadavia/ccbe",

    "instituto":
        "https://www.promiedos.com.ar/team/instituto-ac-cordoba/hchc",

    "lanus":
        "https://www.promiedos.com.ar/team/lanus/igc",

    "newells":
        "https://www.promiedos.com.ar/team/newells-old-boys/ihc",

    "platense":
        "https://www.promiedos.com.ar/team/platense/igb",

    "racing":
        "https://www.promiedos.com.ar/team/racing-club/ihc",

    "river plate":
        "https://www.promiedos.com.ar/team/river-plate/igi",

    "rosario central":
        "https://www.promiedos.com.ar/team/rosario-central/ihc",

    "san lorenzo":
        "https://www.promiedos.com.ar/team/san-lorenzo/ihc",

    "san martin san juan":
        "https://www.promiedos.com.ar/team/san-martin-san-juan/cefh",

    "sarmiento":
        "https://www.promiedos.com.ar/team/sarmiento-junin/ihc",

    "talleres":
        "https://www.promiedos.com.ar/team/talleres-cordoba/ihc",

    "tigre":
        "https://www.promiedos.com.ar/team/tigre/ihc",

    "union":
        "https://www.promiedos.com.ar/team/union-santa-fe/ihc",

    "velez sarsfield":
        "https://www.promiedos.com.ar/team/velez-sarsfield/ihc",
};


// ==========================================
// NOMBRES PARA MOSTRAR
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
    "velez sarsfield": "Vélez Sarsfield",
};


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(texto = "") {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}


// ==========================================
// DETECTAR RESERVA / JUVENIL / FEMENINO
// ==========================================

function esReservaOJoven(texto = "") {
    const t = normalizarTexto(texto);

    return (
        t.includes("reserva") ||
        t.includes("reserve") ||
        t.includes("(r)") ||
        t.includes("sub 20") ||
        t.includes("sub-20") ||
        t.includes("sub 19") ||
        t.includes("sub-19") ||
        t.includes("sub 17") ||
        t.includes("sub-17") ||
        t.includes("(w)") ||
        t.includes("femenino") ||
        t.includes("femenina")
    );
}


// ==========================================
// CONVERTIR FECHA
// ==========================================

function convertirFecha(fecha) {
    const match = fecha.match(/^(\d{1,2})\/(\d{1,2})$/);

    if (!match) return null;

    const dia = Number(match[1]);
    const mes = Number(match[2]);

    const ahora = new Date();

    let anio = ahora.getFullYear();

    // Si el mes está muy atrás, probablemente pertenece al año siguiente.
    if (mes < ahora.getMonth() + 1 - 6) {
        anio++;
    }

    return new Date(
        anio,
        mes - 1,
        dia
    );
}


// ==========================================
// OBTENER LISTA
// ==========================================

function obtenerListaEquipos() {

    return Object.entries(URLS_EQUIPOS)
        .map(([id, url]) => ({
            id,
            name: NOMBRES_EQUIPOS[id] || id,
            url
        }))
        .sort((a, b) =>
            a.name.localeCompare(b.name, "es")
        );
}


// ==========================================
// EXTRAER PARTIDOS DESDE TEXTO
// ==========================================
//
// Buscamos directamente patrones como:
//
// 19/09 L Huracán 18:00
// 07/10 V Sarmiento 18:30
//
// Esto evita depender de la estructura exacta
// de las tablas HTML.
// ==========================================

function extraerPartidosDesdeTexto(texto, equipo) {

    const partidos = [];

    if (!texto) return partidos;

    // Normalizamos espacios
    texto = texto
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    console.log("==========================================");
    console.log("TEXTO PARA BUSCAR PARTIDOS");
    console.log("==========================================");
    console.log(texto.substring(0, 5000));

    // ------------------------------------------------
    // MÉTODO 1
    // Buscar directamente:
    //
    // DD/MM L Rival HH:MM
    // DD/MM V Rival HH:MM
    // ------------------------------------------------

    const regex =
        /(\d{1,2}\/\d{1,2})\s+([LV])\s+(.+?)\s+(\d{1,2}:\d{2})/gi;

    let match;

    while ((match = regex.exec(texto)) !== null) {

        const fecha = match[1];
        const condicion = match[2].toUpperCase();
        let rival = match[3].trim();
        const hora = match[4];

        // Limpiar basura típica
        rival = rival
            .replace(/^Image:\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();

        // Si capturamos demasiado texto, cortar
        const cortes = [
            "Resultados",
            "PLANTEL",
            "Jugadores",
            "ESTADISTICAS",
            "ESTADÍSTICAS",
            "PRÓXIMOS",
            "PROXIMOS"
        ];

        for (const corte of cortes) {
            const pos = rival.indexOf(corte);

            if (pos !== -1) {
                rival = rival.substring(0, pos).trim();
            }
        }

        if (!rival) continue;

        if (esReservaOJoven(rival)) continue;

        // Evitar que tome títulos o basura
        if (
            normalizarTexto(rival).includes("dia") ||
            normalizarTexto(rival).includes("hora") ||
            normalizarTexto(rival).includes("equipo")
        ) {
            continue;
        }

        const fechaObj = convertirFecha(fecha);

        if (!fechaObj) continue;

        // --------------------------------------------
        // Local / visitante
        // --------------------------------------------

        const equipoNombre =
            NOMBRES_EQUIPOS[normalizarTexto(equipo)] ||
            equipo;

        let homeTeam;
        let awayTeam;

        if (condicion === "L") {

            homeTeam = equipoNombre;
            awayTeam = rival;

        } else {

            homeTeam = rival;
            awayTeam = equipoNombre;
        }

        partidos.push({

            id:
                `${normalizarTexto(equipoNombre)}-${fecha}-${hora}-${normalizarTexto(rival)}`,

            date: fecha,

            time: hora,

            league: "Liga Profesional Argentina",

            competition: "Liga Profesional Argentina",

            homeTeam,

            awayTeam,

            local: homeTeam,

            visiting: awayTeam,

            rival,

            condicion,

            score: null,

            // IMPORTANTE:
            // tu page.js busca fixture.teams
            teams: [
                {
                    name: homeTeam
                },
                {
                    name: awayTeam
                }
            ],

            rawText: match[0]
        });
    }

    return partidos;
}


// ==========================================
// GET
// ==========================================

export async function GET(request) {

    try {

        const { searchParams } =
            new URL(request.url);

        const list =
            searchParams.get("list");

        const team =
            searchParams.get("team");

        // ==========================================
        // LISTA DE EQUIPOS
        // ==========================================

        if (list === "true") {

            const equipos =
                obtenerListaEquipos();

            console.log(
                "LISTA EQUIPOS:",
                equipos.length
            );

            return NextResponse.json(equipos);
        }


        // ==========================================
        // VALIDAR EQUIPO
        // ==========================================

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


        // ==========================================
        // BUSCAR POR ID
        // ==========================================

        const teamId =
            normalizarTexto(team);

        const url =
            URLS_EQUIPOS[teamId];

        if (!url) {

            console.log(
                "EQUIPO NO ENCONTRADO:",
                team
            );

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
            NOMBRES_EQUIPOS[teamId] ||
            team;


        console.log("");
        console.log("==========================================");
        console.log("BUSCANDO FIXTURE");
        console.log("EQUIPO:", nombreEquipo);
        console.log("ID:", teamId);
        console.log("URL:", url);
        console.log("==========================================");


        // ==========================================
        // FETCH PROMIEDOS
        // ==========================================

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",

                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

                "Accept-Language":
                    "es-AR,es;q=0.9,en;q=0.8",

                "Cache-Control":
                    "no-cache"
            },

            cache: "no-store"
        });


        console.log(
            "STATUS PROMIEDOS:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `Promiedos respondió ${response.status}`
            );
        }


        const html =
            await response.text();


        console.log(
            "HTML RECIBIDO:",
            html.length,
            "caracteres"
        );


        // ==========================================
        // CHEERIO
        // ==========================================

        const $ =
            cheerio.load(html);


        // ==========================================
        // PRIMERO INTENTAMOS ENCONTRAR
        // LA SECCIÓN PRÓXIMOS PARTIDOS
        // ==========================================

        let textoFixture = "";


        $("body *").each(function () {

            const texto =
                $(this)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

            if (!texto) return;


            const normal =
                normalizarTexto(texto);


            if (
                normal.includes("proximos partidos") &&
                texto.length < 3000
            ) {

                // Nos quedamos con el bloque
                // más pequeño que contenga la sección.

                if (
                    !textoFixture ||
                    texto.length < textoFixture.length
                ) {

                    textoFixture = texto;
                }
            }
        });


        console.log("");
        console.log("==========================================");
        console.log("BLOQUE FIXTURE ENCONTRADO");
        console.log("==========================================");
        console.log(
            textoFixture || "NO ENCONTRADO"
        );


        // ==========================================
        // SI NO ENCONTRAMOS EL BLOQUE,
        // USAMOS TODO EL BODY
        // ==========================================

        if (!textoFixture) {

            textoFixture =
                $("body")
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();
        }


        // ==========================================
        // EXTRAER
        // ==========================================

        let matches =
            extraerPartidosDesdeTexto(
                textoFixture,
                nombreEquipo
            );


        // ==========================================
        // SEGUNDO INTENTO:
        // TODO EL HTML/TEXTO
        // ==========================================

        if (matches.length === 0) {

            console.log(
                "PRIMER MÉTODO SIN RESULTADOS."
            );

            const bodyText =
                $("body")
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

            matches =
                extraerPartidosDesdeTexto(
                    bodyText,
                    nombreEquipo
                );
        }


        // ==========================================
        // ELIMINAR DUPLICADOS
        // ==========================================

        const unicos = [];

        const ids = new Set();

        for (const partido of matches) {

            if (ids.has(partido.id)) {
                continue;
            }

            ids.add(partido.id);

            unicos.push(partido);
        }


        // ==========================================
        // ORDENAR POR FECHA
        // ==========================================

        unicos.sort((a, b) => {

            const da =
                convertirFecha(a.date);

            const db =
                convertirFecha(b.date);

            if (!da || !db) return 0;

            return da - db;
        });


        console.log("");
        console.log("==========================================");
        console.log("RESULTADO FINAL");
        console.log("EQUIPO:", nombreEquipo);
        console.log("PARTIDOS:", unicos.length);
        console.log("==========================================");

        for (const partido of unicos) {

            console.log(
                `${partido.date} ${partido.condicion} ${partido.rival} ${partido.time}`
            );
        }


        // ==========================================
        // RESPUESTA
        // ==========================================

        return NextResponse.json({

            team: {
                id: teamId,
                name: nombreEquipo
            },

            matches: unicos,

            // Compatibilidad
            fixtures: unicos,

            nextDateParam: null
        });

    } catch (error) {

        console.error(
            "ERROR TEAM FIXTURE:",
            error
        );

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