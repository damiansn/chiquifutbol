// ==========================================
// SYNC PROMIEDOS -> REDIS
// ==========================================

import puppeteer from "puppeteer";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const redis = new Redis(process.env.REDIS_URL);

// ==========================================
// CONFIGURACIÓN
// ==========================================

const URLS = {
    today: "https://www.promiedos.com.ar/",
    ayer: "https://www.promiedos.com.ar/ayer",
    manana: "https://www.promiedos.com.ar/man"
};

const REDIS_KEYS = {
    today: "chiquifutbol_matches_v2",
    ayer: "chiquifutbol_matches_ayer",
    manana: "chiquifutbol_matches_manana"
};

// ==========================================
// LIGA PARA TABLAS
// ==========================================

const STANDINGS_URL =
    "https://api.promiedos.com.ar/league/tables_and_fixtures/hc";

// ==========================================
// USER AGENT
// ==========================================

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36";

// ==========================================
// UTILIDADES
// ==========================================

function esObjeto(valor) {
    return valor !== null && typeof valor === "object";
}

function esJuego(obj) {

    if (!esObjeto(obj)) {
        return false;
    }

    return (
        Array.isArray(obj.teams) &&
        obj.teams.length >= 2
    );
}

// ==========================================
// BUSCAR ARRAYS DE JUEGOS RECURSIVAMENTE
// ==========================================

function buscarArraysDeJuegos(
    obj,
    resultados = [],
    ruta = ""
) {

    if (!esObjeto(obj)) {
        return resultados;
    }

    if (Array.isArray(obj)) {

        if (
            obj.length > 0 &&
            obj.some(item => esJuego(item))
        ) {

            resultados.push({
                ruta,
                games: obj.filter(
                    item => esJuego(item)
                )
            });
        }

        for (
            let i = 0;
            i < obj.length;
            i++
        ) {

            buscarArraysDeJuegos(
                obj[i],
                resultados,
                `${ruta}[${i}]`
            );
        }

        return resultados;
    }

    for (
        const key of Object.keys(obj)
    ) {

        const valor = obj[key];

        if (
            Array.isArray(valor) &&
            valor.length > 0 &&
            valor.some(item => esJuego(item))
        ) {

            resultados.push({
                ruta:
                    ruta
                        ? `${ruta}.${key}`
                        : key,

                games:
                    valor.filter(
                        item => esJuego(item)
                    )
            });
        }

        if (esObjeto(valor)) {

            buscarArraysDeJuegos(
                valor,
                resultados,
                ruta
                    ? `${ruta}.${key}`
                    : key
            );
        }
    }

    return resultados;
}

// ==========================================
// BUSCAR LEAGUES
// ==========================================

function buscarLeagues(
    obj,
    resultados = []
) {

    if (!esObjeto(obj)) {
        return resultados;
    }

    if (Array.isArray(obj)) {

        for (const item of obj) {

            buscarLeagues(
                item,
                resultados
            );
        }

        return resultados;
    }

    for (
        const key of Object.keys(obj)
    ) {

        const valor = obj[key];

        if (
            key.toLowerCase() === "leagues" &&
            Array.isArray(valor)
        ) {

            const leaguesValidas =
                valor.filter(
                    league =>
                        esObjeto(league) &&
                        Array.isArray(league.games)
                );

            if (
                leaguesValidas.length > 0
            ) {

                resultados.push(
                    leaguesValidas
                );
            }
        }

        if (esObjeto(valor)) {

            buscarLeagues(
                valor,
                resultados
            );
        }
    }

    return resultados;
}

// ==========================================
// NORMALIZAR LEAGUES
// ==========================================

function normalizarLeagues(
    leagues
) {

    if (!Array.isArray(leagues)) {
        return null;
    }

    const resultado = [];

    for (
        const league of leagues
    ) {

        if (!esObjeto(league)) {
            continue;
        }

        if (
            !Array.isArray(league.games)
        ) {
            continue;
        }

        const games =
            league.games.filter(
                game => esJuego(game)
            );

        if (
            games.length === 0
        ) {
            continue;
        }

        resultado.push({
            ...league,
            games
        });
    }

    if (
        resultado.length === 0
    ) {
        return null;
    }

    return {
        leagues: resultado
    };
}

// ==========================================
// EXTRAER LEAGUES DESDE JSON
// ==========================================

function extraerLeaguesDesdeJSON(
    data
) {

    const encontrados =
        buscarLeagues(data);

    if (
        encontrados.length > 0
    ) {

        encontrados.sort(
            (a, b) => {

                const totalA =
                    a.reduce(
                        (total, league) =>
                            total +
                            (
                                league.games?.length ||
                                0
                            ),
                        0
                    );

                const totalB =
                    b.reduce(
                        (total, league) =>
                            total +
                            (
                                league.games?.length ||
                                0
                            ),
                        0
                    );

                return totalB - totalA;
            }
        );

        const normalizado =
            normalizarLeagues(
                encontrados[0]
            );

        if (normalizado) {
            return normalizado;
        }
    }

    return null;
}

// ==========================================
// RECONSTRUIR LEAGUES DESDE LOS JUEGOS
// ==========================================

function reconstruirLeaguesDesdeJuegos(
    data
) {

    const arrays =
        buscarArraysDeJuegos(data);

    if (
        arrays.length === 0
    ) {
        return null;
    }

    arrays.sort(
        (a, b) =>
            b.games.length -
            a.games.length
    );

    const games =
        arrays[0].games;

    if (
        !games.length
    ) {
        return null;
    }

    const grupos =
        new Map();

    for (
        const game of games
    ) {

        let leagueId = null;
        let leagueName = null;
        let countryName = null;

        if (game.league) {

            if (
                esObjeto(game.league)
            ) {

                leagueId =
                    game.league.id ??
                    game.league.league_id ??
                    null;

                leagueName =
                    game.league.name ??
                    game.league.league_name ??
                    null;

                countryName =
                    game.league.country_name ??
                    game.league.country ??
                    null;

            } else {

                leagueId =
                    game.league;
            }
        }

        if (!leagueId) {

            leagueId =
                game.league_id ??
                game.competition_id ??
                game.tournament_id ??
                null;
        }

        if (!leagueName) {

            leagueName =
                game.league_name ??
                game.competition_name ??
                game.tournament_name ??
                null;
        }

        if (!countryName) {

            countryName =
                game.country_name ??
                game.country ??
                null;
        }

        if (
            !leagueId &&
            game.competition &&
            esObjeto(game.competition)
        ) {

            leagueId =
                game.competition.id ??
                null;

            leagueName =
                game.competition.name ??
                null;
        }

        if (
            !leagueId &&
            !leagueName
        ) {

            leagueId = "otros";
            leagueName = "Partidos";
        }

        const groupKey =
            String(
                leagueId ??
                leagueName ??
                "otros"
            );

        if (
            !grupos.has(groupKey)
        ) {

            grupos.set(
                groupKey,
                {
                    id:
                        leagueId ??
                        groupKey,

                    name:
                        leagueName ??
                        "Partidos",

                    country_name:
                        countryName ??
                        "",

                    games: []
                }
            );
        }

        grupos
            .get(groupKey)
            .games
            .push(game);
    }

    const leagues =
        Array.from(
            grupos.values()
        );

    if (
        !leagues.length
    ) {
        return null;
    }

    return {
        leagues
    };
}

// ==========================================
// EXTRAER NEXT_DATA
// ==========================================

async function obtenerNextData(
    page
) {

    try {

        const data =
            await page.evaluate(() => {

                const script =
                    document.getElementById(
                        "__NEXT_DATA__"
                    );

                if (!script) {
                    return null;
                }

                try {

                    return JSON.parse(
                        script.textContent
                    );

                } catch {

                    return null;
                }
            });

        return data;

    } catch (error) {

        console.log(
            "Error leyendo __NEXT_DATA__:",
            error.message
        );

        return null;
    }
}

// ==========================================
// ESPERAR CARGA
// ==========================================

async function esperarCarga(
    page
) {

    try {

        await page.waitForFunction(
            () => {

                const next =
                    document.getElementById(
                        "__NEXT_DATA__"
                    );

                return !!next;
            },
            {
                timeout: 15000
            }
        );

    } catch {}

    await new Promise(
        resolve =>
            setTimeout(resolve, 5000)
    );
}

// ==========================================
// OBTENER PARTIDOS
// ==========================================

async function obtenerPartidosDesdePagina(
    page,
    url,
    nombreFecha
) {

    console.log(
        `\n------------------------------------------`
    );

    console.log(
        `Buscando partidos de ${nombreFecha}`
    );

    console.log(
        `URL: ${url}`
    );

    console.log(
        `------------------------------------------`
    );

    const respuestasJSON = [];

    const responseHandler =
        async response => {

            try {

                const responseUrl =
                    response.url();

                if (
                    !responseUrl.includes(
                        "api.promiedos.com.ar"
                    )
                ) {
                    return;
                }

                const contentType =
                    response
                        .headers()
                        ["content-type"] ||
                    "";

                if (
                    !contentType.includes("json")
                ) {
                    return;
                }

                const json =
                    await response.json();

                respuestasJSON.push({
                    url: responseUrl,
                    data: json
                });

                console.log(
                    "API Promiedos:",
                    responseUrl
                );

            } catch {}
        };

    page.on(
        "response",
        responseHandler
    );

    await page.goto(
        url,
        {
            waitUntil: "networkidle2",
            timeout: 60000
        }
    );

    await esperarCarga(page);

    const nextData =
        await obtenerNextData(page);

    if (nextData) {

        console.log(
            "__NEXT_DATA__ encontrado."
        );

        const resultadoNext =
            extraerLeaguesDesdeJSON(
                nextData
            );

        if (
            resultadoNext &&
            resultadoNext.leagues.length > 0
        ) {

            const total =
                resultadoNext.leagues.reduce(
                    (total, league) =>
                        total +
                        league.games.length,
                    0
                );

            console.log(
                `Encontrados ${total} partidos mediante __NEXT_DATA__.`
            );

            page.off(
                "response",
                responseHandler
            );

            return resultadoNext;
        }

        const reconstruido =
            reconstruirLeaguesDesdeJuegos(
                nextData
            );

        if (
            reconstruido &&
            reconstruido.leagues.length > 0
        ) {

            const total =
                reconstruido.leagues.reduce(
                    (total, league) =>
                        total +
                        league.games.length,
                    0
                );

            console.log(
                `Encontrados ${total} partidos mediante __NEXT_DATA__ reconstruido.`
            );

            page.off(
                "response",
                responseHandler
            );

            return reconstruido;
        }
    }

    console.log(
        `Analizando ${respuestasJSON.length} respuestas JSON de la API...`
    );

    for (
        const respuesta of respuestasJSON
    ) {

        const data =
            respuesta.data;

        const resultado =
            extraerLeaguesDesdeJSON(
                data
            );

        if (
            resultado &&
            resultado.leagues.length > 0
        ) {

            const total =
                resultado.leagues.reduce(
                    (total, league) =>
                        total +
                        league.games.length,
                    0
                );

            console.log(
                `Encontrados ${total} partidos desde:`
            );

            console.log(
                respuesta.url
            );

            page.off(
                "response",
                responseHandler
            );

            return resultado;
        }

        const reconstruido =
            reconstruirLeaguesDesdeJuegos(
                data
            );

        if (
            reconstruido &&
            reconstruido.leagues.length > 0
        ) {

            const total =
                reconstruido.leagues.reduce(
                    (total, league) =>
                        total +
                        league.games.length,
                    0
                );

            console.log(
                `Reconstruidos ${total} partidos desde:`
            );

            console.log(
                respuesta.url
            );

            page.off(
                "response",
                responseHandler
            );

            return reconstruido;
        }
    }

    page.off(
        "response",
        responseHandler
    );

    console.log(
        `NO se encontraron partidos para ${nombreFecha}.`
    );

    return null;
}

// ==========================================
// GUARDAR PARTIDOS
// ==========================================

async function sincronizarPartidos(
    page
) {

    const fechas = [
        {
            nombre: "AYER",
            param: "ayer"
        },
        {
            nombre: "HOY",
            param: "today"
        },
        {
            nombre: "MAÑANA",
            param: "manana"
        }
    ];

    for (
        const fecha of fechas
    ) {

        try {

            const data =
                await obtenerPartidosDesdePagina(
                    page,
                    URLS[fecha.param],
                    fecha.nombre
                );

            if (
                !data ||
                !data.leagues ||
                !Array.isArray(data.leagues) ||
                data.leagues.length === 0
            ) {

                console.log(
                    `No se actualizará Redis para ${fecha.nombre}.`
                );

                continue;
            }

            const totalPartidos =
                data.leagues.reduce(
                    (total, league) =>
                        total +
                        (
                            Array.isArray(
                                league.games
                            )
                                ? league.games.length
                                : 0
                        ),
                    0
                );

            if (
                totalPartidos === 0
            ) {

                console.log(
                    `0 partidos encontrados para ${fecha.nombre}. No se modifica Redis.`
                );

                continue;
            }

            const redisKey =
                REDIS_KEYS[
                    fecha.param
                ];

            await redis.set(
                redisKey,
                JSON.stringify(data)
            );

            console.log(
                `OK ${fecha.nombre}: ${totalPartidos} partidos guardados en ${redisKey}`
            );

        } catch (error) {

            console.error(
                `Error sincronizando ${fecha.nombre}:`,
                error.message
            );
        }
    }
}

// ==========================================
// EXTRAER NOMBRE DE EQUIPO
// ==========================================

function obtenerNombreEquipo(
    team
) {

    if (!esObjeto(team)) {
        return null;
    }

    return (
        team.name ??
        team.team_name ??
        team.teamName ??
        team.nombre ??
        team.club ??
        team.club_name ??
        team.equipo ??
        null
    );
}

// ==========================================
// DETECTAR SI ES EQUIPO DE TABLA
// ==========================================

function pareceEquipoTabla(
    obj
) {

    if (!esObjeto(obj)) {
        return false;
    }

    const nombre =
        obtenerNombreEquipo(obj);

    if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        return false;
    }

    const tieneDatos =
        obj.points !== undefined ||
        obj.pts !== undefined ||
        obj.puntos !== undefined ||
        obj.played !== undefined ||
        obj.pj !== undefined ||
        obj.games !== undefined ||
        obj.matches !== undefined ||
        obj.partidos !== undefined ||
        obj.goal_difference !== undefined ||
        obj.goal_diff !== undefined ||
        obj.dg !== undefined ||
        obj.difference !== undefined ||
        obj.position !== undefined ||
        obj.pos !== undefined ||
        obj.rank !== undefined;

    return tieneDatos;
}

// ==========================================
// BUSCAR TABLAS RECURSIVAMENTE
// ==========================================

function buscarTablasRecursivamente(
    obj,
    resultado = [],
    ruta = ""
) {

    if (!esObjeto(obj)) {
        return resultado;
    }

    if (Array.isArray(obj)) {

        const equipos =
            obj.filter(
                item =>
                    pareceEquipoTabla(item)
            );

        if (
            equipos.length >= 4
        ) {

            resultado.push({
                ruta,
                teams: equipos
            });
        }

        for (
            let i = 0;
            i < obj.length;
            i++
        ) {

            buscarTablasRecursivamente(
                obj[i],
                resultado,
                `${ruta}[${i}]`
            );
        }

        return resultado;
    }

    for (
        const key of Object.keys(obj)
    ) {

        const valor =
            obj[key];

        if (
            Array.isArray(valor)
        ) {

            const equipos =
                valor.filter(
                    item =>
                        pareceEquipoTabla(item)
                );

            if (
                equipos.length >= 4
            ) {

                resultado.push({

                    ruta:
                        ruta
                            ? `${ruta}.${key}`
                            : key,

                    teams:
                        equipos
                });
            }
        }

        if (
            esObjeto(valor)
        ) {

            buscarTablasRecursivamente(
                valor,
                resultado,
                ruta
                    ? `${ruta}.${key}`
                    : key
            );
        }
    }

    return resultado;
}

// ==========================================
// NORMALIZAR UNA TABLA
// ==========================================

function normalizarTabla(
    tabla
) {

    if (
        !tabla ||
        !Array.isArray(tabla.teams)
    ) {
        return null;
    }

    const teams =
        tabla.teams.map(
            (
                team,
                index
            ) => {

                const nombre =
                    obtenerNombreEquipo(
                        team
                    ) ||
                    "Equipo";

                return {

                    id:
                        team.id ??
                        team.team_id ??
                        team.teamId ??
                        index,

                    name:
                        nombre,

                    position:
                        team.position ??
                        team.pos ??
                        team.rank ??
                        team.order ??
                        index + 1,

                    points:
                        team.points ??
                        team.pts ??
                        team.puntos ??
                        0,

                    played:
                        team.played ??
                        team.pj ??
                        team.games ??
                        team.matches ??
                        team.partidos ??
                        0,

                    goals_for:
                        team.goals_for ??
                        team.gf ??
                        team.goals ??
                        0,

                    goals_against:
                        team.goals_against ??
                        team.ga ??
                        0,

                    goal_difference:
                        team.goal_difference ??
                        team.goal_diff ??
                        team.dg ??
                        team.difference ??
                        0,

                    wins:
                        team.wins ??
                        team.w ??
                        team.ganados ??
                        0,

                    draws:
                        team.draws ??
                        team.d ??
                        team.empates ??
                        0,

                    losses:
                        team.losses ??
                        team.l ??
                        team.perdidos ??
                        0,

                    promedio:
                        team.promedio ??
                        team.average ??
                        team.avg ??
                        null,

                    seasons:
                        team.seasons ??
                        []
                };
            }
        );

    if (
        teams.length === 0
    ) {
        return null;
    }

    return {
        teams
    };
}

// ==========================================
// ELIMINAR TABLAS DUPLICADAS
// ==========================================

function eliminarTablasDuplicadas(
    tablas
) {

    const resultado = [];
    const firmas = new Set();

    for (
        const tabla of tablas
    ) {

        if (
            !tabla ||
            !Array.isArray(tabla.teams)
        ) {
            continue;
        }

        const firma =
            tabla.teams
                .map(
                    team =>
                        String(
                            team.id ??
                            team.team_id ??
                            team.name ??
                            team.team_name
                        )
                )
                .join("|");

        if (
            !firmas.has(firma)
        ) {

            firmas.add(firma);

            resultado.push(
                tabla
            );
        }
    }

    return resultado;
}

// ==========================================
// ESTADÍSTICAS DEL DOM
// ==========================================

async function obtenerEstadisticasDOM(
    page
) {

    try {

        return await page.evaluate(
            () => {

                const resultado = [];

                const tablas =
                    Array.from(
                        document.querySelectorAll(
                            "table"
                        )
                    );

                tablas.forEach(
                    table => {

                        const textoTabla =
                            table.innerText?.trim() ||
                            "";

                        const textoLower =
                            textoTabla.toLowerCase();

                        let category = null;

                        if (
                            textoLower.includes(
                                "goleadores"
                            ) ||
                            textoLower.includes(
                                "goles"
                            )
                        ) {

                            category =
                                "Goleadores";
                        }

                        if (
                            textoLower.includes(
                                "asistencias"
                            ) ||
                            textoLower.includes(
                                "asistidores"
                            )
                        ) {

                            category =
                                "Asistidores";
                        }

                        if (!category) {
                            return;
                        }

                        const rows =
                            Array.from(
                                table.querySelectorAll(
                                    "tr"
                                )
                            );

                        const players = [];

                        rows.forEach(
                            row => {

                                const cells =
                                    Array.from(
                                        row.querySelectorAll(
                                            "th, td"
                                        )
                                    );

                                const textos =
                                    cells
                                        .map(
                                            cell =>
                                                cell.innerText
                                                    .trim()
                                        )
                                        .filter(
                                            Boolean
                                        );

                                if (
                                    textos.length < 2
                                ) {
                                    return;
                                }

                                const primera =
                                    textos[0]
                                        .toLowerCase();

                                if (
                                    primera.includes(
                                        "jugador"
                                    ) ||
                                    primera.includes(
                                        "nombre"
                                    ) ||
                                    primera.includes(
                                        "player"
                                    )
                                ) {
                                    return;
                                }

                                const name =
                                    textos[0];

                                const value =
                                    textos[
                                        textos.length - 1
                                    ];

                                let team = "";

                                if (
                                    textos.length >= 3
                                ) {

                                    team =
                                        textos[1] ||
                                        "";
                                }

                                const enlaces =
                                    Array.from(
                                        row.querySelectorAll(
                                            "a"
                                        )
                                    );

                                for (
                                    const enlace
                                    of enlaces
                                ) {

                                    const href =
                                        enlace.getAttribute(
                                            "href"
                                        ) || "";

                                    const texto =
                                        enlace.innerText
                                            ?.trim() || "";

                                    if (
                                        texto &&
                                        href.includes(
                                            "/team/"
                                        )
                                    ) {

                                        team =
                                            texto;

                                        break;
                                    }
                                }

                                players.push({

                                    name,

                                    team:
                                        team ||
                                        "Sin equipo",

                                    value

                                });
                            }
                        );

                        if (
                            players.length > 0
                        ) {

                            resultado.push({

                                category,

                                players

                            });
                        }
                    }
                );

                return resultado;
            }
        );

    } catch {

        return [];
    }
}

// ==========================================
// SINCRONIZAR TABLAS
// ==========================================

async function sincronizarTablas(
    page
) {

    console.log(
        "\n=========================================="
    );

    console.log(
        "SINCRONIZANDO TABLAS Y ESTADÍSTICAS"
    );

    console.log(
        "=========================================="
    );

    try {

        // ======================================
        // ABRIR PÁGINA DE LIGA
        // ======================================

        await page.goto(
            "https://www.promiedos.com.ar/league/liga-profesional/hc",
            {
                waitUntil: "networkidle2",
                timeout: 60000
            }
        );

        await new Promise(
            resolve =>
                setTimeout(resolve, 5000)
        );

        // ======================================
        // CONSULTAR API DIRECTAMENTE
        // ======================================

        console.log(
            "\nConsultando API de tablas:"
        );

        console.log(
            STANDINGS_URL
        );

        const resultadoAPI =
            await page.evaluate(
                async url => {

                    const response =
                        await fetch(url);

                    const texto =
                        await response.text();

                    return {

                        status:
                            response.status,

                        ok:
                            response.ok,

                        contentType:
                            response.headers.get(
                                "content-type"
                            ),

                        texto

                    };
                },
                STANDINGS_URL
            );

        console.log(
            "\nHTTP API:",
            resultadoAPI.status
        );

        console.log(
            "Content-Type:",
            resultadoAPI.contentType
        );

        if (
            !resultadoAPI.ok
        ) {

            console.log(
                "La API respondió con error."
            );

            console.log(
                resultadoAPI.texto.substring(
                    0,
                    5000
                )
            );

            console.log(
                "No se modifica Redis."
            );

            return;
        }

        // ======================================
        // PARSEAR JSON
        // ======================================

        let dataAPI = null;

        try {

            dataAPI =
                JSON.parse(
                    resultadoAPI.texto
                );

        } catch {

            console.log(
                "La respuesta de la API no es JSON válido."
            );

            console.log(
                resultadoAPI.texto.substring(
                    0,
                    10000
                )
            );

            console.log(
                "No se modifica Redis."
            );

            return;
        }

        // ======================================
        // MOSTRAR RESPUESTA
        // ======================================

        console.log(
            "\n=========================================="
        );

        console.log(
            "RESPUESTA API DE TABLAS"
        );

        console.log(
            "=========================================="
        );

        console.log(
            JSON.stringify(
                dataAPI,
                null,
                2
            ).substring(
                0,
                30000
            )
        );

        console.log(
            "=========================================="
        );

        // ======================================
        // BUSCAR TABLAS
        // ======================================

        const tablasEncontradas =
            buscarTablasRecursivamente(
                dataAPI
            );

        console.log(
            `\nPosibles tablas encontradas: ${tablasEncontradas.length}`
        );

        tablasEncontradas.forEach(
            (tabla, index) => {

                console.log(
                    `\nTABLA ${index + 1}`
                );

                console.log(
                    "Ruta:",
                    tabla.ruta
                );

                console.log(
                    "Equipos:",
                    tabla.teams.length
                );

                console.log(
                    tabla.teams
                        .slice(0, 5)
                        .map(
                            team => ({

                                name:
                                    obtenerNombreEquipo(
                                        team
                                    ),

                                position:
                                    team.position ??
                                    team.pos ??
                                    team.rank,

                                points:
                                    team.points ??
                                    team.pts ??
                                    team.puntos,

                                played:
                                    team.played ??
                                    team.pj ??
                                    team.games ??
                                    team.matches,

                                dg:
                                    team.goal_difference ??
                                    team.goal_diff ??
                                    team.dg ??
                                    team.difference

                            })
                        )
                );
            }
        );

        // ======================================
        // NORMALIZAR
        // ======================================

        const tablasNormalizadas =
            tablasEncontradas
                .map(
                    tabla =>
                        normalizarTabla(
                            tabla
                        )
                )
                .filter(
                    Boolean
                );

        // ======================================
        // ELIMINAR DUPLICADOS
        // ======================================

        const tablasUnicas =
            eliminarTablasDuplicadas(
                tablasNormalizadas
            );

        console.log(
            `\nTablas únicas: ${tablasUnicas.length}`
        );

        // ======================================
        // ESTADÍSTICAS
        // ======================================

        const statsData =
            await obtenerEstadisticasDOM(
                page
            );

        console.log(
            `Estadísticas encontradas: ${statsData.length}`
        );

        // ======================================
        // PREPARAR DATA
        // ======================================

        const data = {

            league: {

                id:
                    "hc",

                name:
                    "Liga Profesional"

            },

            tables:
                tablasUnicas.map(
                    (tabla, index) => ({

                        title:
                            `Tabla ${index + 1}`,

                        teams:
                            tabla.teams

                    })
                ),

            stats:
                statsData

        };

        // ======================================
        // RESUMEN
        // ======================================

        console.log(
            "\n=========================================="
        );

        console.log(
            "RESUMEN TABLAS"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Tablas:",
            data.tables.length
        );

        console.log(
            "Estadísticas:",
            data.stats.length
        );

        if (
            data.tables.length > 0
        ) {

            console.log(
                "\nPrimera tabla:"
            );

            console.log(
                JSON.stringify(
                    data.tables[0],
                    null,
                    2
                ).substring(
                    0,
                    10000
                )
            );
        }

        // ======================================
        // PROTECCIÓN
        // ======================================

        if (
            data.tables.length === 0
        ) {

            console.log(
                "\nNO se encontraron tablas."
            );

            console.log(
                "NO se modifica Redis."
            );

            return;
        }

        // ======================================
        // GUARDAR REDIS
        // ======================================

        await redis.set(
            "chiquifutbol_standings",
            JSON.stringify(data)
        );

        await redis.set(
            "chiquifutbol_standings_1",
            JSON.stringify(data)
        );

        console.log(
            "\n=========================================="
        );

        console.log(
            "TABLAS GUARDADAS CORRECTAMENTE"
        );

        console.log(
            "=========================================="
        );

    } catch (error) {

        console.error(
            "\nError sincronizando tablas:",
            error.message
        );
    }
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

let sincronizacionEnCurso = false;

async function sincronizarTodo() {

    if (
        sincronizacionEnCurso
    ) {

        console.log(
            "Ya hay una sincronización en curso. Se omite esta ejecución."
        );

        return;
    }

    sincronizacionEnCurso = true;

    let browser = null;

    try {

        console.log(
            "\n\n=========================================="
        );

        console.log(
            "INICIANDO SINCRONIZACIÓN PROMIEDOS"
        );

        console.log(
            new Date().toLocaleString(
                "es-AR"
            )
        );

        console.log(
            "=========================================="
        );

        browser =
            await puppeteer.launch({

                headless: "new",

                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            });

        const page =
            await browser.newPage();

        await page.setUserAgent(
            USER_AGENT
        );

        await page.setViewport({
            width: 1366,
            height: 768
        });

        // --------------------------------------
        // PARTIDOS
        // --------------------------------------

        await sincronizarPartidos(
            page
        );

        // --------------------------------------
        // TABLAS
        // --------------------------------------

        await sincronizarTablas(
            page
        );

        console.log(
            "\nSincronización terminada."
        );

    } catch (error) {

        console.error(
            "\nERROR GENERAL:"
        );

        console.error(
            error
        );

    } finally {

        if (browser) {

            try {
                await browser.close();
            } catch {}
        }

        sincronizacionEnCurso =
            false;
    }
}

// ==========================================
// EJECUTAR AHORA
// ==========================================

sincronizarTodo();

// ==========================================
// REPETIR CADA 60 SEGUNDOS
// ==========================================

setInterval(
    sincronizarTodo,
    60 * 1000
);