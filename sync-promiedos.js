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

async function sincronizarTablas(page) {
  console.log("==========================================");
  console.log("SINCRONIZANDO TABLAS Y ESTADÍSTICAS");
  console.log("==========================================");

  const API_TABLAS =
    "https://api.promiedos.com.ar/league/tables_and_fixtures/hc";

  try {
    console.log("Consultando API de tablas de Promiedos...");

    // =========================================================
    // 1. OBTENER TABLAS DESDE LA API REAL
    // =========================================================

    let apiData = null;

    try {
      apiData = await page.evaluate(async (url) => {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 20000);

        try {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Accept": "application/json, text/plain, */*"
            },
            credentials: "include",
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          return await response.json();

        } finally {
          clearTimeout(timeout);
        }
      }, API_TABLAS);

      console.log("API de tablas respondió correctamente.");

    } catch (error) {
      console.log(
        "Error consultando API desde el navegador:",
        error.message
      );
    }

    // =========================================================
    // 2. SI NO FUNCIONÓ FETCH, INTENTAR CON UNA NUEVA PÁGINA
    // =========================================================

    if (!apiData) {
      console.log("Intentando acceder a la API directamente...");

      let apiPage = null;

      try {
        apiPage = await page.browser().newPage();

        await apiPage.setDefaultNavigationTimeout(20000);

        await apiPage.goto(API_TABLAS, {
          waitUntil: "domcontentloaded",
          timeout: 20000
        });

        const texto = await apiPage.evaluate(() => {
          return document.body.innerText;
        });

        if (texto && texto.trim().length > 0) {
          apiData = JSON.parse(texto);
          console.log("API obtenida mediante navegación directa.");
        }

      } catch (error) {
        console.log(
          "No se pudo acceder directamente a la API:",
          error.message
        );

      } finally {
        if (apiPage) {
          try {
            await apiPage.close();
          } catch {}
        }
      }
    }

    // =========================================================
    // 3. SI NO TENEMOS DATOS, NO TOCAR REDIS
    // =========================================================

    if (!apiData) {
      console.log("NO se pudieron obtener las tablas.");
      console.log("No se modifica Redis.");
      return;
    }

    // =========================================================
    // 4. MOSTRAR UNA PEQUEÑA PARTE DE LA RESPUESTA
    // =========================================================

    console.log("");
    console.log("RESPUESTA DE LA API:");
    console.log("------------------------------------------");

    try {
      console.log(
        JSON.stringify(apiData, null, 2).substring(0, 12000)
      );
    } catch {}

    console.log("------------------------------------------");

    // =========================================================
    // 5. BUSCAR TABLAS DENTRO DE LA RESPUESTA
    // =========================================================

    const tablasEncontradas = [];

    function esNumero(valor) {
      return (
        typeof valor === "number" ||
        (
          typeof valor === "string" &&
          valor.trim() !== "" &&
          !isNaN(Number(valor))
        )
      );
    }

    function obtenerNombreEquipo(obj) {
      if (!obj || typeof obj !== "object") return null;

      const campos = [
        "name",
        "team_name",
        "nombre",
        "team",
        "club",
        "club_name",
        "equipo",
        "title"
      ];

      for (const campo of campos) {
        if (
          typeof obj[campo] === "string" &&
          obj[campo].trim().length > 0
        ) {
          return obj[campo].trim();
        }
      }

      return null;
    }

    function esEquipoTabla(obj) {
      if (!obj || typeof obj !== "object") {
        return false;
      }

      const nombre = obtenerNombreEquipo(obj);

      if (!nombre) {
        return false;
      }

      const camposPuntos = [
        "points",
        "pts",
        "puntos",
        "score"
      ];

      const camposPJ = [
        "played",
        "pj",
        "games",
        "matches",
        "partidos"
      ];

      const tienePuntos = camposPuntos.some(
        campo => esNumero(obj[campo])
      );

      const tienePJ = camposPJ.some(
        campo => esNumero(obj[campo])
      );

      return tienePuntos || tienePJ;
    }

    function buscarArrays(obj, ruta = "root") {
      if (!obj || typeof obj !== "object") {
        return;
      }

      if (Array.isArray(obj)) {

        const equipos = obj.filter(esEquipoTabla);

        if (equipos.length >= 4) {

          const firma = equipos
            .map(e => obtenerNombreEquipo(e))
            .join("|");

          const yaExiste = tablasEncontradas.some(
            t => t.firma === firma
          );

          if (!yaExiste) {
            tablasEncontradas.push({
              ruta,
              equipos,
              firma
            });
          }
        }

        for (let i = 0; i < obj.length; i++) {
          buscarArrays(obj[i], `${ruta}[${i}]`);
        }

        return;
      }

      for (const [clave, valor] of Object.entries(obj)) {

        if (
          clave === "props" ||
          clave === "pageProps" ||
          clave === "menuData"
        ) {
          continue;
        }

        buscarArrays(
          valor,
          `${ruta}.${clave}`
        );
      }
    }

    buscarArrays(apiData);

    console.log("");
    console.log("TABLAS ENCONTRADAS:", tablasEncontradas.length);

    // =========================================================
    // 6. NORMALIZAR TABLAS
    // =========================================================

    function numero(obj, campos, defecto = 0) {
      for (const campo of campos) {

        if (obj[campo] !== undefined && obj[campo] !== null) {

          const valor = Number(obj[campo]);

          if (!isNaN(valor)) {
            return valor;
          }
        }
      }

      return defecto;
    }

    function texto(obj, campos, defecto = "") {
      for (const campo of campos) {

        if (
          obj[campo] !== undefined &&
          obj[campo] !== null &&
          String(obj[campo]).trim() !== ""
        ) {
          return String(obj[campo]).trim();
        }
      }

      return defecto;
    }

    const tablas = tablasEncontradas.map((tabla, indice) => {

      const equipos = tabla.equipos.map((equipo, index) => {

        const gf = numero(equipo, [
          "goals_for",
          "gf",
          "favor",
          "goals",
          "goals_scored"
        ]);

        const ga = numero(equipo, [
          "goals_against",
          "ga",
          "contra",
          "goals_conceded"
        ]);

        let diferencia = numero(equipo, [
          "goal_difference",
          "dg",
          "difference",
          "diff",
          "goal_diff"
        ], NaN);

        if (isNaN(diferencia)) {
          diferencia = gf - ga;
        }

        return {
          position: numero(equipo, [
            "position",
            "pos",
            "rank",
            "order"
          ], index + 1),

          name: obtenerNombreEquipo(equipo),

          id: texto(equipo, [
            "id",
            "team_id",
            "teamId"
          ]),

          points: numero(equipo, [
            "points",
            "pts",
            "puntos",
            "score"
          ]),

          played: numero(equipo, [
            "played",
            "pj",
            "games",
            "matches",
            "partidos"
          ]),

          goals_for: gf,

          goals_against: ga,

          goal_difference: diferencia,

          wins: numero(equipo, [
            "wins",
            "won",
            "g"
          ]),

          draws: numero(equipo, [
            "draws",
            "drawn",
            "e"
          ]),

          losses: numero(equipo, [
            "losses",
            "lost",
            "p"
          ]),

          promedio: numero(equipo, [
            "promedio",
            "average",
            "avg",
            "points_average",
            "ratio"
          ], null),

          form:
            equipo.form ||
            equipo.last ||
            equipo.ultimos ||
            equipo.results ||
            equipo.last_results ||
            null,

          seasons:
            equipo.seasons ||
            null
        };
      });

      return {
        name: `Tabla ${indice + 1}`,
        teams: equipos
      };
    });

    // =========================================================
    // 7. MOSTRAR RESULTADO
    // =========================================================

    for (let i = 0; i < tablas.length; i++) {

      console.log("");
      console.log(
        `TABLA ${i + 1}: ${tablas[i].teams.length} equipos`
      );

      for (const equipo of tablas[i].teams.slice(0, 5)) {

        console.log(
          `${equipo.position}. ${equipo.name} - ` +
          `${equipo.points} pts - ` +
          `${equipo.played} PJ`
        );
      }
    }

    // =========================================================
    // 8. ESTADÍSTICAS DE GOLEADORES / ASISTENCIAS
    // =========================================================

    const stats = [];

    try {

      const tablasDOM = await page.evaluate(() => {

        return Array.from(
          document.querySelectorAll("table")
        ).map(table => {

          const filas = Array.from(
            table.querySelectorAll("tr")
          );

          return filas.map(fila => {

            return Array.from(
              fila.querySelectorAll("th, td")
            ).map(celda => celda.innerText.trim());

          });

        });

      });

      for (const tabla of tablasDOM) {

        if (!tabla.length) continue;

        const textoTabla = JSON.stringify(
          tabla
        ).toLowerCase();

        let tipo = null;

        if (
          textoTabla.includes("goleadores") ||
          textoTabla.includes("goles")
        ) {
          tipo = "goleadores";
        }

        if (
          textoTabla.includes("asistencias") ||
          textoTabla.includes("asistidores")
        ) {
          tipo = "asistencias";
        }

        if (!tipo) continue;

        const players = [];

        for (const fila of tabla) {

          if (!fila || fila.length < 2) {
            continue;
          }

          players.push({
            name: fila[0],
            team: fila.length >= 3 ? fila[1] : "",
            value: Number(
              fila[fila.length - 1]
                .replace(/[^\d.-]/g, "")
            ) || 0
          });

        }

        if (players.length > 0) {

          stats.push({
            type: tipo,
            players
          });
        }
      }

    } catch (error) {

      console.log(
        "Error obteniendo estadísticas DOM:",
        error.message
      );
    }

    console.log("");
    console.log("RESUMEN TABLAS");
    console.log("------------------------------------------");
    console.log("Tablas:", tablas.length);
    console.log("Estadísticas:", stats.length);

    // =========================================================
    // 9. GUARDAR EN REDIS
    // =========================================================

    if (tablas.length === 0) {

      console.log(
        "NO se encontraron tablas de posiciones."
      );

      console.log(
        "No se modifica Redis."
      );

      return;
    }

    const resultado = {
      updatedAt: new Date().toISOString(),
      source: "api.promiedos.com.ar",
      tables: tablas,
      stats
    };

    await redis.set(
      "chiquifutbol_standings",
      JSON.stringify(resultado)
    );

    console.log("");
    console.log(
      "Redis actualizado correctamente."
    );

    console.log(
      "Clave: chiquifutbol_standings"
    );

  } catch (error) {

    console.error(
      "Error sincronizando tablas:",
      error.message
    );

    console.log(
      "No se modifica Redis por seguridad."
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