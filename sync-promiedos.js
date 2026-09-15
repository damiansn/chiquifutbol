// ==========================================
// SYNC PROMIEDOS -> REDIS
// ==========================================

const puppeteer = require("puppeteer");
const Redis = require("ioredis");
const dotenv = require("dotenv");

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

function buscarArraysDeJuegos(obj, resultados = [], ruta = "") {

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
                games: obj.filter((item) => esJuego(item))
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
                ruta: ruta ? `${ruta}.${key}` : key,
                games: valor.filter((item) => esJuego(item))
            });
        }

        if (esObjeto(valor)) {
            buscarArraysDeJuegos(
                valor,
                resultados,
                ruta ? `${ruta}.${key}` : key
            );
        }
    }

    return resultados;
}

// ==========================================
// BUSCAR "LEAGUES" DIRECTAMENTE
// ==========================================

function buscarLeagues(obj, resultados = []) {

    if (!esObjeto(obj)) {
        return resultados;
    }

    if (Array.isArray(obj)) {

        for (const item of obj) {
            buscarLeagues(item, resultados);
        }

        return resultados;
    }

    for (const key of Object.keys(obj)) {

        const valor = obj[key];

        if (
            key.toLowerCase() === "leagues" &&
            Array.isArray(valor)
        ) {

            const leaguesValidas = valor.filter(
                (league) =>
                    esObjeto(league) &&
                    Array.isArray(league.games)
            );

            if (leaguesValidas.length > 0) {
                resultados.push(leaguesValidas);
            }
        }

        if (esObjeto(valor)) {
            buscarLeagues(valor, resultados);
        }
    }

    return resultados;
}

// ==========================================
// NORMALIZAR LEAGUES
// ==========================================

function normalizarLeagues(leagues) {

    if (!Array.isArray(leagues)) {
        return null;
    }

    const resultado = [];

    for (const league of leagues) {

        if (!esObjeto(league)) continue;

        if (!Array.isArray(league.games)) continue;

        const games = league.games.filter(
            (game) => esJuego(game)
        );

        if (games.length === 0) continue;

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
// INTENTAR EXTRAER LEAGUES DE CUALQUIER JSON
// ==========================================

function extraerLeaguesDesdeJSON(data) {

    // --------------------------------------
    // CASO 1:
    // El JSON ya tiene leagues
    // --------------------------------------

    const encontrados = buscarLeagues(data);

    if (encontrados.length > 0) {

        // Elegimos el bloque con más partidos
        encontrados.sort((a, b) => {

            const totalA = a.reduce(
                (total, league) =>
                    total + (league.games?.length || 0),
                0
            );

            const totalB = b.reduce(
                (total, league) =>
                    total + (league.games?.length || 0),
                0
            );

            return totalB - totalA;
        });

        const normalizado = normalizarLeagues(
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

function reconstruirLeaguesDesdeJuegos(data) {

    const arrays = buscarArraysDeJuegos(data);

    if (arrays.length === 0) {
        return null;
    }

    // Elegimos el array que tenga más partidos
    arrays.sort(
        (a, b) => b.games.length - a.games.length
    );

    const games = arrays[0].games;

    if (!games.length) {
        return null;
    }

    const grupos = new Map();

    for (const game of games) {

        let leagueId = null;
        let leagueName = null;
        let countryName = null;

        // --------------------------------------
        // Posibles lugares donde Promiedos puede
        // tener la información de la competición
        // --------------------------------------

        if (game.league) {

            if (esObjeto(game.league)) {

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

                leagueId = game.league;
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

        // --------------------------------------
        // Si no encontramos liga, intentamos usar
        // competition
        // --------------------------------------

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

        // --------------------------------------
        // Último recurso:
        // agrupar por nombre
        // --------------------------------------

        if (!leagueId && !leagueName) {
            leagueId = "otros";
            leagueName = "Partidos";
        }

        const groupKey =
            String(
                leagueId ??
                leagueName ??
                "otros"
            );

        if (!grupos.has(groupKey)) {

            grupos.set(groupKey, {
                id: leagueId ?? groupKey,
                name: leagueName ?? "Partidos",
                country_name: countryName ?? "",
                games: []
            });
        }

        grupos.get(groupKey).games.push(game);
    }

    const leagues = Array.from(
        grupos.values()
    );

    if (!leagues.length) {
        return null;
    }

    return {
        leagues
    };
}

// ==========================================
// EXTRAER NEXT_DATA
// ==========================================

async function obtenerNextData(page) {

    try {

        const data = await page.evaluate(() => {

            const script =
                document.getElementById("__NEXT_DATA__");

            if (!script) {
                return null;
            }

            try {
                return JSON.parse(script.textContent);
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

async function esperarCarga(page) {

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

    // Esperamos además la hidratación de Next
    await new Promise((resolve) =>
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

    // --------------------------------------
    // Capturamos respuestas JSON de Promiedos
    // --------------------------------------

    const respuestasJSON = [];

    const responseHandler = async (response) => {

        try {

            const responseUrl =
                response.url();

            // Nos interesan especialmente las
            // respuestas de la API de Promiedos
            if (
                responseUrl.includes(
                    "api.promiedos.com.ar"
                )
            ) {

                const contentType =
                    response.headers()["content-type"] ||
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
            }

        } catch {
            // Algunas respuestas pueden no ser JSON.
        }
    };

    page.on(
        "response",
        responseHandler
    );

    // --------------------------------------
    // Abrimos la página
    // --------------------------------------

    await page.goto(
        url,
        {
            waitUntil: "networkidle2",
            timeout: 60000
        }
    );

    await esperarCarga(page);

    // --------------------------------------
    // 1. Primero probamos __NEXT_DATA__
    // --------------------------------------

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

        // ----------------------------------
        // Si no encontramos leagues,
        // intentamos reconstruirlas
        // ----------------------------------

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

    // --------------------------------------
    // 2. Si __NEXT_DATA__ no alcanza,
    // analizamos las respuestas de API
    // --------------------------------------

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

    // --------------------------------------
    // No encontramos nada
    // --------------------------------------

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

    for (const fecha of fechas) {

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

            if (totalPartidos === 0) {

                console.log(
                    `0 partidos encontrados para ${fecha.nombre}. No se modifica Redis.`
                );

                continue;
            }

            const redisKey =
                REDIS_KEYS[fecha.param];

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

        await page.goto(
            "https://www.promiedos.com.ar/league/liga-profesional/hc",
            {
                waitUntil: "networkidle2",
                timeout: 60000
            }
        );

        await new Promise((resolve) =>
            setTimeout(resolve, 3000)
        );

        const tablesData =
            await page.evaluate(() => {

                const tables = [];

                const elementos =
                    document.querySelectorAll(
                        "table"
                    );

                elementos.forEach(
                    (table) => {

                        const rows =
                            table.querySelectorAll(
                                "tr"
                            );

                        const data = [];

                        rows.forEach(
                            (row) => {

                                const cells =
                                    row.querySelectorAll(
                                        "th, td"
                                    );

                                const fila =
                                    Array.from(
                                        cells
                                    ).map(
                                        (cell) =>
                                            cell.innerText.trim()
                                    );

                                if (
                                    fila.length > 0
                                ) {
                                    data.push(
                                        fila
                                    );
                                }
                            }
                        );

                        if (
                            data.length > 0
                        ) {
                            tables.push(
                                data
                            );
                        }
                    }
                );

                return tables;
            });

        const statsData =
            await page.evaluate(() => {

                const resultado = [];

                const elementos =
                    document.querySelectorAll(
                        "body *"
                    );

                elementos.forEach(
                    (element) => {

                        const texto =
                            element.innerText?.trim();

                        if (!texto) return;

                        if (
                            texto.includes(
                                "Goleadores"
                            ) ||
                            texto.includes(
                                "Asistencias"
                            ) ||
                            texto.includes(
                                "Tarjetas"
                            )
                        ) {

                            resultado.push(
                                texto
                            );
                        }
                    }
                );

                return [
                    ...new Set(
                        resultado
                    )
                ];
            });

        const data = {
            tables: tablesData,
            stats: statsData
        };

        // --------------------------------------
        // Protección contra datos vacíos
        // --------------------------------------

        if (
            !data.tables ||
            data.tables.length === 0
        ) {

            console.log(
                "No se encontraron tablas. No se modifica Redis."
            );

            return;
        }

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

    if (sincronizacionEnCurso) {

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
            new Date().toLocaleString("es-AR")
        );

        console.log(
            "=========================================="
        );

        browser = await puppeteer.launch({
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

        sincronizacionEnCurso = false;
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