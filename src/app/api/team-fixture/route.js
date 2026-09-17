import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ==========================================
// URLS DE LOS EQUIPOS DE PRIMERA
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
// NOMBRES PARA MOSTRAR
// ==========================================

const NOMBRES_EQUIPOS = {


"velez sarsfield": "Vélez Sarsfield",
"defensa y justicia": "Defensa y Justicia",
"gimnasia mendoza": "Gimnasia Mendoza",

"instituto": "Instituto",

"boca juniors": "Boca Juniors",

"independiente": "Independiente",

"lanus": "Lanús",

"union": "Unión",

"newells": "Newell's Old Boys",

"san lorenzo": "San Lorenzo",

"estudiantes de la plata": "Estudiantes de La Plata",

"riestra": "Deportivo Riestra",

"platense": "Platense",

"talleres": "Talleres",

"central cordoba": "Central Córdoba",

"argentinos juniors": "Argentinos Juniors",

"sarmiento": "Sarmiento",

"gimnasia la plata": "Gimnasia La Plata",

"rosario central": "Rosario Central",

"independiente rivadavia": "Independiente Rivadavia",

"belgrano": "Belgrano",

"river plate": "River Plate",

"atletico tucuman": "Atlético Tucumán",

"huracan": "Huracán",

"tigre": "Tigre",

"barracas central": "Barracas Central",

"banfield": "Banfield",

"estudiantes rio cuarto": "Estudiantes de Río Cuarto",

"aldosivi": "Aldosivi",

"racing club": "Racing Club"


};

// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(texto) {

return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

}

// ==========================================
// FECHA DD/MM → YYYY-MM-DD
// ==========================================

function convertirFecha(fechaTexto) {

if (!fechaTexto) {
    return null;
}

const texto =
    String(fechaTexto)
        .trim();

const encontrado =
    texto.match(
        /^(\d{1,2})\/(\d{1,2})$/
    );

if (!encontrado) {
    return null;
}

const dia =
    parseInt(
        encontrado[1],
        10
    );

const mes =
    parseInt(
        encontrado[2],
        10
    );

if (
    Number.isNaN(dia) ||
    Number.isNaN(mes) ||
    dia < 1 ||
    dia > 31 ||
    mes < 1 ||
    mes > 12
) {
    return null;
}

const ahora =
    new Date();

let anio =
    ahora.getFullYear();

const fecha =
    new Date(
        anio,
        mes - 1,
        dia
    );

const hoy =
    new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

// Si la fecha ya pasó,
// asumimos próximo año.
if (fecha < hoy) {
    anio++;
}

return (
    `${anio}-` +
    `${String(mes).padStart(2, "0")}-` +
    `${String(dia).padStart(2, "0")}`
);

}

// ==========================================
// RESERVA / JUVENILES / FEMENINO
// ==========================================

function esReservaOJoven(texto) {

const t =
    normalizarTexto(
        texto
    );

const palabrasExcluidas = [

    "reserva",
    "res.",
    " res ",

    "sub 20",
    "sub-20",
    "sub20",

    "sub 19",
    "sub-19",
    "sub19",

    "sub 17",
    "sub-17",
    "sub17",

    "juvenil",
    "juveniles",

    "(w)",

    "femenino",
    "femenina"
];

return palabrasExcluidas.some(
    palabra =>
        t.includes(
            normalizarTexto(
                palabra
            )
        )
);

}

// ==========================================
// LISTA DE EQUIPOS
// ==========================================

function obtenerListaEquipos() {

const equipos = [];

const urlsVistas =
    new Set();

for (
    const [nombre, url]
    of Object.entries(
        URLS_EQUIPOS
    )
) {

    if (
        urlsVistas.has(url)
    ) {
        continue;
    }

    urlsVistas.add(url);

    equipos.push({

        id:
            nombre,

        name:
            NOMBRES_EQUIPOS[nombre] ||
            nombre
                .replace(
                    /\b\w/g,
                    letra =>
                        letra.toUpperCase()
                )
    });
}

equipos.sort(
    (a, b) =>
        a.name.localeCompare(
            b.name,
            "es"
        )
);

return equipos;

}

// ==========================================
// EXTRAER TEXTO DE UNA CELDA
// ==========================================

function textoCelda(
$,
celda
) {

return $(celda)
    .text()
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}

// ==========================================
// BUSCAR FECHA EN UNA FILA
// ==========================================

function buscarFechaEnFila(
cells
) {

for (
    const cell
    of cells
) {

    const encontrado =
        cell.match(
            /^\d{1,2}\/\d{1,2}$/
        );

    if (encontrado) {
        return cell;
    }
}

return null;


}

// ==========================================
// BUSCAR HORA EN UNA FILA
// ==========================================

function buscarHoraEnFila(
cells
) {


for (
    const cell
    of cells
) {

    const encontrado =
        cell.match(
            /^\d{1,2}:\d{2}$/
        );

    if (encontrado) {
        return cell;
    }
}

return null;


}

// ==========================================
// BUSCAR L/V EN UNA FILA
// ==========================================

function buscarCondicionEnFila(
cells
) {


for (
    const cell
    of cells
) {

    const valor =
        cell
            .trim()
            .toUpperCase();

    if (
        valor === "L" ||
        valor === "V"
    ) {

        return valor;
    }
}

return null;


}

// ==========================================
// OBTENER RIVAL
// ==========================================

function buscarRival(
cells,
fecha,
condicion,
hora
) {


for (
    const cell
    of cells
) {

    const valor =
        cell.trim();

    if (!valor) {
        continue;
    }

    if (
        valor === fecha
    ) {
        continue;
    }

    if (
        valor.toUpperCase() ===
        condicion
    ) {
        continue;
    }

    if (
        valor === hora
    ) {
        continue;
    }

    if (
        /^\d{1,2}\/\d{1,2}$/.test(
            valor
        )
    ) {
        continue;
    }

    if (
        /^\d{1,2}:\d{2}$/.test(
            valor
        )
    ) {
        continue;
    }

    const texto =
        normalizarTexto(
            valor
        );

    if (
        texto === "dia" ||
        texto === "día" ||
        texto === "fecha" ||
        texto === "l/v" ||
        texto === "vs equipo"
    ) {
        continue;
    }

    return valor;
}

return null;


}

// ==========================================
// API
// ==========================================

export async function GET(request) {


try {

    const {
        searchParams
    } =
        new URL(
            request.url
        );


    // ======================================
    // LISTA
    // ======================================

    const list =
        searchParams.get(
            "list"
        );

    if (
        list === "true"
    ) {

        return NextResponse.json(
            obtenerListaEquipos()
        );
    }


    // ======================================
    // EQUIPO
    // ======================================

    const teamParam =
        searchParams.get(
            "team"
        );

    if (!teamParam) {

        return NextResponse.json(
            {
                error:
                    "Falta el parámetro 'team'"
            },
            {
                status: 400
            }
        );
    }


    const cleanTeam =
        normalizarTexto(
            teamParam
        );


    const targetUrl =
        URLS_EQUIPOS[
            cleanTeam
        ];


    if (!targetUrl) {

        return NextResponse.json(
            {
                error:
                    `No se encontró la URL para el equipo: ${teamParam}`
            },
            {
                status: 404
            }
        );
    }


    console.log(
        "=========================================="
    );

    console.log(
        `BUSCANDO FIXTURE: ${teamParam}`
    );

    console.log(
        `URL: ${targetUrl}`
    );

    console.log(
        "=========================================="
    );


    // ======================================
    // FETCH PROMIEDOS
    // ======================================

    const res =
        await fetch(
            targetUrl,
            {

                method:
                    "GET",

                headers: {

                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

                    "Accept-Language":
                        "es-AR,es;q=0.9,en;q=0.8",

                    "Cache-Control":
                        "no-cache",

                    "Pragma":
                        "no-cache"
                },

                cache:
                    "no-store"
            }
        );


    if (!res.ok) {

        throw new Error(
            `Promiedos respondió con estado ${res.status}`
        );
    }


    const html =
        await res.text();


    console.log(
        `HTML recibido: ${html.length} caracteres`
    );


    const $ =
        cheerio.load(
            html
        );


    const matches = [];


    // ======================================
    // RECORRER TODAS LAS FILAS
    // ======================================

    $("table tr").each(
        (
            rowIndex,
            rowElement
        ) => {

            const $row =
                $(rowElement);


            const cells =
                $row
                    .find("td")
                    .map(
                        (_, cell) =>
                            textoCelda(
                                $,
                                cell
                            )
                    )
                    .get();


            if (
                cells.length === 0
            ) {
                return;
            }


            // ==================================
            // DEBUG
            // ==================================

            console.log(
                `Fila ${rowIndex}:`,
                cells
            );


            // ==================================
            // BUSCAR COMPONENTES
            // ==================================

            const fecha =
                buscarFechaEnFila(
                    cells
                );

            const condicion =
                buscarCondicionEnFila(
                    cells
                );

            const hora =
                buscarHoraEnFila(
                    cells
                );


            // No es una fila de fixture
            if (
                !fecha ||
                !condicion ||
                !hora
            ) {
                return;
            }


            // ==================================
            // RIVAL
            // ==================================

            const rival =
                buscarRival(
                    cells,
                    fecha,
                    condicion,
                    hora
                );


            if (!rival) {
                return;
            }


            // ==================================
            // FILTRO CATEGORÍAS
            // ==================================

            const filaCompleta =
                cells.join(" ");


            const textoParaFiltrar =
                `${teamParam} ${rival} ${filaCompleta}`;


            if (
                esReservaOJoven(
                    textoParaFiltrar
                )
            ) {

                console.log(
                    `DESCARTADO POR CATEGORÍA: ${textoParaFiltrar}`
                );

                return;
            }


            // ==================================
            // FECHA
            // ==================================

            const fechaISO =
                convertirFecha(
                    fecha
                );


            if (!fechaISO) {
                return;
            }


            // ==================================
            // NOMBRE DEL EQUIPO
            // ==================================

            const nombreEquipo =
                NOMBRES_EQUIPOS[
                    cleanTeam
                ] ||
                teamParam;


            // ==================================
            // LOCAL / VISITANTE
            // ==================================

            let homeTeam;
            let awayTeam;


            if (
                condicion === "L"
            ) {

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


            // ==================================
            // GUARDAR
            // ==================================

            matches.push({

                id:
                    `${cleanTeam}-${fechaISO}-${hora}-${rival}-${rowIndex}`,

                date:
                    fechaISO,

                time:
                    hora,

                league:
                    "Liga Profesional Argentina",

                homeTeam:
                    homeTeam,

                awayTeam:
                    awayTeam,

                local:
                    homeTeam,

                visiting:
                    awayTeam,

                rival:
                    rival,

                condicion:
                    condicion,

                score:
                    null,

                rawText:
                    `${fecha} ${condicion} ${rival} ${hora}`
            });

        }
    );


    // ==========================================
    // ELIMINAR DUPLICADOS
    // ==========================================

    const uniqueMatches = [];

    const seen =
        new Set();


    for (
        const match
        of matches
    ) {

        const key =
            [
                match.date,
                match.time,
                normalizarTexto(
                    match.homeTeam
                ),
                normalizarTexto(
                    match.awayTeam
                )
            ].join("|");


        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);

        uniqueMatches.push(
            match
        );
    }


    // ==========================================
    // ORDENAR
    // ==========================================

    uniqueMatches.sort(
        (a, b) => {

            const fechaA =
                new Date(
                    `${a.date}T${a.time || "00:00"}`
                );

            const fechaB =
                new Date(
                    `${b.date}T${b.time || "00:00"}`
                );

            return (
                fechaA - fechaB
            );
        }
    );


    // ==========================================
    // SOLO PRÓXIMOS 20
    // ==========================================

    const finalMatches =
        uniqueMatches.slice(
            0,
            20
        );


    console.log(
        "=========================================="
    );

    console.log(
        `PARTIDOS ENCONTRADOS: ${matches.length}`
    );

    console.log(
        `PARTIDOS ÚNICOS: ${uniqueMatches.length}`
    );

    console.log(
        `PARTIDOS FINALES: ${finalMatches.length}`
    );

    console.log(
        "=========================================="
    );


    // ==========================================
    // RESPUESTA
    // ==========================================

    return NextResponse.json({

        team:
            teamParam,

        matches:
            finalMatches,

        nextDateParam:
            null
    });


} catch (error) {

    console.error(
        "ERROR EN TEAM-FIXTURE:"
    );

    console.error(
        error
    );


    return NextResponse.json(
        {
            error:
                error?.message ||
                "Error interno del servidor"
        },
        {
            status: 500
        }
    );
}


}
