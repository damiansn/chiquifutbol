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
    if (!esObjeto(obj)) return false;

    return (
        Array.isArray(obj.teams) &&
        obj.teams.length >= 2
    );
}

function tieneGames(obj) {
    return (
        esObjeto(obj) &&
        Array.isArray(obj.games) &&
        obj.games.some((game) => esJuego(game))
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
            obj.some((item) => esJuego(item))
        ) {

            resultados.push({
                ruta,
                games: obj.filter(
                    (item) => esJuego(item)
                )
            });
        }

        for (let i = 0; i < obj.length; i++) {

            buscarArraysDeJuegos(
                obj[i],
                resultados,
                `${ruta}[${i}]`
            );
        }

        return resultados;
    }

    for (const key of Object.keys(obj)) {

        const valor = obj[key];

        if (
            Array.isArray(valor) &&
            valor.length > 0 &&
            valor.some((item) => esJuego(item))
        ) {

            resultados.push({
                ruta: ruta
                    ? `${ruta}.${key}`
                    : key,

                games: valor.filter(
                    (item) => esJuego(item)
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
// BUSCAR "LEAGUES" DIRECTAMENTE
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

    for (const key of Object.keys(obj)) {

        const valor = obj[key];

        if (
            key.toLowerCase() === "leagues" &&
            Array.isArray(valor)
        ) {

            const leaguesValidas =
                valor.filter(
                    (league) =>
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

    for (const league of leagues) {

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
                (game) => esJuego(game)
            );

        if (games.length === 0) {
            continue;
        }

        resultado.push({
            ...league,
            games
        });
    }

    if (resultado.length === 0) {
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

    if (!games.length) {
        return null;
    }

    const grupos =
        new Map();

    for (const game of games) {

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
// ESPERAR A QUE PROMIEDOS CARGUE
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

    } catch {
        // No hacemos nada.
    }

    await new Promise(
        (resolve) =>
            setTimeout(resolve, 5000)
    );
}

// ==========================================
// OBTENER PARTIDOS DE UNA PÁGINA
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
        async (response) => {

            try {

                const responseUrl =
                    response.url();

                if (
                    responseUrl.includes(
                        "api.promiedos.com.ar"
                    )
                ) {

                    const contentType =
                        response
                            .headers()
                            ["content-type"] ||
                        "";

                    if (
                        !contentType.includes(
                            "json"
                        )
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
                }

            } catch {
                // Ignorar respuestas no JSON.
            }
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
// SINCRONIZAR TABLAS Y ESTADÍSTICAS
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
            (resolve) =>
                setTimeout(resolve, 5000)
        );

        // ======================================
        // OBTENER __NEXT_DATA__
        // ======================================

        const nextData =
            await obtenerNextData(page);

        // ======================================
        // DEBUG
        // ======================================

        console.log(
            "\n========== ESTRUCTURA DE NEXT_DATA =========="
        );

        console.log(
            JSON.stringify(
                nextData,
                null,
                2
            ).substring(
                0,
                20000
            )
        );

        console.log(
            "========== FIN NEXT_DATA ==========\n"
        );

        // ======================================
        // COMPROBAR NEXT_DATA
        // ======================================

        if (!nextData) {

            console.log(
                "No se encontró __NEXT_DATA__ en la página de Liga."
            );

            return;
        }

        console.log(
            "__NEXT_DATA__ encontrado para tablas."
        );

        // ======================================
        // BUSCAR RECURSIVAMENTE TABLAS
        // ======================================

        const tablesFromJSON =
            nextData;

        // ======================================
        // FUNCIÓN PARA DETERMINAR EQUIPO
        // ======================================

        function pareceEquipo(
            obj
        ) {

            if (!esObjeto(obj)) {
                return false;
            }

            const tieneNombre =
                typeof obj.name === "string" ||
                typeof obj.team_name === "string" ||
                typeof obj.nombre === "string";

            const tieneDatosTabla =
                obj.points !== undefined ||
                obj.pts !== undefined ||
                obj.played !== undefined ||
                obj.pj !== undefined ||
                obj.goal_difference !== undefined ||
                obj.dg !== undefined ||
                obj.position !== undefined;

            return (
                tieneNombre &&
                tieneDatosTabla
            );
        }

        // ======================================
        // BUSCAR ARRAYS DE EQUIPOS
        // ======================================

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
                        (item) =>
                            pareceEquipo(item)
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
                            (item) =>
                                pareceEquipo(item)
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

        const tablasEncontradas =
            buscarTablasRecursivamente(
                tablesFromJSON
            );

        console.log(
            `Posibles tablas encontradas: ${tablasEncontradas.length}`
        );

        // ======================================
        // MOSTRAR TABLAS EN CONSOLA
        // ======================================

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
                        .slice(0, 3)
                        .map(
                            (team) => ({
                                name:
                                    team.name ??
                                    team.team_name ??
                                    team.nombre,

                                position:
                                    team.position ??
                                    team.pos,

                                points:
                                    team.points ??
                                    team.pts,

                                played:
                                    team.played ??
                                    team.pj,

                                dg:
                                    team.goal_difference ??
                                    team.dg
                            })
                        )
                );
            }
        );

        // ======================================
        // ELIMINAR DUPLICADOS
        // ======================================

        const tablasUnicas = [];

        const firmas =
            new Set();

        for (
            const tabla of tablasEncontradas
        ) {

            const firma =
                tabla.teams
                    .map(
                        (team) =>
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

                tablasUnicas.push(
                    tabla
                );
            }
        }

        console.log(
            `Tablas únicas: ${tablasUnicas.length}`
        );

        // ======================================
        // CONVERTIR TABLAS
        // ======================================

        const tablesData =
            tablasUnicas.map(
                (tabla, index) => {

                    const teams =
                        tabla.teams.map(
                            (
                                team,
                                teamIndex
                            ) => {

                                return {

                                    id:
                                        team.id ??
                                        team.team_id ??
                                        teamIndex,

                                    name:
                                        team.name ??
                                        team.team_name ??
                                        team.nombre ??
                                        "Equipo",

                                    position:
                                        team.position ??
                                        team.pos ??
                                        teamIndex + 1,

                                    points:
                                        team.points ??
                                        team.pts ??
                                        0,

                                    played:
                                        team.played ??
                                        team.pj ??
                                        0,

                                    goal_difference:
                                        team.goal_difference ??
                                        team.dg ??
                                        0,

                                    seasons:
                                        team.seasons ??
                                        []
                                };
                            }
                        );

                    return {

                        title:
                            `Tabla ${index + 1}`,

                        teams
                    };
                }
            );

       // ======================================
// ESTADÍSTICAS PERSONALES
// ======================================

const statsData =
    await page.evaluate(
        () => {

            const resultado = [];

            const tablas =
                Array.from(
                    document.querySelectorAll(
                        "table"
                    )
                );

            tablas.forEach(
                (table) => {

                    const textoTabla =
                        table.innerText?.trim() ||
                        "";

                    const textoLower =
                        textoTabla.toLowerCase();

                    let category =
                        null;

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
                        (row) => {

                            const cells =
                                Array.from(
                                    row.querySelectorAll(
                                        "th, td"
                                    )
                                );

                            const textos =
                                cells
                                    .map(
                                        (cell) =>
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

                            // ----------------------------------
                            // IGNORAR ENCABEZADOS
                            // ----------------------------------

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

                            // ----------------------------------
                            // NOMBRE
                            // ----------------------------------

                            const name =
                                textos[0];

                            // ----------------------------------
                            // VALOR
                            // ----------------------------------

                            const value =
                                textos[
                                    textos.length - 1
                                ];

                            if (
                                !name ||
                                !value
                            ) {
                                return;
                            }

                            // ----------------------------------
                            // BUSCAR EQUIPO
                            // ----------------------------------

                            let team = "";

                            // 1. Buscar una celda cuyo
                            //    contenido parezca ser
                            //    el equipo.
                            //
                            //    Normalmente estará entre
                            //    el nombre y el valor.

                            if (
                                textos.length >= 3
                            ) {

                                team =
                                    textos[1] || "";
                            }

                            // ----------------------------------
                            // 2. Buscar enlace del equipo
                            // ----------------------------------

                            const enlaces =
                                Array.from(
                                    row.querySelectorAll(
                                        "a"
                                    )
                                );

                            for (
                                const enlace of enlaces
                            ) {

                                const href =
                                    enlace
                                        .getAttribute(
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

                            // ----------------------------------
                            // 3. Buscar atributo title
                            // ----------------------------------

                            if (!team) {

                                const elementos =
                                    Array.from(
                                        row.querySelectorAll(
                                            "[title]"
                                        )
                                    );

                                for (
                                    const elemento
                                    of elementos
                                ) {

                                    const title =
                                        elemento
                                            .getAttribute(
                                                "title"
                                            )
                                            ?.trim() || "";

                                    if (
                                        title &&
                                        title !== name
                                    ) {

                                        team =
                                            title;

                                        break;
                                    }
                                }
                            }

                            // ----------------------------------
                            // GUARDAR JUGADOR
                            // ----------------------------------

                            players.push({

                                name,

                                team:
                                    team || "Sin equipo",

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

        // ======================================
        // GUARDAR TODO
        // ======================================

        const data = {

            tables:
                tablesData,

            stats:
                statsData
        };

        // ======================================
        // RESUMEN
        // ======================================

        console.log(
            "\n------------------------------------------"
        );

        console.log(
            "RESUMEN TABLAS"
        );

        console.log(
            "Tablas:",
            data.tables.length
        );

        console.log(
            "Estadísticas:",
            data.stats.length
        );

        console.log(
            "------------------------------------------"
        );

        // ======================================
        // PROTECCIÓN
        // ======================================

        if (
            !data.tables ||
            data.tables.length === 0
        ) {

            console.log(
                "NO se encontraron tablas de posiciones."
            );

            console.log(
                "No se modifica Redis."
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
            "Tablas y estadísticas guardadas correctamente."
        );

    } catch (error) {

        console.error(
            "Error sincronizando tablas:",
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