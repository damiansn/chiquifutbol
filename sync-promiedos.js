import puppeteer from "puppeteer";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

// ==========================================
// CONFIGURACIÓN
// ==========================================

const URLS = {
  today: "https://www.promiedos.com.ar/",
  ayer: "https://www.promiedos.com.ar/ayer",
  manana: "https://www.promiedos.com.ar/manana"
};

const COMPETENCIAS = {
  argentina: {
    nombre: "Liga Profesional",
    url: "https://www.promiedos.com.ar/league/liga-profesional/hc"
  },

  libertadores: {
    nombre: "Copa Libertadores",
    url: "https://www.promiedos.com.ar/league/conmebol-libertadores/bac"
  },

  sudamericana: {
    nombre: "Copa Sudamericana",
    url: "https://www.promiedos.com.ar/league/conmebol-sudamericana/dij"
  },

  copa_argentina: {
    nombre: "Copa Argentina",
    url: "https://www.promiedos.com.ar/league/copa-argentina/gea"
  },

  champions: {
    nombre: "Champions League",
    url: "https://www.promiedos.com.ar/league/uefa-champions-league/fhc"
  },

  europa_league: {
    nombre: "Europa League",
    url: "https://www.promiedos.com.ar/league/uefa-europa-league/fhd"
  },

  conference_league: {
    nombre: "Conference League",
    url: "https://www.promiedos.com.ar/league/uefa-conference-league/hgif"
  }
};

const REDIS_KEYS = {
  today: "chiquifutbol_matches_v2",
  ayer: "chiquifutbol_matches_ayer",
  manana: "chiquifutbol_matches_manana",

  argentina: "chiquifutbol_standings",
  libertadores: "chiquifutbol_libertadores",
  sudamericana: "chiquifutbol_sudamericana",
  copa_argentina: "chiquifutbol_copa_argentina",
  champions: "chiquifutbol_champions",
  europa_league: "chiquifutbol_europa_league",
  conference_league: "chiquifutbol_conference_league"
};

// ==========================================
// EQUIPOS DE PRIMERA ARGENTINA
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

// ==========================================
// UTILIDADES
// ==========================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// AGREGAR NOMBRE DE EQUIPO A ESTADÍSTICAS
// ==========================================

function agregarEquiposAEstadisticas(playersStatistics) {
  if (!playersStatistics) return playersStatistics;

  function recorrer(obj) {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        recorrer(item);
      }
      return;
    }

    if (
      obj.team_id &&
      EQUIPOS_PROMIEDOS[obj.team_id] &&
      !obj.team_name
    ) {
      obj.team_name = EQUIPOS_PROMIEDOS[obj.team_id];
    }

    if (
      obj.teamId &&
      EQUIPOS_PROMIEDOS[obj.teamId] &&
      !obj.team_name
    ) {
      obj.team_name = EQUIPOS_PROMIEDOS[obj.teamId];
    }

    for (const key of Object.keys(obj)) {
      recorrer(obj[key]);
    }
  }

  recorrer(playersStatistics);

  return playersStatistics;
}

// ==========================================
// ANALIZAR ESTADÍSTICAS
// ==========================================

function analizarPlayersStatistics(playersStatistics) {
  const resultado = {
    original: playersStatistics,
    tipo: typeof playersStatistics,
    categorias: [],
    arrays: []
  };

  function recorrer(obj, ruta = "root") {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      resultado.arrays.push({
        ruta,
        cantidad: obj.length
      });

      return;
    }

    for (const key of Object.keys(obj)) {
      const valor = obj[key];

      if (Array.isArray(valor)) {
        resultado.arrays.push({
          ruta: `${ruta}.${key}`,
          cantidad: valor.length
        });
      }

      if (
        valor &&
        typeof valor === "object" &&
        !Array.isArray(valor)
      ) {
        recorrer(valor, `${ruta}.${key}`);
      }
    }
  }

  if (
    playersStatistics &&
    typeof playersStatistics === "object"
  ) {
    resultado.categorias = Object.keys(playersStatistics);
    recorrer(playersStatistics);
  }

  return resultado;
}

// ==========================================
// BUSCAR LEAGUES
// ==========================================

function buscarLeagues(obj) {
  if (!obj || typeof obj !== "object") return null;

  if (obj.leagues && typeof obj.leagues === "object") {
    return obj.leagues;
  }

  for (const key of Object.keys(obj)) {
    const encontrado = buscarLeagues(obj[key]);

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

// ==========================================
// BUSCAR ARRAYS DE JUEGOS
// ==========================================

function buscarArraysDeJuegos(obj, encontrados = []) {
  if (!obj || typeof obj !== "object") {
    return encontrados;
  }

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const tieneEquipos = obj.some(item =>
        item &&
        typeof item === "object" &&
        (
          item.teams ||
          item.home_team ||
          item.away_team ||
          item.local ||
          item.visitante
        )
      );

      if (tieneEquipos) {
        encontrados.push(obj);
      }
    }

    for (const item of obj) {
      buscarArraysDeJuegos(item, encontrados);
    }

    return encontrados;
  }

  for (const key of Object.keys(obj)) {
    buscarArraysDeJuegos(obj[key], encontrados);
  }

  return encontrados;
}

// ==========================================
// RECONSTRUIR LEAGUES
// ==========================================

function reconstruirLeaguesDesdeJuegos(arrays) {
  if (!arrays || arrays.length === 0) {
    return null;
  }

  let mejorArray = null;

  for (const arr of arrays) {
    if (!mejorArray || arr.length > mejorArray.length) {
      mejorArray = arr;
    }
  }

  if (!mejorArray) return null;

  return {
    reconstruido: true,
    games: mejorArray
  };
}

// ==========================================
// NORMALIZAR LEAGUES
// ==========================================

function normalizarLeagues(leagues) {
  if (!leagues) return [];

  if (Array.isArray(leagues)) {
    return leagues;
  }

  if (typeof leagues !== "object") {
    return [];
  }

  const resultado = [];

  for (const [key, value] of Object.entries(leagues)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    resultado.push({
      ...value,
      key
    });
  }

  return resultado;
}

// ==========================================
// SINCRONIZAR PARTIDOS
// ==========================================

async function sincronizarPartidos(page) {
  console.log("\n==========================================");
  console.log("SINCRONIZANDO PARTIDOS");
  console.log("==========================================");

  for (const [tipo, url] of Object.entries(URLS)) {
    console.log(`\n>>> ${tipo.toUpperCase()}`);
    console.log(`URL: ${url}`);

    const respuestas = [];

    const listener = async response => {
      try {
        const responseUrl = response.url();

        if (
          responseUrl.includes("api.promiedos.com.ar")
        ) {
          const contentType =
            response.headers()["content-type"] || "";

          if (contentType.includes("application/json")) {
            const data = await response.json();

            respuestas.push({
              url: responseUrl,
              data
            });
          }
        }
      } catch {
        // Ignorar respuestas que no puedan convertirse a JSON
      }
    };

    page.on("response", listener);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      console.log("Página cargada.");

      try {
        await page.waitForSelector(
          "#__NEXT_DATA__",
          {
            timeout: 15000
          }
        );

        console.log("_NEXT_DATA_ encontrado.");
      } catch {
        console.log("_NEXT_DATA_ no encontrado.");
      }

      await sleep(2500);

      let leagues = null;

      // ------------------------------------------
      // BUSCAR EN RESPUESTAS API
      // ------------------------------------------

      for (const respuesta of respuestas) {
        const encontrado =
          buscarLeagues(respuesta.data);

        if (encontrado) {
          leagues = encontrado;
          break;
        }
      }

      // ------------------------------------------
      // FALLBACK __NEXT_DATA__
      // ------------------------------------------

      if (!leagues) {
        try {
          const nextData = await page.evaluate(() => {
            const script =
              document.querySelector(
                "#__NEXT_DATA__"
              );

            if (!script) return null;

            try {
              return JSON.parse(
                script.textContent
              );
            } catch {
              return null;
            }
          });

          leagues = buscarLeagues(nextData);

          if (leagues) {
            console.log(
              "Leagues encontrado en _NEXT_DATA_."
            );
          }
        } catch {
          console.log(
            "No se pudo leer _NEXT_DATA_."
          );
        }
      }

      // ------------------------------------------
      // FALLBACK ARRAYS DE JUEGOS
      // ------------------------------------------

      if (!leagues) {
        try {
          const nextData = await page.evaluate(() => {
            const script =
              document.querySelector(
                "#__NEXT_DATA__"
              );

            if (!script) return null;

            try {
              return JSON.parse(
                script.textContent
              );
            } catch {
              return null;
            }
          });

          const arrays =
            buscarArraysDeJuegos(nextData);

          const reconstruido =
            reconstruirLeaguesDesdeJuegos(
              arrays
            );

          if (reconstruido) {
            leagues = reconstruido;

            console.log(
              "Datos reconstruidos desde arrays de juegos."
            );
          }
        } catch {
          console.log(
            "No se pudieron reconstruir los partidos."
          );
        }
      }

      // ------------------------------------------
      // NORMALIZAR
      // ------------------------------------------

      const partidos =
        normalizarLeagues(leagues);

      console.log(
        `Partidos encontrados: ${partidos.length}`
      );

      // ------------------------------------------
      // GUARDAR REDIS
      // ------------------------------------------

      if (partidos.length > 0) {
        await redis.set(
          REDIS_KEYS[tipo],
          JSON.stringify(partidos)
        );

        console.log(
          `Redis actualizado: ${REDIS_KEYS[tipo]}`
        );
      } else {
        console.log(
          "No se encontraron partidos. No se modifica Redis."
        );
      }

    } catch (error) {
      console.error(
        `Error sincronizando ${tipo}:`,
        error.message
      );
    }

    page.off("response", listener);

    await sleep(500);
  }
}

// ==========================================
// SINCRONIZAR COMPETENCIA
// ==========================================

async function sincronizarCompetencia(
  page,
  competencia
) {
  console.log("\n==========================================");
  console.log(
    `SINCRONIZANDO: ${competencia.nombre}`
  );
  console.log("==========================================");

  let tablaData = null;

  const listener = async response => {
    try {
      const url = response.url();

      if (
        url.includes("/league/") ||
        url.includes("statistics") ||
        url.includes("statistic") ||
        url.includes("players") ||
        url.includes("table") ||
        url.includes("standings")
      ) {
        const contentType =
          response.headers()["content-type"] || "";

        if (
          !contentType.includes("application/json")
        ) {
          return;
        }

        const data = await response.json();

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

        if (
          url.includes(
            "/league/tables_and_fixtures/"
          ) &&
          !tablaData
        ) {
          tablaData = data;

          console.log(
            ">>> TABLES_AND_FIXTURES CAPTURADO"
          );
        }
      }
    } catch {
      // Ignorar respuesta no JSON
    }
  };

  page.on("response", listener);

  try {
    await page.goto(
      competencia.url,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    console.log(
      "Página de competencia cargada."
    );

    await sleep(7000);

    // ------------------------------------------
    // ESPERAR DATOS SI TODAVÍA NO LLEGARON
    // ------------------------------------------

    if (!tablaData) {
      console.log(
        "Esperando respuesta de tablas..."
      );

      await Promise.race([
        new Promise(resolve => {
          const revisar = setInterval(() => {
            if (tablaData) {
              clearInterval(revisar);
              resolve();
            }
          }, 500);
        }),

        sleep(8000)
      ]);
    }

    // ------------------------------------------
    // SI NO HAY DATOS
    // ------------------------------------------

    if (!tablaData) {
      console.log(
        "NO se recibieron datos de tables_and_fixtures."
      );

      return;
    }

    // ------------------------------------------
    // RESUMEN DE DATOS RECIBIDOS
    // ------------------------------------------

    console.log("\n------------------------------------------");
    console.log(
      `DATOS RECIBIDOS: ${competencia.nombre}`
    );
    console.log("------------------------------------------");

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
      tablaData.players_statistics
        ? "OK"
        : "NO"
    );

    // ------------------------------------------
    // TABLAS REALES
    // ------------------------------------------

    let tablasReales = [];

    if (Array.isArray(tablaData.tables)) {
      tablasReales = tablaData.tables;
    }

    // ------------------------------------------
    // ESTADÍSTICAS DE JUGADORES
    // ------------------------------------------

    let playersStatistics =
      tablaData.players_statistics || null;

    if (playersStatistics) {
      playersStatistics =
        agregarEquiposAEstadisticas(
          playersStatistics
        );
    }

    const estadisticasAnalizadas =
      analizarPlayersStatistics(
        playersStatistics
      );

    console.log(
      "Categorías estadísticas:",
      estadisticasAnalizadas.categorias
    );

    console.log(
      "Arrays estadísticos encontrados:",
      estadisticasAnalizadas.arrays.length
    );

    // ------------------------------------------
    // STANDINGS DATA
    // ------------------------------------------

    const standingsData = {
      league:
        tablaData.league ?? null,

      tables:
        tablasReales,

      tables_groups:
        Array.isArray(
          tablaData.tables_groups
        )
          ? tablaData.tables_groups
          : [],

      brackets:
        tablaData.brackets ?? null,

      games:
        Array.isArray(tablaData.games)
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
              COMPETENCIAS[key] ===
              competencia
          ) || null,

        name:
          competencia.nombre,

        url:
          competencia.url
      }
    };

    // ------------------------------------------
    // DEBUG RESUMIDO DE BRACKETS
    // ------------------------------------------

    console.log(
      "\n=========================================="
    );

    console.log(
      "DEBUG STANDINGS DATA"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "brackets existe:",
      !!standingsData.brackets
    );

    console.log(
      "brackets tipo:",
      typeof standingsData.brackets
    );

    console.log(
      "brackets stages:",
      standingsData.brackets?.stages?.length ?? 0
    );

    if (
      standingsData.brackets?.stages
    ) {
      console.log(
        "etapas:",
        standingsData.brackets.stages.map(
          stage => stage.name
        )
      );
    }

    console.log(
      "claves standingsData:",
      Object.keys(standingsData)
    );
    
    if (standingsData.brackets?.stages) {
  const primeraEtapa =
    standingsData.brackets.stages.find(
      stage =>
        stage.groups?.some(
          group =>
            group.games?.length > 1
        )
    );

  const primerGrupo =
    primeraEtapa?.groups?.find(
      group =>
        group.games?.length > 1
    );

  if (primerGrupo) {
    console.log(
      "DEBUG SERIE ELIMINATORIA"
    );

    console.log(
      "Etapa:",
      primeraEtapa.name
    );

    console.log(
      "Equipos:",
      primerGrupo.participants?.map(
        team => ({
          id: team.id,
          name: team.name
        })
      )
    );

    console.log(
      "Cantidad de partidos:",
      primerGrupo.games.length
    );

    primerGrupo.games.forEach(
      (game, index) => {
        console.log(
          `PARTIDO ${index + 1}:`,
          {
            id: game.id,
            winner: game.winner,
            teams: game.teams?.map(
              team => ({
                id: team.id,
                name: team.name
              })
            ),
            scores: game.scores
          }
        );
      }
    );
  }
}
    // ------------------------------------------
    // GUARDAR REDIS
    // ------------------------------------------

    const redisKey =
      REDIS_KEYS[
        Object.keys(COMPETENCIAS).find(
          key =>
            COMPETENCIAS[key] ===
            competencia
        )
      ];

    if (!redisKey) {
      console.log(
        "No se encontró Redis key para la competencia."
      );

      return;
    }

    await redis.set(
      redisKey,
      JSON.stringify(standingsData)
    );

    console.log(
      `Redis actualizado: ${redisKey}`
    );

    console.log(
      `Competencia sincronizada correctamente: ${competencia.nombre}`
    );

  } catch (error) {
    console.error(
      `Error sincronizando ${competencia.nombre}:`,
      error.message
    );
  } finally {
    page.off(
      "response",
      listener
    );
  }
}

// ==========================================
// SINCRONIZAR TODAS LAS COMPETENCIAS
// ==========================================

async function sincronizarTodasLasTablas(page) {
  console.log("\n");
  console.log("##########################################");
  console.log("SINCRONIZACIÓN DE COMPETENCIAS");
  console.log("##########################################");

  for (const competencia of Object.values(
    COMPETENCIAS
  )) {
    await sincronizarCompetencia(
      page,
      competencia
    );

    await sleep(1500);
  }

  console.log("\n");
  console.log(
    "##########################################"
  );
  console.log(
    "COMPETENCIAS FINALIZADAS"
  );
  console.log(
    "##########################################"
  );
}

// ==========================================
// SINCRONIZACIÓN GENERAL
// ==========================================

async function sincronizarTodo() {
  if (sincronizacionEnCurso) {
    console.log(
      "Ya hay una sincronización en curso. Se omite esta ejecución."
    );

    return;
  }

  sincronizacionEnCurso = true;

  console.log("\n");
  console.log("==========================================");
  console.log("INICIO DE SINCRONIZACIÓN");
  console.log(
    new Date().toLocaleString("es-AR")
  );
  console.log("==========================================");

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true
    });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1366,
      height: 900
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // ------------------------------------------
    // PARTIDOS
    // ------------------------------------------

    await sincronizarPartidos(
      page
    );

    // ------------------------------------------
    // TABLAS / COMPETENCIAS
    // ------------------------------------------

    await sincronizarTodasLasTablas(
      page
    );

  } catch (error) {
    console.error(
      "ERROR GENERAL:",
      error.message
    );

  } finally {
    if (browser) {
      await browser.close();
    }

    sincronizacionEnCurso = false;

    console.log("\n");
    console.log("==========================================");
    console.log("SINCRONIZACIÓN FINALIZADA");
    console.log(
      new Date().toLocaleString("es-AR")
    );
    console.log("==========================================");
  }
}

// ==========================================
// EJECUCIÓN INICIAL
// ==========================================

await sincronizarTodo();

// ==========================================
// ACTUALIZACIÓN AUTOMÁTICA
// ==========================================
//
// Cada 1 minuto.
//
// Si una sincronización todavía está ejecutándose,
// no se inicia otra en paralelo.
// ==========================================

setInterval(
  sincronizarTodo,
  60 * 1000
);