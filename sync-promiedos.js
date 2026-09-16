import puppeteer from "puppeteer";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

// ==========================================
// URLs DE PARTIDOS
// ==========================================

const URLS = {
  today: "https://www.promiedos.com.ar/",
  ayer: "https://www.promiedos.com.ar/ayer",
  manana: "https://www.promiedos.com.ar/man"
};

// ==========================================
// COMPETENCIAS
// ==========================================

const COMPETENCIAS = {
  argentina: {
    nombre: "Liga Argentina",
    url: "https://www.promiedos.com.ar/league/liga-profesional/hc",
    redis: "chiquifutbol_standings"
  },

  libertadores: {
    nombre: "Copa Libertadores",
    url: "https://www.promiedos.com.ar/league/conmebol-libertadores/bac",
    redis: "chiquifutbol_libertadores"
  },

  sudamericana: {
    nombre: "Copa Sudamericana",
    url: "https://www.promiedos.com.ar/league/conmebol-sudamericana/dij",
    redis: "chiquifutbol_sudamericana"
  },

  copa_argentina: {
    nombre: "Copa Argentina",
    url: "https://www.promiedos.com.ar/league/copa-argentina/gea",
    redis: "chiquifutbol_copa_argentina"
  },

  champions: {
    nombre: "Champions League",
    url: "https://www.promiedos.com.ar/league/uefa-champions-league/fhc",
    redis: "chiquifutbol_champions"
  },

  europa_league: {
    nombre: "Europa League",
    url: "https://www.promiedos.com.ar/league/uefa-europa-league/fhd",
    redis: "chiquifutbol_europa_league"
  },

  conference_league: {
    nombre: "Conference League",
    url: "https://www.promiedos.com.ar/league/uefa-conference-league/hgif",
    redis: "chiquifutbol_conference_league"
  }
};

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
// EQUIPOS DE PROMIEDOS
// team_id -> nombre
// ==========================================

const EQUIPOS_PROMIEDOS = {
  ihc: "Vélez Sarsfield",
  hcbh: "Defensa y Justicia",
  bbjbf: "Gimnasia Mendoza",
  hchc: "Instituto",
  igg: "Boca Juniors",
  ihe: "Independiente",
  igj: "Lanús",
  hcag: "Unión",
  ihh: "Newell's Old Boys",
  igf: "San Lorenzo",
  igh: "Estudiantes de La Plata",
  bbjea: "Deportivo Riestra",
  hcah: "Platense",
  jche: "Talleres",
  beafh: "Central Córdoba",
  ihb: "Argentinos Juniors",
  hbbh: "Sarmiento",
  iia: "Gimnasia La Plata",
  ihf: "Rosario Central",
  hcch: "Independiente Rivadavia",
  fhid: "Belgrano",
  igi: "River Plate",
  gbfc: "Atlético Tucumán",
  iie: "Huracán",
  iid: "Tigre",
  jafb: "Barracas Central",
  ihi: "Banfield",
  bheaf: "Estudiantes Río Cuarto",
  hccd: "Aldosivi",
  ihg: "Racing Club"
};

// ==========================================
// ESTADO
// ==========================================

let sincronizacionEnCurso = false;


// ============================================================
// AGREGAR NOMBRE DEL EQUIPO A ESTADÍSTICAS
// ============================================================

function agregarEquiposAEstadisticas(playersStatistics) {

  if (!playersStatistics) {
    return playersStatistics;
  }

  if (!Array.isArray(playersStatistics.tables)) {
    return playersStatistics;
  }

  return {
    ...playersStatistics,

    tables: playersStatistics.tables.map((tabla) => {

      let rows = [];
      let tipo = null;

      // -----------------------------------------------
      // Caso 1: tabla.rows
      // -----------------------------------------------

      if (Array.isArray(tabla?.rows)) {

        rows = tabla.rows;
        tipo = "rows";

      }

      // -----------------------------------------------
      // Caso 2: tabla.table.rows
      // -----------------------------------------------

      else if (Array.isArray(tabla?.table?.rows)) {

        rows = tabla.table.rows;
        tipo = "table";

      }

      if (!rows.length) {
        return tabla;
      }

      // -----------------------------------------------
      // Agregar team_name
      // -----------------------------------------------

      const nuevasRows = rows.map((fila) => {

        const teamId =
          fila?.entity?.object?.team_id ||
          fila?.team_id ||
          null;

        // Primero usamos nuestro mapa.
        // Si no existe, usamos el nombre que entrega Promiedos.
        const nombrePromiedos =
          fila?.entity?.object?.name ||
          fila?.entity?.object?.short_name ||
          fila?.team_name ||
          "-";

        const teamName =
          teamId && EQUIPOS_PROMIEDOS[teamId]
            ? EQUIPOS_PROMIEDOS[teamId]
            : nombrePromiedos;

        return {
          ...fila,

          team_id: teamId,
          team_name: teamName,

          entity: {
            ...fila?.entity,

            object: {
              ...fila?.entity?.object,

              team_id: teamId,
              team_name: teamName
            }
          }
        };

      });

      // -----------------------------------------------
      // Reconstruir estructura
      // -----------------------------------------------

      if (tipo === "rows") {

        return {
          ...tabla,
          rows: nuevasRows
        };

      }

      if (tipo === "table") {

        return {
          ...tabla,

          table: {
            ...tabla.table,
            rows: nuevasRows
          }
        };

      }

      return tabla;

    })
  };

}


// ============================================================
// ANALIZAR PLAYERS_STATISTICS
// ============================================================

function analizarPlayersStatistics(playersStatistics) {

  const resultado = {

    original: playersStatistics,

    tipo:
      Array.isArray(playersStatistics)
        ? "array"
        : typeof playersStatistics,

    categorias: {},

    arrays: []

  };

  if (
    playersStatistics === null ||
    playersStatistics === undefined
  ) {

    return resultado;

  }

  // ==========================================
  // ARRAY
  // ==========================================

  if (Array.isArray(playersStatistics)) {

    resultado.arrays.push({
      nombre: "players_statistics",
      cantidad: playersStatistics.length,
      datos: playersStatistics
    });

    return resultado;

  }

  // ==========================================
  // OBJETO
  // ==========================================

  if (typeof playersStatistics === "object") {

    for (
      const [clave, valor]
      of Object.entries(playersStatistics)
    ) {

      if (Array.isArray(valor)) {

        resultado.categorias[clave] = valor;

        resultado.arrays.push({
          nombre: clave,
          cantidad: valor.length,
          datos: valor
        });

        continue;

      }

      if (
        valor &&
        typeof valor === "object"
      ) {

        for (
          const [subClave, subValor]
          of Object.entries(valor)
        ) {

          if (Array.isArray(subValor)) {

            const nombre =
              `${clave}.${subClave}`;

            resultado.categorias[nombre] =
              subValor;

            resultado.arrays.push({
              nombre,
              cantidad: subValor.length,
              datos: subValor
            });

          }

        }

      }

    }

  }

  return resultado;

}


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

    console.log("\n------------------------------------------");
    console.log(`Procesando: ${tipo.toUpperCase()}`);
    console.log(`URL: ${url}`);
    console.log("------------------------------------------");

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

      } catch {
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

      try {

        await page.waitForFunction(
          () => !!document.querySelector("#__NEXT_DATA__"),
          {
            timeout: 15000
          }
        );

        console.log("__NEXT_DATA__ encontrado.");

      } catch {

        console.log(
          "No apareció __NEXT_DATA__ dentro del tiempo esperado."
        );

      }

      await new Promise(resolve =>
        setTimeout(resolve, 2500)
      );

      // ==========================================
      // BUSCAR LEAGUES
      // ==========================================

      let leagues = null;

      for (const respuesta of respuestasAPI) {

        const data = respuesta.data;

        if (!data || typeof data !== "object") {
          continue;
        }

        if (Array.isArray(data.leagues)) {

          leagues = data.leagues;
          break;

        }

        if (
          data.data &&
          Array.isArray(data.data.leagues)
        ) {

          leagues = data.data.leagues;
          break;

        }

      }

      // ==========================================
      // __NEXT_DATA__
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

            leagues =
              buscarLeagues(nextData);

          }

        } catch (error) {

          console.log(
            "Error leyendo __NEXT_DATA__:",
            error.message
          );

        }

      }

      // ==========================================
      // RECONSTRUIR DESDE JUEGOS
      // ==========================================

      if (!leagues) {

        for (const respuesta of respuestasAPI) {

          const data = respuesta.data;

          if (!data || typeof data !== "object") {
            continue;
          }

          const juegos =
            buscarArraysDeJuegos(data);

          if (
            juegos &&
            juegos.length > 0
          ) {

            leagues =
              reconstruirLeaguesDesdeJuegos(juegos);

            if (leagues) {
              break;
            }

          }

        }

      }

      // ==========================================
      // RESULTADO
      // ==========================================

      if (!leagues) {

        console.log(
          `No se encontraron ligas para ${tipo}.`
        );

        responseData[tipo] = [];

      } else {

        const normalizadas =
          normalizarLeagues(leagues);

        responseData[tipo] =
          normalizadas;

        const cantidadPartidos =
          normalizadas.reduce(
            (total, league) =>
              total +
              (league.games?.length || 0),
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

      page.off(
        "response",
        responseHandler
      );

    }

  }

  // ==========================================
  // GUARDAR REDIS
  // ==========================================

  for (const tipo of [
    "ayer",
    "today",
    "manana"
  ]) {

    const data =
      responseData[tipo];

    if (
      !data ||
      data.length === 0
    ) {

      console.log(
        `No se guarda ${tipo}: no hay datos.`
      );

      continue;

    }

    const key =
      REDIS_KEYS[tipo];

    await redis.set(
      key,
      JSON.stringify(data)
    );

    const partidos =
      data.reduce(
        (total, league) =>
          total +
          (league.games?.length || 0),
        0
      );

    console.log(
      `Redis ${key}: ${partidos} partidos guardados.`
    );

  }

  console.log(
    "\nPartidos sincronizados correctamente."
  );

}


// ============================================================
// BUSCAR LEAGUES
// ============================================================

function buscarLeagues(obj) {

  if (
    !obj ||
    typeof obj !== "object"
  ) {
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

    if (
      !valor ||
      typeof valor !== "object"
    ) {
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
// RECONSTRUIR LEAGUES
// ============================================================

function reconstruirLeaguesDesdeJuegos(juegos) {

  if (
    !Array.isArray(juegos) ||
    juegos.length === 0
  ) {

    return null;

  }

  const mapa = new Map();

  for (const juego of juegos) {

    if (
      !juego ||
      typeof juego !== "object"
    ) {
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

  return Array.from(
    mapa.values()
  );

}


// ============================================================
// NORMALIZAR LEAGUES
// ============================================================

function normalizarLeagues(leagues) {

  if (!Array.isArray(leagues)) {
    return [];
  }

  return leagues.map(
    (league, index) => {

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

        games:
          Array.isArray(games)
            ? games
            : []

      };

    }
  );

}


// ============================================================
// SINCRONIZAR UNA COMPETENCIA
// ============================================================

async function sincronizarCompetencia(page, competencia) {

  console.log("\n");
  console.log("==========================================");
  console.log(`SINCRONIZANDO: ${competencia.nombre}`);
  console.log("==========================================");
  console.log("URL:", competencia.url);
  console.log("REDIS:", competencia.redis);

  let tablaData = null;
  let tablaResponseHandler = null;

  const respuestasTablas = [];

  // ==========================================
  // ESCUCHAR RESPUESTAS
  // ==========================================

  const tablaResponsePromise =
    new Promise(resolve => {

      let resuelta = false;

      tablaResponseHandler =
        async (response) => {

          try {

            const url =
              response.url();

            const esApiPromiedos =
              url.includes(
                "api.promiedos.com.ar"
              );

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
              response
                .headers()["content-type"] || "";

            if (!contentType.includes("json")) {
              return;
            }

            let data;

            try {

              data =
                await response.json();

            } catch {

              return;

            }

            respuestasTablas.push({
              url,
              status:
                response.status(),
              data
            });

            console.log(
              "\n>>> API RELACIONADA DETECTADA"
            );

            console.log(
              "URL:",
              url
            );

            console.log(
              "STATUS:",
              response.status()
            );

            console.log(
              "CLAVES:",
              Object.keys(data || {})
            );

            // ==================================
            // RESPUESTA PRINCIPAL
            // ==================================

            if (
              url.includes(
                "/league/tables_and_fixtures/"
              )
            ) {

              if (!resuelta) {

                resuelta = true;

                tablaData =
                  data;

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
  // CARGAR COMPETENCIA
  // ==========================================

  try {

    await page.goto(
      competencia.url,
      {
        waitUntil:
          "domcontentloaded",
        timeout: 30000
      }
    );

    console.log(
      `Página de ${competencia.nombre} cargada.`
    );

  } catch (error) {

    console.log(
      `Error cargando ${competencia.nombre}:`,
      error.message
    );

  }

  // ==========================================
  // ESPERAR RESPUESTAS
  // ==========================================

  await new Promise(
    resolve =>
      setTimeout(resolve, 7000)
  );

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
  // SI NO HAY DATOS
  // ==========================================

  if (!tablaData) {

    console.log(
      `NO SE RECIBIERON DATOS PARA ${competencia.nombre}.`
    );

    return false;

  }

  // ==========================================
  // INFORMACIÓN
  // ==========================================

  console.log("\n");
  console.log("==========================================");
  console.log(
    `DATOS RECIBIDOS: ${competencia.nombre}`
  );
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

  // ==========================================
  // PLAYERS STATISTICS
  // ==========================================

  const playersStatistics =
    tablaData.players_statistics ??
    null;

  console.log(
    "players_statistics:",
    playersStatistics
      ? "OK"
      : "NO"
  );

  // ==========================================
  // ANALIZAR ESTADÍSTICAS
  // ==========================================

  const estadisticasAnalizadas =
    analizarPlayersStatistics(
      playersStatistics
    );

  // ==========================================
  // TABLAS
  // ==========================================

  const tablasReales =
    Array.isArray(tablaData.tables)
      ? tablaData.tables
      : (
          Array.isArray(tablaData.tables_groups)
            ? tablaData.tables_groups
            : []
        );

  // ==========================================
// ESTRUCTURA FINAL
// ==========================================

const standingsData = {

  league:
    tablaData.league ??
    null,

  tables:
    tablasReales,

  tables_groups:
    Array.isArray(
      tablaData.tables_groups
    )
      ? tablaData.tables_groups
      : [],

  brackets:
    Array.isArray(
      tablaData.brackets
    )
      ? tablaData.brackets
      : [],

  games:
    Array.isArray(
      tablaData.games
    )
      ? tablaData.games
      : [],

  players_statistics:
    playersStatistics,

  stats:
    estadisticasAnalizadas,

  statistics:
    playersStatistics,

  competition: {
    key:
      Object.keys(COMPETENCIAS).find(
        key =>
          COMPETENCIAS[key] === competencia
      ) || null,

    name:
      competencia.nombre,

    url:
      competencia.url
  }

};

  // ==========================================
  // CONTADORES
  // ==========================================

  const cantidadTablas =
    Array.isArray(
      standingsData.tables
    )
      ? standingsData.tables.length
      : 0;

  const cantidadGrupos =
    Array.isArray(
      standingsData.tables_groups
    )
      ? standingsData.tables_groups.length
      : 0;

  const cantidadGames =
    Array.isArray(
      standingsData.games
    )
      ? standingsData.games.length
      : 0;

  const cantidadStatsArrays =
    estadisticasAnalizadas
      .arrays
      .reduce(
        (
          total,
          grupo
        ) =>
          total +
          grupo.cantidad,
        0
      );

  console.log("\n");
  console.log("==========================================");
  console.log(
    `RESUMEN: ${competencia.nombre}`
  );
  console.log("==========================================");

  console.log(
    "Tablas:",
    cantidadTablas
  );

  console.log(
    "Grupos:",
    cantidadGrupos
  );

  console.log(
    "Games:",
    cantidadGames
  );

  console.log(
    "Arrays estadísticos:",
    estadisticasAnalizadas
      .arrays
      .length
  );

  console.log(
    "Elementos estadísticos:",
    cantidadStatsArrays
  );

  // ==========================================
  // VALIDAR
  // ==========================================

  if (
    cantidadTablas === 0 &&
    cantidadGrupos === 0 &&
    cantidadGames === 0 &&
    cantidadStatsArrays === 0
  ) {

    console.log(
      `NO SE GUARDAN DATOS PARA ${competencia.nombre}.`
    );

    return false;

  }
console.log("DEBUG STANDINGS DATA");
console.log("brackets existe:", Array.isArray(standingsData.brackets));
console.log(
  "brackets cantidad:",
  Array.isArray(standingsData.brackets)
    ? standingsData.brackets.length
    : "NO ARRAY"
);
console.log(
  "claves standingsData:",
  Object.keys(standingsData)
);


  // ==========================================
  // GUARDAR REDIS
  // ==========================================

  await redis.set(
    competencia.redis,
    JSON.stringify(
      standingsData
    )
  );

  console.log("\n");
  console.log("==========================================");
  console.log(
    `GUARDADO EN REDIS: ${competencia.nombre}`
  );
  console.log("==========================================");

  console.log(
    "KEY:",
    competencia.redis
  );

  console.log(
    "Tablas:",
    cantidadTablas
  );

  console.log(
    "Grupos:",
    cantidadGrupos
  );

  console.log(
    "Games:",
    cantidadGames
  );

  console.log(
    "==========================================");

  return true;

}


// ============================================================
// SINCRONIZAR TODAS LAS TABLAS
// ============================================================

async function sincronizarTodasLasTablas(page) {

  console.log("\n");
  console.log("##########################################");
  console.log("SINCRONIZANDO COMPETENCIAS");
  console.log("##########################################");

  for (
    const competencia
    of Object.values(COMPETENCIAS)
  ) {

    try {

      await sincronizarCompetencia(
        page,
        competencia
      );

    } catch (error) {

      console.error(
        `ERROR EN ${competencia.nombre}:`,
        error.message
      );

    }

    // Pequeña pausa entre competencias
    await new Promise(
      resolve =>
        setTimeout(resolve, 1500)
    );

  }

  console.log("\n");
  console.log("##########################################");
  console.log("TODAS LAS COMPETENCIAS PROCESADAS");
  console.log("##########################################");

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
    new Date().toLocaleString(
      "es-AR"
    )
  );

  let browser = null;

  try {

    browser =
      await puppeteer.launch({

        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ]

      });

    const page =
      await browser.newPage();

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

    await sincronizarPartidos(
      page
    );

    // ==========================================
    // 2. COMPETENCIAS
    // ==========================================

    await sincronizarTodasLasTablas(
      page
    );

    console.log("\n");
    console.log("##########################################");
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

    sincronizacionEnCurso =
      false;

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