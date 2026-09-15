import puppeteer from "puppeteer";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

// ==========================================
// URLs
// ==========================================

const URLS = {
  today: "https://www.promiedos.com.ar/",
  ayer: "https://www.promiedos.com.ar/ayer",
  manana: "https://www.promiedos.com.ar/man"
};

const URL_TABLAS =
  "https://www.promiedos.com.ar/league/liga-profesional/hc";

// ==========================================
// CLAVES REDIS
// ==========================================

const REDIS_KEYS = {
  today: "chiquifutbol_matches_v2",
  ayer: "chiquifutbol_matches_ayer",
  manana: "chiquifutbol_matches_manana",
  standings: "chiquifutbol_standings"
};

// ==========================================
// ESTADO
// ==========================================

let sincronizacionEnCurso = false;


// ============================================================
// SINCRONIZAR PARTIDOS
// ============================================================

async function sincronizarPartidos(page) {

  console.log("\n==========================================");
  console.log("SINCRONIZANDO PARTIDOS");
  console.log("==========================================");

  const responseData = {
    today: null,
    ayer: null,
    manana: null
  };

  for (const [tipo, url] of Object.entries(URLS)) {

    console.log(`\n------------------------------------------`);
    console.log(`Procesando: ${tipo.toUpperCase()}`);
    console.log(`URL: ${url}`);
    console.log(`------------------------------------------`);

    let respuestasAPI = [];

    const responseHandler = async (response) => {

      try {

        const responseUrl = response.url();

        if (!responseUrl.includes("api.promiedos.com.ar")) {
          return;
        }

        const contentType =
          response.headers()["content-type"] || "";

        if (!contentType.includes("json")) {
          return;
        }

        const data = await response.json();

        respuestasAPI.push({
          url: responseUrl,
          status: response.status(),
          data
        });

      } catch (error) {
        // Algunas respuestas no son JSON.
      }
    };

    page.on("response", responseHandler);

    try {

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      console.log("Página cargada.");

      // Esperar a que Next.js coloque los datos.
      try {

        await page.waitForFunction(
          () => !!document.querySelector("#__NEXT_DATA__"),
          {
            timeout: 15000
          }
        );

        console.log("__NEXT_DATA__ encontrado.");

      } catch {
        console.log("No apareció __NEXT_DATA__ dentro del tiempo esperado.");
      }

      await new Promise(resolve => setTimeout(resolve, 2500));

      // ==========================================
      // BUSCAR DATOS DE PARTIDOS
      // ==========================================

      let leagues = null;

      // Primero buscamos en las respuestas API.
      for (const respuesta of respuestasAPI) {

        const data = respuesta.data;

        if (!data || typeof data !== "object") {
          continue;
        }

        if (Array.isArray(data.leagues)) {
          leagues = data.leagues;
          break;
        }

        if (data.data && Array.isArray(data.data.leagues)) {
          leagues = data.data.leagues;
          break;
        }
      }

      // ==========================================
      // BUSCAR EN __NEXT_DATA__
      // ==========================================

      if (!leagues) {

        try {

          const nextData = await page.evaluate(() => {

            const script =
              document.querySelector("#__NEXT_DATA__");

            if (!script) {
              return null;
            }

            try {
              return JSON.parse(script.textContent);
            } catch {
              return null;
            }

          });

          if (nextData) {
            leagues = buscarLeagues(nextData);
          }

        } catch (error) {

          console.log(
            "Error leyendo __NEXT_DATA__:",
            error.message
          );

        }

      }

      // ==========================================
      // RECONSTRUIR DESDE ARRAYS DE JUEGOS
      // ==========================================

      if (!leagues) {

        for (const respuesta of respuestasAPI) {

          const data = respuesta.data;

          if (!data || typeof data !== "object") {
            continue;
          }

          const juegos =
            buscarArraysDeJuegos(data);

          if (juegos && juegos.length > 0) {

            leagues =
              reconstruirLeaguesDesdeJuegos(juegos);

            if (leagues) {
              break;
            }

          }
        }

      }

      if (!leagues) {

        console.log(
          `No se encontraron ligas para ${tipo}.`
        );

        responseData[tipo] = [];

      } else {

        const normalizadas =
          normalizarLeagues(leagues);

        responseData[tipo] = normalizadas;

        const cantidadPartidos =
          normalizadas.reduce(
            (total, league) =>
              total + (league.games?.length || 0),
            0
          );

        console.log(
          `${tipo.toUpperCase()}: ${cantidadPartidos} partidos encontrados.`
        );
      }

    } catch (error) {

      console.error(
        `Error sincronizando ${tipo}:`,
        error.message
      );

      responseData[tipo] = [];

    } finally {

      page.off("response", responseHandler);

    }
  }

  // ==========================================
  // GUARDAR REDIS
  // ==========================================

  for (const tipo of ["ayer", "today", "manana"]) {

    const data = responseData[tipo];

    if (!data || data.length === 0) {
      console.log(
        `No se guarda ${tipo}: no hay datos.`
      );
      continue;
    }

    const key = REDIS_KEYS[tipo];

    await redis.set(
      key,
      JSON.stringify(data)
    );

    const partidos =
      data.reduce(
        (total, league) =>
          total + (league.games?.length || 0),
        0
      );

    console.log(
      `Redis ${key}: ${partidos} partidos guardados.`
    );
  }

  console.log("\nPartidos sincronizados correctamente.");
}


// ============================================================
// BUSCAR LEAGUES RECURSIVAMENTE
// ============================================================

function buscarLeagues(obj) {

  if (!obj || typeof obj !== "object") {
    return null;
  }

  if (Array.isArray(obj.leagues)) {
    return obj.leagues;
  }

  if (
    obj.data &&
    typeof obj.data === "object" &&
    Array.isArray(obj.data.leagues)
  ) {
    return obj.data.leagues;
  }

  for (const key of Object.keys(obj)) {

    try {

      const resultado =
        buscarLeagues(obj[key]);

      if (resultado) {
        return resultado;
      }

    } catch {
      // continuar
    }
  }

  return null;
}


// ============================================================
// BUSCAR ARRAYS DE JUEGOS
// ============================================================

function buscarArraysDeJuegos(obj) {

  const encontrados = [];

  function recorrer(valor) {

    if (!valor || typeof valor !== "object") {
      return;
    }

    if (Array.isArray(valor)) {

      if (
        valor.length > 0 &&
        valor.some(
          item =>
            item &&
            typeof item === "object" &&
            (
              item.teams ||
              item.home_team ||
              item.away_team ||
              item.status
            )
        )
      ) {
        encontrados.push(valor);
      }

      for (const item of valor) {
        recorrer(item);
      }

      return;
    }

    for (const key of Object.keys(valor)) {
      recorrer(valor[key]);
    }
  }

  recorrer(obj);

  return encontrados.flat();
}


// ============================================================
// RECONSTRUIR LEAGUES DESDE JUEGOS
// ============================================================

function reconstruirLeaguesDesdeJuegos(juegos) {

  if (!Array.isArray(juegos) || juegos.length === 0) {
    return null;
  }

  const mapa = new Map();

  for (const juego of juegos) {

    if (!juego || typeof juego !== "object") {
      continue;
    }

    const leagueId =
      juego.league_id ??
      juego.league?.id ??
      juego.leagueId ??
      "sin-league";

    const leagueName =
      juego.league?.name ??
      juego.league_name ??
      juego.leagueName ??
      "Liga";

    if (!mapa.has(leagueId)) {

      mapa.set(
        leagueId,
        {
          id: leagueId,
          name: leagueName,
          country_name:
            juego.league?.country_name ??
            juego.country_name ??
            "",
          games: []
        }
      );

    }

    mapa
      .get(leagueId)
      .games
      .push(juego);
  }

  return Array.from(mapa.values());
}


// ============================================================
// NORMALIZAR LEAGUES
// ============================================================

function normalizarLeagues(leagues) {

  if (!Array.isArray(leagues)) {
    return [];
  }

  return leagues.map((league, index) => {

    const games =
      league.games ||
      league.matches ||
      league.partidos ||
      [];

    return {
      ...league,

      id:
        league.id ??
        league.league_id ??
        `league-${index}`,

      name:
        league.name ??
        league.league_name ??
        "Liga",

      country_name:
        league.country_name ??
        league.country ??
        "",

      games: Array.isArray(games)
        ? games
        : []
    };

  });
}


// ============================================================
// SINCRONIZAR TABLAS
// ============================================================

// ============================================================
// SINCRONIZAR TABLAS + ESTADÍSTICAS
// ============================================================

async function sincronizarTablas(page) {

  console.log("\n==========================================");
  console.log("SINCRONIZANDO TABLAS Y ESTADÍSTICAS");
  console.log("==========================================");

  let tablaData = null;
  let tablaResponseHandler = null;

  const respuestasTablas = [];

  // ==========================================
  // ESCUCHAR TODAS LAS RESPUESTAS RELACIONADAS
  // ==========================================

  const tablaResponsePromise = new Promise(resolve => {

    let resuelta = false;

    tablaResponseHandler = async (response) => {

      try {

        const url = response.url();

        const esApiPromiedos =
          url.includes("api.promiedos.com.ar");

        if (!esApiPromiedos) {
          return;
        }

        const esRelacionado =
          url.includes("/league/") ||
          url.includes("statistics") ||
          url.includes("statistic") ||
          url.includes("players") ||
          url.includes("table") ||
          url.includes("standings");

        if (!esRelacionado) {
          return;
        }

        const contentType =
          response.headers()["content-type"] || "";

        if (!contentType.includes("json")) {
          return;
        }

        console.log("\n>>> API RELACIONADA DETECTADA");
        console.log("URL:", url);
        console.log("STATUS:", response.status());

        let data;

        try {
          data = await response.json();
        } catch {
          return;
        }

        respuestasTablas.push({
          url,
          status: response.status(),
          data
        });

        console.log(
          "CLAVES:",
          Object.keys(data || {})
        );

        // ==========================================
        // DETECTAR RESPUESTA PRINCIPAL DE TABLAS
        // ==========================================

        if (
          url.includes("/league/tables_and_fixtures/")
        ) {

          if (!resuelta) {

            resuelta = true;

            tablaData = data;

            resolve(data);

          }

        }

      } catch (error) {

        console.log(
          "Error leyendo respuesta:",
          error.message
        );

      }

    };

    page.on(
      "response",
      tablaResponseHandler
    );

  });

  // ==========================================
  // CARGAR PÁGINA
  // ==========================================

  try {

    await page.goto(
      URL_TABLAS,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    console.log(
      "Página de Liga Profesional cargada."
    );

  } catch (error) {

    console.log(
      "Error cargando página de tablas:",
      error.message
    );

  }

  // ==========================================
  // ESPERAR CARGA DE DATOS
  // ==========================================

  await new Promise(resolve =>
    setTimeout(resolve, 7000)
  );

  // Esperamos también la promesa por si todavía está pendiente
  if (!tablaData) {

    const timeoutPromise =
      new Promise(resolve => {

        setTimeout(
          () => resolve(null),
          8000
        );

      });

    tablaData =
      await Promise.race([
        tablaResponsePromise,
        timeoutPromise
      ]);

  }

  // ==========================================
  // QUITAR LISTENER
  // ==========================================

  if (tablaResponseHandler) {

    page.off(
      "response",
      tablaResponseHandler
    );

  }

  // ==========================================
  // MOSTRAR TODAS LAS RESPUESTAS ENCONTRADAS
  // ==========================================

  console.log("\n==========================================");
  console.log("RESPUESTAS DE ESTADÍSTICAS ENCONTRADAS");
  console.log("==========================================");

  for (const respuesta of respuestasTablas) {

    console.log("\nURL:");
    console.log(respuesta.url);

    console.log(
      "CLAVES:",
      Object.keys(respuesta.data || {})
    );

    // Detectar posibles estadísticas
    if (
      respuesta.data &&
      typeof respuesta.data === "object"
    ) {

      const posiblesClaves = [
        "players_statistics",
        "player_statistics",
        "statistics",
        "stats",
        "players",
        "scorers",
        "goalscorers",
        "assists",
        "cards"
      ];

      for (const clave of posiblesClaves) {

        if (
          Array.isArray(respuesta.data[clave])
        ) {

          console.log(
            `>>> ENCONTRADO ${clave}:`,
            respuesta.data[clave].length
          );

        }

      }

    }

  }

  // ==========================================
  // SI NO HAY DATOS PRINCIPALES
  // ==========================================

  if (!tablaData) {

    console.log(
      "\nNO SE RECIBIÓ LA RESPUESTA PRINCIPAL DE TABLAS."
    );

    return;

  }

  // ==========================================
  // MOSTRAR ESTRUCTURA PRINCIPAL
  // ==========================================

  console.log("\n==========================================");
  console.log("DATOS DE TABLAS RECIBIDOS");
  console.log("==========================================");

  console.log(
    "Claves:",
    Object.keys(tablaData)
  );

  console.log(
    "league:",
    tablaData.league
      ? "OK"
      : "NO"
  );

  console.log(
    "tables:",
    Array.isArray(tablaData.tables)
      ? tablaData.tables.length
      : "NO ARRAY"
  );

  console.log(
    "tables_groups:",
    Array.isArray(tablaData.tables_groups)
      ? tablaData.tables_groups.length
      : "NO ARRAY"
  );

  console.log(
    "games:",
    Array.isArray(tablaData.games)
      ? tablaData.games.length
      : "NO ARRAY"
  );

  console.log(
    "players_statistics:",
    Array.isArray(tablaData.players_statistics)
      ? tablaData.players_statistics.length
      : "NO ARRAY"
  );

  // ==========================================
  // BUSCAR ESTADÍSTICAS
  // ==========================================

  let playersStatistics = [];

  // Primero dentro de la respuesta principal

  if (
    Array.isArray(tablaData.players_statistics)
  ) {

    playersStatistics =
      tablaData.players_statistics;

  }

  // Si están en otra respuesta API

  if (playersStatistics.length === 0) {

    for (const respuesta of respuestasTablas) {

      const data = respuesta.data;

      if (!data || typeof data !== "object") {
        continue;
      }

      const candidatos = [
        data.players_statistics,
        data.player_statistics,
        data.statistics,
        data.stats,
        data.players,
        data.scorers
      ];

      for (const candidato of candidatos) {

        if (
          Array.isArray(candidato) &&
          candidato.length > 0
        ) {

          playersStatistics =
            candidato;

          console.log(
            "\n>>> ESTADÍSTICAS ENCONTRADAS EN:",
            respuesta.url
          );

          break;

        }

      }

      if (playersStatistics.length > 0) {
        break;
      }

    }

  }

  // ==========================================
  // PREPARAR DATOS PARA REDIS
  // ==========================================

  const tablasReales =
    Array.isArray(tablaData.tables)
      ? tablaData.tables
      : (
          Array.isArray(tablaData.tables_groups)
            ? tablaData.tables_groups
            : []
        );

  const standingsData = {

    league:
      tablaData.league ?? null,

    // Estructura real
    tables:
      tablasReales,

    tables_groups:
      Array.isArray(tablaData.tables_groups)
        ? tablaData.tables_groups
        : [],

    games:
      Array.isArray(tablaData.games)
        ? tablaData.games
        : [],

    stats:
      playersStatistics,

    players_statistics:
      playersStatistics

  };

  // ==========================================
  // CONTADORES
  // ==========================================

  const cantidadTablas =
    Array.isArray(standingsData.tables)
      ? standingsData.tables.length
      : 0;

  const cantidadStats =
    Array.isArray(
      standingsData.players_statistics
    )
      ? standingsData.players_statistics.length
      : 0;

  // ==========================================
  // MOSTRAR RESULTADO
  // ==========================================

  console.log("\n==========================================");
  console.log("DATOS A GUARDAR EN REDIS");
  console.log("==========================================");

  console.log(
    "Tablas:",
    cantidadTablas
  );

  console.log(
    "Estadísticas:",
    cantidadStats
  );

  if (cantidadStats > 0) {

    console.log(
      "\nPRIMERA ESTADÍSTICA:"
    );

    console.dir(
      playersStatistics[0],
      {
        depth: 10,
        colors: false
      }
    );

  }

  // ==========================================
  // VALIDAR
  // ==========================================

  if (
    cantidadTablas === 0 &&
    cantidadStats === 0
  ) {

    console.log(
      "\nNO SE GUARDAN DATOS:"
    );

    console.log(
      "La respuesta no contiene tablas ni estadísticas."
    );

    return;

  }

  // ==========================================
  // GUARDAR REDIS
  // ==========================================

  await redis.set(
    REDIS_KEYS.standings,
    JSON.stringify(standingsData)
  );

  console.log("\n==========================================");
  console.log("TABLAS Y ESTADÍSTICAS GUARDADAS");
  console.log("==========================================");

  console.log(
    "KEY:",
    REDIS_KEYS.standings
  );

  console.log(
    "Tablas:",
    cantidadTablas
  );

  console.log(
    "Estadísticas:",
    cantidadStats
  );

  console.log(
    "==========================================\n"
  );

}

// ============================================================
// SINCRONIZAR TODO
// ============================================================

async function sincronizarTodo() {

  if (sincronizacionEnCurso) {

    console.log(
      "Ya hay una sincronización en curso."
    );

    return;

  }

  sincronizacionEnCurso = true;

  console.log("\n");
  console.log("##########################################");
  console.log("INICIANDO SINCRONIZACIÓN");
  console.log("##########################################");
  console.log(
    new Date().toLocaleString("es-AR")
  );


  let browser = null;


  try {

    browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });


    const page = await browser.newPage();


    await page.setViewport({
      width: 1366,
      height: 900
    });


    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/131.0.0.0 Safari/537.36"
    );


    // ==========================================
    // 1. PARTIDOS
    // ==========================================

    await sincronizarPartidos(page);


    // ==========================================
    // 2. TABLAS
    // ==========================================

    await sincronizarTablas(page);


    console.log("\n##########################################");
    console.log("SINCRONIZACIÓN FINALIZADA");
    console.log("##########################################");


  } catch (error) {

    console.error(
      "\nERROR GENERAL:",
      error
    );

  } finally {

    if (browser) {

      try {
        await browser.close();
      } catch {
        // nada
      }

    }

    sincronizacionEnCurso = false;

  }

}


// ============================================================
// ARRANQUE
// ============================================================

console.log(
  "=========================================="
);

console.log(
  "ChiquiFútbol - Sincronizador"
);

console.log(
  "=========================================="
);

sincronizarTodo();


// ============================================================
// CADA 5 MINUTOS
// ============================================================

setInterval(
  sincronizarTodo,
  5 * 60 * 1000
);