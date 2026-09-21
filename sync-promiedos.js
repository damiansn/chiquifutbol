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
  manana: "https://www.promiedos.com.ar/man"
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
  },

  primera_nacional: {
    nombre: "Primera Nacional",
    url: "https://www.promiedos.com.ar/league/primera-nacional/ebj"
  },

  primera_b_metro: {
    nombre: "Primera B Metro",
    url: "https://www.promiedos.com.ar/league/primera-b-metropolitana/fahh"
  },

  primera_c: {
    nombre: "Primera C",
    url: "https://www.promiedos.com.ar/league/primera-c/ffjb"
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
  conference_league: "chiquifutbol_conference_league",
  primera_nacional: "chiquifutbol_primera_nacional",
  primera_b_metro: "chiquifutbol_primera_b_metro",
  primera_c: "chiquifutbol_primera_c"
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
// URLS DE EQUIPOS PARA FIXTURE
// ==========================================

const URLS_FIXTURE_EQUIPOS = {
  ihc: "https://www.promiedos.com.ar/team/velez-sarsfield/ihc",

  hcbh: "https://www.promiedos.com.ar/team/defensa-y-justicia/hcbh",

  bbjbf: "https://www.promiedos.com.ar/team/gimnasia-mendoza/bbjbf",

  hchc: "https://www.promiedos.com.ar/team/instituto-ac-cordoba/hchc",

  igg: "https://www.promiedos.com.ar/team/boca-juniors/igg",

  ihe: "https://www.promiedos.com.ar/team/independiente/ihe",

  igj: "https://www.promiedos.com.ar/team/lanus/igj",

  hcag: "https://www.promiedos.com.ar/team/union-santa-fe/hcag",

  ihh: "https://www.promiedos.com.ar/team/newells-old-boys/ihh",

  igf: "https://www.promiedos.com.ar/team/san-lorenzo/igf",

  igh: "https://www.promiedos.com.ar/team/estudiantes/igh",

  bbjea: "https://www.promiedos.com.ar/team/deportivo-riestra/bbjea",

  hcah: "https://www.promiedos.com.ar/team/platense/hcah",

  jche: "https://www.promiedos.com.ar/team/talleres-cordoba/jche",

  beafh: "https://www.promiedos.com.ar/team/central-cordoba-sde/beafh",

  ihb: "https://www.promiedos.com.ar/team/argentinos-juniors/ihb",

  hbbh: "https://www.promiedos.com.ar/team/sarmiento-junin/hbbh",

  iia: "https://www.promiedos.com.ar/team/gimnasia-la-plata/iia",

  ihf: "https://www.promiedos.com.ar/team/rosario-central/ihf",

  hcch: "https://www.promiedos.com.ar/team/independiente-rivadavia/hcch",

  fhid: "https://www.promiedos.com.ar/team/belgrano/fhid",

  igi: "https://www.promiedos.com.ar/team/river-plate/igi",

  gbfc: "https://www.promiedos.com.ar/team/atletico-tucuman/gbfc",

  iie: "https://www.promiedos.com.ar/team/huracan/iie",

  iid: "https://www.promiedos.com.ar/team/tigre/iid",

  jafb: "https://www.promiedos.com.ar/team/barracas-central/jafb",

  ihi: "https://www.promiedos.com.ar/team/banfield/ihi",

  bheaf: "https://www.promiedos.com.ar/team/estudiantes-rio-cuarto/bheaf",

  hccd: "https://www.promiedos.com.ar/team/aldosivi/hccd",

  ihg: "https://www.promiedos.com.ar/team/racing-club/ihg"
};

const REDIS_TEAM_FIXTURES =
  "chiquifutbol_team_fixtures";

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
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(texto) {
  if (!texto) return "";

  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ==========================================
// SINCRONIZAR FIXTURE DE EQUIPOS
// ==========================================

async function sincronizarFixturesEquipos(page) {

  console.log("\n");
  console.log("##########################################");
  console.log("SINCRONIZANDO FIXTURES DE EQUIPOS");
  console.log("##########################################");

  const fixtures = {};

  for (
    const [teamId, url]
    of Object.entries(URLS_FIXTURE_EQUIPOS)
  ) {

    const nombreEquipo =
      EQUIPOS_PROMIEDOS[teamId];

    console.log("\n------------------------------------------");
    console.log(`EQUIPO: ${nombreEquipo}`);
    console.log(`URL: ${url}`);
    console.log("------------------------------------------");

    try {

      await page.goto(
        url,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000
        }
      );

      await sleep(1200);

      const partidos =
        await page.evaluate(() => {

          const resultado = [];
          let competenciaActual = "";

          const filas =
            Array.from(
              document.querySelectorAll("tr")
            );

          for (const fila of filas) {

            // ================================
            // DETECTAR FILA DE ENCABEZADO DE COMPETENCIA
            // Promiedos usa <th> o <td colspan> para separar torneos
            // ================================
            const ths = Array.from(fila.querySelectorAll("th"));
            if (ths.length > 0) {
              const textoTh = ths.map(th =>
                (th.innerText || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
              ).join(" ").trim();
              if (textoTh.length > 3) {
                competenciaActual = textoTh;
              }
              continue;
            }

            // Detectar td con colspan (fila separadora de torneo)
            const tdColspan = fila.querySelector("td[colspan]");
            if (tdColspan) {
              const textoSep = (tdColspan.innerText || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
              if (textoSep.length > 3 && !/^\d/.test(textoSep)) {
                competenciaActual = textoSep;
              }
              continue;
            }

            const celdas =
              Array.from(
                fila.querySelectorAll("td")
              );

            if (celdas.length < 3) {
              continue;
            }

            const textos =
              celdas.map(td =>
                (td.innerText || "")
                  .replace(/\u00a0/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
              );

            // ==================================
            // FECHA
            // ==================================

            const fecha =
              textos.find(texto =>
                /^\d{1,2}\/\d{1,2}$/.test(texto)
              );

            // ==================================
            // LOCAL / VISITA
            // ==================================

            const condicion =
              textos.find(texto =>
                /^[LV]$/.test(texto)
              );

            // ==================================
            // HORA
            // ==================================

            const hora =
              textos.find(texto =>
                /^\d{1,2}:\d{2}$/.test(texto)
              );

            if (
              !fecha ||
              !condicion ||
              !hora
            ) {
              continue;
            }

            // ==================================
            // RIVAL
            // ==================================

            let rival = "";

            for (const celda of celdas) {

              const texto =
                (celda.innerText || "")
                  .replace(/\u00a0/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();

              if (!texto) {
                continue;
              }

              if (texto === fecha) {
                continue;
              }

              if (texto === condicion) {
                continue;
              }

              if (texto === hora) {
                continue;
              }

              // -------------------------------
              // Intentar obtener texto del link
              // -------------------------------

              const enlace =
                celda.querySelector("a");

              if (enlace) {

                const textoEnlace =
                  (enlace.innerText || "")
                    .replace(/\s+/g, " ")
                    .trim();

                if (textoEnlace) {
                  rival = textoEnlace;
                  break;
                }
              }

              rival = texto;
              break;
            }

            if (!rival) {
              continue;
            }

            // ==================================
            // LIMPIEZA
            // ==================================

            rival =
              rival
                .replace(/^Image:\s*/i, "")
                .trim();

            // ----------------------------------
            // Corregir nombres duplicados
            // Ejemplo:
            // HuracánHuracán
            // ----------------------------------

            if (rival.length % 2 === 0) {

              const mitad =
                rival.length / 2;

              const parte1 =
                rival.substring(
                  0,
                  mitad
                );

              const parte2 =
                rival.substring(
                  mitad
                );

              if (
                parte1 === parte2
              ) {
                rival = parte1;
              }
            }

            // ==================================
            // EXCLUIR RESERVA / FEMENINO
            // ==================================

            const rivalNormalizado =
              rival
                .normalize("NFD")
                .replace(
                  /[\u0300-\u036f]/g,
                  ""
                )
                .toLowerCase();

            if (
              rivalNormalizado.includes("reserva") ||
              rivalNormalizado.includes("femenino") ||
              rivalNormalizado.includes("femenina") ||
              rivalNormalizado.includes("(f)") ||
              rivalNormalizado.includes("sub-20") ||
              rivalNormalizado.includes("sub 20") ||
              rivalNormalizado.includes("sub-19") ||
              rivalNormalizado.includes("sub 19") ||
              rivalNormalizado.includes("sub-17") ||
              rivalNormalizado.includes("sub 17")
            ) {
              continue;
            }

            // ==================================
            // GUARDAR
            // ==================================

            resultado.push({
              fecha,
              condicion,
              rival,
              hora,
              competencia: competenciaActual
            });
          }

          return resultado;
        });

      console.log(
        `Partidos encontrados: ${partidos.length}`
      );

      fixtures[teamId] = partidos;

      for (const partido of partidos) {

        console.log(
          `${partido.fecha} | ${partido.condicion} | ${partido.rival} | ${partido.hora} | ${partido.competencia}`
        );
      }

    } catch (error) {

      console.error(
        `Error con ${nombreEquipo}:`,
        error.message
      );

      fixtures[teamId] = [];
    }

    await sleep(300);
  }

  // ==========================================
  // GUARDAR REDIS
  // ==========================================

  await redis.set(
    REDIS_TEAM_FIXTURES,
    JSON.stringify(fixtures)
  );

  console.log("\n");
  console.log("##########################################");
  console.log("FIXTURES DE EQUIPOS GUARDADOS");
  console.log("##########################################");

  console.log(
    `Redis: ${REDIS_TEAM_FIXTURES}`
  );

  console.log(
    `Equipos: ${Object.keys(fixtures).length}`
  );
}

// ==========================================
// CONVERTIR SCORE A NÚMERO
// ==========================================

function convertirScore(valor) {

  if (
    typeof valor === "number" &&
    Number.isFinite(valor)
  ) {
    return valor;
  }

  if (
    typeof valor === "string"
  ) {

    const numero =
      Number(valor);

    if (
      Number.isFinite(numero)
    ) {
      return numero;
    }
  }

  return null;
}

// ==========================================
// OBTENER ID DE EQUIPO
// ==========================================

function obtenerIdEquipo(team) {

  if (
    !team ||
    typeof team !== "object"
  ) {
    return null;
  }

  return (
    team.id ??
    team.team_id ??
    team.teamId ??
    null
  );
}

// ==========================================
// OBTENER NOMBRE DE EQUIPO
// ==========================================

function obtenerNombreEquipo(team) {

  if (
    !team ||
    typeof team !== "object"
  ) {
    return "";
  }

  return (
    team.name ??
    team.team_name ??
    team.teamName ??
    team.short_name ??
    ""
  );
}

// ==========================================
// OBTENER SCORE DE UN EQUIPO
// ==========================================

function obtenerScoreEquipo(
  game,
  indice
) {

  if (!game) {
    return null;
  }

  if (
    Array.isArray(game.scores) &&
    game.scores.length > indice
  ) {

    return convertirScore(
      game.scores[indice]
    );
  }

  return null;
}

// ==========================================
// COMPARAR EQUIPOS
// ==========================================

function mismosEquipos(
  teamA,
  teamB
) {

  const idA =
    obtenerIdEquipo(teamA);

  const idB =
    obtenerIdEquipo(teamB);

  if (idA && idB) {

    return (
      String(idA) ===
      String(idB)
    );
  }

  const nombreA =
    normalizarTexto(
      obtenerNombreEquipo(teamA)
    );

  const nombreB =
    normalizarTexto(
      obtenerNombreEquipo(teamB)
    );

  return (
    nombreA &&
    nombreB &&
    nombreA === nombreB
  );
}

// ==========================================
// OBTENER EQUIPOS DE UN PARTIDO
// ==========================================

function obtenerEquiposPartido(game) {

  if (!game) {
    return [];
  }

  if (
    Array.isArray(game.teams) &&
    game.teams.length >= 2
  ) {
    return game.teams;
  }

  const equipos = [];

  if (game.home_team) {
    equipos.push(
      game.home_team
    );
  }

  if (game.away_team) {
    equipos.push(
      game.away_team
    );
  }

  return equipos;
}

// ==========================================
// ENCONTRAR GRUPO DE UNA SERIE
// ==========================================

function encontrarGrupoDeSerie(
  brackets,
  partido
) {

  if (
    !brackets ||
    !Array.isArray(brackets.stages)
  ) {
    return null;
  }

  const equiposPartido =
    obtenerEquiposPartido(
      partido
    );

  if (
    equiposPartido.length < 2
  ) {
    return null;
  }

  const idPartido =
    partido?.id != null
      ? String(partido.id)
      : null;

  for (
    const stage
    of brackets.stages
  ) {

    if (
      !Array.isArray(stage.groups)
    ) {
      continue;
    }

    for (
      const group
      of stage.groups
    ) {

      if (
        !Array.isArray(group.games) ||
        group.games.length < 2
      ) {
        continue;
      }

      // ==================================
      // PRIMERO: ID DEL PARTIDO
      // ==================================

      if (idPartido) {

        const partidoEncontrado =
          group.games.some(
            game => {

              if (
                game?.id == null
              ) {
                return false;
              }

              return (
                String(game.id) ===
                idPartido
              );
            }
          );

        if (
          partidoEncontrado
        ) {
          return {
            stage,
            group
          };
        }
      }

      // ==================================
      // SEGUNDO: PARTICIPANTES
      // ==================================

      const grupoTieneEquipos =
        Array.isArray(
          group.participants
        ) &&
        equiposPartido.every(
          equipoPartido =>
            group.participants.some(
              participante =>
                mismosEquipos(
                  equipoPartido,
                  participante
                )
            )
        );

      if (
        grupoTieneEquipos
      ) {
        return {
          stage,
          group
        };
      }

      // ==================================
      // TERCERO: PARTIDOS DEL GRUPO
      // ==================================

      const grupoTienePartidoConEquipos =
        group.games.some(
          game => {

            const equiposGame =
              obtenerEquiposPartido(
                game
              );

            if (
              equiposGame.length < 2
            ) {
              return false;
            }

            const tieneEquipo1 =
              equiposGame.some(
                gameTeam =>
                  mismosEquipos(
                    gameTeam,
                    equiposPartido[0]
                  )
              );

            const tieneEquipo2 =
              equiposGame.some(
                gameTeam =>
                  mismosEquipos(
                    gameTeam,
                    equiposPartido[1]
                  )
              );

            return (
              tieneEquipo1 &&
              tieneEquipo2
            );
          }
        );

      if (
        grupoTienePartidoConEquipos
      ) {
        return {
          stage,
          group
        };
      }
    }
  }

  return null;
}

// ==========================================
// CALCULAR GLOBAL DE UNA SERIE
// ==========================================

function calcularGlobal(
  group,
  partidoActual
) {

  if (
    !group ||
    !Array.isArray(group.games) ||
    group.games.length < 2
  ) {
    return null;
  }

  const equiposActuales =
    obtenerEquiposPartido(
      partidoActual
    );

  if (
    equiposActuales.length < 2
  ) {
    return null;
  }

  const equipoActualA =
    equiposActuales[0];

  const equipoActualB =
    equiposActuales[1];

  const idActualA =
    obtenerIdEquipo(
      equipoActualA
    );

  const idActualB =
    obtenerIdEquipo(
      equipoActualB
    );

  let globalA = 0;
  let globalB = 0;

  let huboAlgunResultado =
    false;

  // ==========================================
  // RECORRER TODOS LOS PARTIDOS
  // ==========================================

  for (
    const game
    of group.games
  ) {

    const equiposGame =
      obtenerEquiposPartido(
        game
      );

    if (
      equiposGame.length < 2
    ) {
      continue;
    }

    const gameTeamA =
      equiposGame[0];

    const gameTeamB =
      equiposGame[1];

    const scoreA =
      obtenerScoreEquipo(
        game,
        0
      );

    const scoreB =
      obtenerScoreEquipo(
        game,
        1
      );

    if (
      scoreA === null ||
      scoreB === null
    ) {
      continue;
    }

    const gameIdA =
      obtenerIdEquipo(
        gameTeamA
      );

    const gameIdB =
      obtenerIdEquipo(
        gameTeamB
      );

    // ==================================
    // POR ID
    // ==================================

    if (
      idActualA &&
      idActualB &&
      gameIdA &&
      gameIdB
    ) {

      if (
        String(gameIdA) ===
          String(idActualA) &&
        String(gameIdB) ===
          String(idActualB)
      ) {

        globalA += scoreA;
        globalB += scoreB;

        huboAlgunResultado =
          true;

        continue;
      }

      if (
        String(gameIdA) ===
          String(idActualB) &&
        String(gameIdB) ===
          String(idActualA)
      ) {

        globalA += scoreB;
        globalB += scoreA;

        huboAlgunResultado =
          true;

        continue;
      }
    }

    // ==================================
    // FALLBACK POR NOMBRE
    // ==================================

    const mismoAComoGameA =
      mismosEquipos(
        equipoActualA,
        gameTeamA
      );

    const mismoBComoGameB =
      mismosEquipos(
        equipoActualB,
        gameTeamB
      );

    const mismoAComoGameB =
      mismosEquipos(
        equipoActualA,
        gameTeamB
      );

    const mismoBComoGameA =
      mismosEquipos(
        equipoActualB,
        gameTeamA
      );

    if (
      mismoAComoGameA &&
      mismoBComoGameB
    ) {

      globalA += scoreA;
      globalB += scoreB;

      huboAlgunResultado =
        true;

      continue;
    }

    if (
      mismoAComoGameB &&
      mismoBComoGameA
    ) {

      globalA += scoreB;
      globalB += scoreA;

      huboAlgunResultado =
        true;
    }
  }

  if (!huboAlgunResultado) {
    return null;
  }

  return {
    team1: {
      id:
        obtenerIdEquipo(
          equipoActualA
        ),
      name:
        obtenerNombreEquipo(
          equipoActualA
        ),
      score: globalA
    },

    team2: {
      id:
        obtenerIdEquipo(
          equipoActualB
        ),
      name:
        obtenerNombreEquipo(
          equipoActualB
        ),
      score: globalB
    },

    score1: globalA,
    score2: globalB
  };
}

// ==========================================
// CONTAR SERIES
// ==========================================

function contarSeries(
  brackets
) {

  let cantidad = 0;

  if (
    !brackets ||
    !Array.isArray(brackets.stages)
  ) {
    return cantidad;
  }

  for (
    const stage
    of brackets.stages
  ) {

    if (
      !Array.isArray(stage.groups)
    ) {
      continue;
    }

    for (
      const group
      of stage.groups
    ) {

      if (
        Array.isArray(group.games) &&
        group.games.length >= 2
      ) {
        cantidad++;
      }
    }
  }

  return cantidad;
}

// ==========================================
// AGREGAR GLOBAL A PARTIDOS DE HOY
// ==========================================

async function agregarGlobalesAPartidos() {

  console.log("\n");
  console.log("##########################################");
  console.log("CALCULANDO GLOBALES");
  console.log("##########################################");

  try {

    const partidosJSON =
      await redis.get(
        REDIS_KEYS.today
      );

    if (!partidosJSON) {

      console.log(
        "No hay partidos de hoy en Redis."
      );

      return;
    }

    let leagues;

    try {

      leagues =
        JSON.parse(
          partidosJSON
        );

    } catch {

      console.log(
        "No se pudo interpretar Redis de partidos."
      );

      return;
    }

    if (
      !Array.isArray(leagues)
    ) {

      console.log(
        "Los partidos de hoy no tienen formato de array."
      );

      return;
    }

    let cantidadGlobales = 0;

    for (
      const [
        competenciaKey,
        competencia
      ]
      of Object.entries(
        COMPETENCIAS
      )
    ) {

      const redisKey =
        REDIS_KEYS[
          competenciaKey
        ];

      if (!redisKey) {
        continue;
      }

      const standingsJSON =
        await redis.get(
          redisKey
        );

      if (!standingsJSON) {
        continue;
      }

      let standings;

      try {

        standings =
          JSON.parse(
            standingsJSON
          );

      } catch {

        continue;
      }

      const brackets =
        standings?.brackets;

      if (!brackets) {
        continue;
      }

      const cantidadSeries =
        contarSeries(
          brackets
        );

      if (
        cantidadSeries === 0
      ) {
        continue;
      }

      console.log(
        `${competencia.nombre}: ${cantidadSeries} series encontradas.`
      );

      for (
        const league
        of leagues
      ) {

        if (
          !league ||
          !Array.isArray(
            league.games
          )
        ) {
          continue;
        }

        const nombreLeague =
          normalizarTexto(
            league.name ??
            league.nombre ??
            league.title ??
            league.league_name ??
            ""
          );

        const nombreCompetencia =
          normalizarTexto(
            competencia.nombre
          );

        const keyLeague =
          normalizarTexto(
            league.key ?? ""
          );

        const keyCompetencia =
          normalizarTexto(
            competenciaKey
          );

        const coincideCompetencia =
          nombreLeague.includes(
            nombreCompetencia
          ) ||
          nombreCompetencia.includes(
            nombreLeague
          ) ||
          keyLeague ===
            keyCompetencia ||
          keyLeague.includes(
            keyCompetencia
          ) ||
          keyCompetencia.includes(
            keyLeague
          );

        if (
          !coincideCompetencia &&
          !league.games.some(
            game =>
              game?.competition?.name ===
              competencia.nombre
          )
        ) {
          continue;
        }

        for (
          const game
          of league.games
        ) {

          if (!game) {
            continue;
          }

          const equipos =
            obtenerEquiposPartido(
              game
            );

          if (
            equipos.length < 2
          ) {
            continue;
          }

          const resultadoGrupo =
            encontrarGrupoDeSerie(
              brackets,
              game
            );

          if (!resultadoGrupo) {
            continue;
          }

          const {
            stage,
            group
          } = resultadoGrupo;

          const global =
            calcularGlobal(
              group,
              game
            );

          if (!global) {
            continue;
          }

          game.global = {
            ...global,

            stage:
              stage?.name ??
              null,

            seriesGames:
              Array.isArray(
                group.games
              )
                ? group.games.length
                : 0
          };

          cantidadGlobales++;

          console.log(
            `GLOBAL: ${global.team1.name} ${global.score1} - ${global.score2} ${global.team2.name}`
          );
        }
      }
    }

    await redis.set(
      REDIS_KEYS.today,
      JSON.stringify(
        leagues
      )
    );

    console.log(
      `Partidos con GLOBAL: ${cantidadGlobales}`
    );

    console.log(
      `Redis actualizado con GLOBAL: ${REDIS_KEYS.today}`
    );

  } catch (error) {

    console.error(
      "Error calculando globales:",
      error.message
    );
  }
}

// ==========================================
// AGREGAR NOMBRE DE EQUIPO A ESTADÍSTICAS
// ==========================================

function agregarEquiposAEstadisticas(
  playersStatistics
) {

  if (!playersStatistics) {
    return playersStatistics;
  }

  function recorrer(obj) {

    if (
      !obj ||
      typeof obj !== "object"
    ) {
      return;
    }

    if (Array.isArray(obj)) {

      for (
        const item
        of obj
      ) {
        recorrer(item);
      }

      return;
    }

    if (
      obj.team_id &&
      EQUIPOS_PROMIEDOS[
        obj.team_id
      ] &&
      !obj.team_name
    ) {

      obj.team_name =
        EQUIPOS_PROMIEDOS[
          obj.team_id
        ];
    }

    if (
      obj.teamId &&
      EQUIPOS_PROMIEDOS[
        obj.teamId
      ] &&
      !obj.team_name
    ) {

      obj.team_name =
        EQUIPOS_PROMIEDOS[
          obj.teamId
        ];
    }

    for (
      const key
      of Object.keys(obj)
    ) {

      recorrer(
        obj[key]
      );
    }
  }

  recorrer(
    playersStatistics
  );

  return playersStatistics;
}

// ==========================================
// ANALIZAR ESTADÍSTICAS
// ==========================================

function analizarPlayersStatistics(
  playersStatistics
) {

  const resultado = {
    original:
      playersStatistics,

    tipo:
      typeof playersStatistics,

    categorias: [],

    arrays: []
  };

  function recorrer(
    obj,
    ruta = "root"
  ) {

    if (
      !obj ||
      typeof obj !== "object"
    ) {
      return;
    }

    if (Array.isArray(obj)) {

      resultado.arrays.push({
        ruta,
        cantidad:
          obj.length
      });

      return;
    }

    for (
      const key
      of Object.keys(obj)
    ) {

      const valor =
        obj[key];

      if (
        Array.isArray(valor)
      ) {

        resultado.arrays.push({
          ruta:
            `${ruta}.${key}`,

          cantidad:
            valor.length
        });
      }

      if (
        valor &&
        typeof valor === "object" &&
        !Array.isArray(valor)
      ) {

        recorrer(
          valor,
          `${ruta}.${key}`
        );
      }
    }
  }

  if (
    playersStatistics &&
    typeof playersStatistics ===
      "object"
  ) {

    resultado.categorias =
      Object.keys(
        playersStatistics
      );

    recorrer(
      playersStatistics
    );
  }

  return resultado;
}

// ==========================================
// BUSCAR LEAGUES
// ==========================================

function buscarLeagues(obj) {

  if (
    !obj ||
    typeof obj !== "object"
  ) {
    return null;
  }

  if (
    obj.leagues &&
    typeof obj.leagues === "object"
  ) {
    return obj.leagues;
  }

  for (
    const key
    of Object.keys(obj)
  ) {

    const encontrado =
      buscarLeagues(
        obj[key]
      );

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

// ==========================================
// BUSCAR ARRAYS DE JUEGOS
// ==========================================

function buscarArraysDeJuegos(
  obj,
  encontrados = []
) {

  if (
    !obj ||
    typeof obj !== "object"
  ) {
    return encontrados;
  }

  if (Array.isArray(obj)) {

    if (
      obj.length > 0
    ) {

      const tieneEquipos =
        obj.some(
          item =>
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
        encontrados.push(
          obj
        );
      }
    }

    for (
      const item
      of obj
    ) {

      buscarArraysDeJuegos(
        item,
        encontrados
      );
    }

    return encontrados;
  }

  for (
    const key
    of Object.keys(obj)
  ) {

    buscarArraysDeJuegos(
      obj[key],
      encontrados
    );
  }

  return encontrados;
}

// ==========================================
// RECONSTRUIR LEAGUES DESDE JUEGOS
// ==========================================

function reconstruirLeaguesDesdeJuegos(
  arrays
) {

  if (
    !arrays ||
    arrays.length === 0
  ) {
    return null;
  }

  let mejorArray = null;

  for (
    const arr
    of arrays
  ) {

    if (
      !mejorArray ||
      arr.length >
        mejorArray.length
    ) {

      mejorArray = arr;
    }
  }

  if (!mejorArray) {
    return null;
  }

  return {
    reconstruido: true,
    games: mejorArray
  };
}

// ==========================================
// NORMALIZAR LEAGUES
// ==========================================

function normalizarLeagues(
  leagues
) {

  if (!leagues) {
    return [];
  }

  if (Array.isArray(leagues)) {
    return leagues;
  }

  if (
    typeof leagues !== "object"
  ) {
    return [];
  }

  const resultado = [];

  for (
    const [
      key,
      value
    ]
    of Object.entries(leagues)
  ) {

    if (
      !value ||
      typeof value !== "object"
    ) {
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

async function sincronizarPartidos(
  page
) {

  console.log(
    "\n=========================================="
  );

  console.log(
    "SINCRONIZANDO PARTIDOS"
  );

  console.log(
    "=========================================="
  );

  for (
    const [
      tipo,
      url
    ]
    of Object.entries(URLS)
  ) {

    console.log(
      `\n>>> ${tipo.toUpperCase()}`
    );

    console.log(
      `URL: ${url}`
    );

    const respuestas = [];

    const listener =
      async response => {

        try {

          const responseUrl =
            response.url();

          if (
            responseUrl.includes(
              "api.promiedos.com.ar"
            )
          ) {

            const contentType =
              response.headers()[
                "content-type"
              ] || "";

            if (
              contentType.includes(
                "application/json"
              )
            ) {

              const data =
                await response.json();

              respuestas.push({
                url:
                  responseUrl,

                data
              });
            }
          }

        } catch {
          // Ignorar respuestas no JSON
        }
      };

    page.on(
      "response",
      listener
    );

    try {

      await page.goto(
        url,
        {
          waitUntil:
            "domcontentloaded",

          timeout:
            30000
        }
      );

      console.log(
        "Página cargada."
      );

      try {

        await page.waitForSelector(
          "#__NEXT_DATA__",
          {
            timeout:
              15000
          }
        );

        console.log(
          "_NEXT_DATA_ encontrado."
        );

      } catch {

        console.log(
          "_NEXT_DATA_ no encontrado."
        );
      }

      await sleep(2500);

      let leagues = null;

      // ======================================
      // BUSCAR EN RESPUESTAS API
      // ======================================

      for (
        const respuesta
        of respuestas
      ) {

        const encontrado =
          buscarLeagues(
            respuesta.data
          );

        if (encontrado) {

          leagues =
            encontrado;

          break;
        }
      }

      // ======================================
      // FALLBACK NEXT DATA
      // ======================================

      if (!leagues) {

        try {

          const nextData =
            await page.evaluate(
              () => {

                const script =
                  document.querySelector(
                    "#__NEXT_DATA__"
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
              }
            );

          leagues =
            buscarLeagues(
              nextData
            );

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

      // ======================================
      // FALLBACK ARRAYS DE JUEGOS
      // ======================================

      if (!leagues) {

        try {

          const nextData =
            await page.evaluate(
              () => {

                const script =
                  document.querySelector(
                    "#__NEXT_DATA__"
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
              }
            );

          const arrays =
            buscarArraysDeJuegos(
              nextData
            );

          const reconstruido =
            reconstruirLeaguesDesdeJuegos(
              arrays
            );

          if (reconstruido) {

            leagues =
              reconstruido;

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

      // ======================================
      // NORMALIZAR
      // ======================================

      const partidos =
        normalizarLeagues(
          leagues
        );

      console.log(
        `Partidos encontrados: ${partidos.length}`
      );

      // ======================================
      // GUARDAR REDIS
      // ======================================

      if (
        partidos.length > 0
      ) {

        await redis.set(
          REDIS_KEYS[tipo],
          JSON.stringify(
            partidos
          )
        );

        console.log(
          `Redis actualizado: ${REDIS_KEYS[tipo]}`
        );

      } else if (tipo === "ayer" || tipo === "manana") {

        // Evita que queden partidos viejos de otro día en Redis
        await redis.set(
          REDIS_KEYS[tipo],
          JSON.stringify([])
        );

        console.log(
          `No se encontraron partidos de ${tipo}. Se vacía ${REDIS_KEYS[tipo]}.`
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

    page.off(
      "response",
      listener
    );

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

  console.log(
    "\n=========================================="
  );

  console.log(
    `SINCRONIZANDO: ${competencia.nombre}`
  );

  console.log(
    "=========================================="
  );

  let tablaData = null;

  const listener =
    async response => {

      try {

        const url =
          response.url();

        if (
          url.includes("/league/") ||
          url.includes("statistics") ||
          url.includes("statistic") ||
          url.includes("players") ||
          url.includes("table") ||
          url.includes("standings")
        ) {

          const contentType =
            response.headers()[
              "content-type"
            ] || "";

          if (
            !contentType.includes(
              "application/json"
            )
          ) {
            return;
          }

          const data =
            await response.json();

          if (
            url.includes(
              "/league/tables_and_fixtures/"
            ) &&
            !tablaData
          ) {

            tablaData =
              data;

            console.log(
              ">>> TABLES_AND_FIXTURES CAPTURADO"
            );
          }
        }

      } catch {
        // Ignorar respuestas no JSON
      }
    };

  page.on(
    "response",
    listener
  );

  try {

    await page.goto(
      competencia.url,
      {
        waitUntil:
          "domcontentloaded",

        timeout:
          30000
      }
    );

    console.log(
      "Página de competencia cargada."
    );

    await sleep(7000);

    // ======================================
    // ESPERAR DATOS
    // ======================================

    if (!tablaData) {

      console.log(
        "Esperando respuesta de tablas..."
      );

      await Promise.race([

        new Promise(
          resolve => {

            const revisar =
              setInterval(
                () => {

                  if (tablaData) {

                    clearInterval(
                      revisar
                    );

                    resolve();
                  }
                },
                500
              );
          }
        ),

        sleep(8000)
      ]);
    }

    // ======================================
    // SI NO HAY DATOS
    // ======================================

    if (!tablaData) {

      console.log(
        "NO se recibieron datos de tables_and_fixtures."
      );

      return;
    }

    // ======================================
    // RESUMEN
    // ======================================

    console.log(
      `DATOS RECIBIDOS: ${competencia.nombre}`
    );

    console.log(
      "Claves:",
      Object.keys(
        tablaData
      )
    );

    console.log(
      "league:",
      tablaData.league
        ? "OK"
        : "NO"
    );

    console.log(
      "tables:",
      Array.isArray(
        tablaData.tables
      )
        ? tablaData.tables.length
        : "NO ARRAY"
    );

    console.log(
      "tables_groups:",
      Array.isArray(
        tablaData.tables_groups
      )
        ? tablaData.tables_groups.length
        : "NO ARRAY"
    );

    console.log(
      "games:",
      Array.isArray(
        tablaData.games
      )
        ? tablaData.games.length
        : "NO ARRAY"
    );

    console.log(
      "players_statistics:",
      tablaData.players_statistics
        ? "OK"
        : "NO"
    );

    // ======================================
    // TABLAS
    // ======================================

    let tablasReales = [];

    if (
      Array.isArray(
        tablaData.tables
      )
    ) {

      tablasReales =
        tablaData.tables;
    }

    // ======================================
    // ESTADÍSTICAS
    // ======================================

    let playersStatistics =
      tablaData.players_statistics ||
      null;

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

    // ======================================
    // DEBUG TABLES GROUPS
    // ======================================

    console.log(
      "=========================================="
    );

    console.log(
      "DEBUG TABLES_GROUPS"
    );

    console.log(
      "=========================================="
    );

    console.log(
      JSON.stringify(
        tablaData?.tables_groups,
        null,
        2
      )
    );

    // ======================================
    // STANDINGS DATA
    // ======================================

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
        tablaData.brackets ??
        null,

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
          Object.keys(
            COMPETENCIAS
          ).find(
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

    // ======================================
    // DEBUG BRACKETS
    // ======================================

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
      standingsData.brackets?.stages?.length ??
        0
    );

    if (
      standingsData.brackets?.stages
    ) {

      console.log(
        "etapas:",
        standingsData.brackets.stages.map(
          stage =>
            stage.name
        )
      );
    }

    console.log(
      "claves standingsData:",
      Object.keys(
        standingsData
      )
    );

    // ======================================
    // GUARDAR REDIS
    // ======================================

    const competenciaKey =
      Object.keys(
        COMPETENCIAS
      ).find(
        key =>
          COMPETENCIAS[key] ===
          competencia
      );

    const redisKey =
      REDIS_KEYS[
        competenciaKey
      ];

    if (!redisKey) {

      console.log(
        "No se encontró Redis key para la competencia."
      );

      return;
    }

    await redis.set(
      redisKey,
      JSON.stringify(
        standingsData
      )
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

async function sincronizarTodasLasTablas(
  page
) {

  console.log("\n");

  console.log(
    "##########################################"
  );

  console.log(
    "SINCRONIZACIÓN DE COMPETENCIAS"
  );

  console.log(
    "##########################################"
  );

  for (
    const competencia
    of Object.values(
      COMPETENCIAS
    )
  ) {

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

  if (
    sincronizacionEnCurso
  ) {

    console.log(
      "Ya hay una sincronización en curso. Se omite esta ejecución."
    );

    return;
  }

  sincronizacionEnCurso = true;

  console.log("\n");

  console.log(
    "=========================================="
  );

  console.log(
    "INICIO DE SINCRONIZACIÓN"
  );

  console.log(
    new Date().toLocaleString(
      "es-AR"
    )
  );

  console.log(
    "=========================================="
  );

  let browser = null;

  try {

    // ======================================
    // PUPPETEER
    // ======================================

    console.log(
      ">>> PUPPETEER CONFIGURADO CON NO-SANDBOX"
    );

    browser =
      await puppeteer.launch({

        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ],

        ignoreDefaultArgs: [
          "--disable-extensions"
        ]
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

    // Forzar hora argentina para que Promiedos entregue los horarios
    // sin importar en qué servidor corra el sync
    await page.emulateTimezone("America/Argentina/Buenos_Aires");
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-AR,es;q=0.9"
    });

    // ======================================
    // PARTIDOS
    // ======================================

    await sincronizarPartidos(
      page
    );

    // ======================================
    // FIXTURES DE EQUIPOS
    // ======================================

    await sincronizarFixturesEquipos(
      page
    );

    // ======================================
    // TABLAS / COMPETENCIAS
    // ======================================

    await sincronizarTodasLasTablas(
      page
    );

    // ======================================
    // CALCULAR GLOBALES
    // ======================================

    await agregarGlobalesAPartidos();

  } catch (error) {

    console.error(
      "ERROR GENERAL:",
      error.message
    );

  } finally {

    if (browser) {

      await browser.close();
    }

    sincronizacionEnCurso =
      false;

    console.log("\n");

    console.log(
      "=========================================="
    );

    console.log(
      "SINCRONIZACIÓN FINALIZADA"
    );

    console.log(
      new Date().toLocaleString(
        "es-AR"
      )
    );

    console.log(
      "=========================================="
    );
  }
}

// ==========================================
// EJECUCIÓN INICIAL
// ==========================================

await sincronizarTodo();

// ==========================================
// ACTUALIZACIÓN AUTOMÁTICA
// ==========================================

setInterval(
  sincronizarTodo,
  60 * 1000
);