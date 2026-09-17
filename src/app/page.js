"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef
} from "react";

import Link from "next/link";

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function Home() {

  // ========================================
  // ESTADOS
  // ========================================

  const [date, setDate] =
    useState("today");

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [teams, setTeams] =
    useState([]);

  const [teamSearchLoading, setTeamSearchLoading] =
    useState(false);

  const [selectedTeam, setSelectedTeam] =
    useState(null);

  const [teamFixtures, setTeamFixtures] =
    useState([]);

  const [teamFixturesLoading, setTeamFixturesLoading] =
    useState(false);

  const searchInputRef =
    useRef(null);

  // ==========================================
  // CARGAR PARTIDOS
  // ==========================================

  async function cargarPartidos() {

    try {

      setError("");

      const response =
        await fetch(
          `/api/matches?date=${date}`,
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar los partidos."
        );
      }

      const json =
        await response.json();

      setData(
        Array.isArray(json)
          ? json
          : []
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Error cargando partidos."
      );

    } finally {

      setLoading(false);
    }
  }

  // ==========================================
  // CARGA INICIAL + CAMBIO DE FECHA
  // ==========================================

  useEffect(() => {

    setLoading(true);

    cargarPartidos();

  }, [date]);

  // ==========================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ==========================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        cargarPartidos();

      }, 30000);

    return () =>
      clearInterval(interval);

  }, [date]);

  // ==========================================
  // CARGAR EQUIPOS
  // ==========================================

  async function cargarEquipos() {

    try {

      setTeamSearchLoading(true);

      const response =
        await fetch(
          "/api/team-fixture?list=true",
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar los equipos."
        );
      }

      const json =
        await response.json();

      setTeams(
        Array.isArray(json)
          ? json
          : []
      );

    } catch (err) {

      console.error(
        "Error cargando equipos:",
        err
      );

    } finally {

      setTeamSearchLoading(false);
    }
  }

  // ==========================================
  // CARGAR EQUIPOS AL INICIAR
  // ==========================================

  useEffect(() => {

    cargarEquipos();

  }, []);

  // ==========================================
  // BUSCAR EQUIPOS
  // ==========================================

  const equiposFiltrados =
    useMemo(() => {

      const texto =
        search
          .trim()
          .toLowerCase();

      if (!texto) {
        return [];
      }

      return teams
        .filter(team => {

          const nombre =
            (
              team.name ||
              team.nombre ||
              ""
            )
              .toLowerCase();

          return nombre.includes(
            texto
          );

        })
        .slice(0, 10);

    }, [
      search,
      teams
    ]);

  // ==========================================
  // SELECCIONAR EQUIPO
  // ==========================================

  async function seleccionarEquipo(
    team
  ) {

    setSelectedTeam(team);

    setSearch(
      team.name ||
      team.nombre ||
      ""
    );

    setTeamFixtures([]);

    try {

      setTeamFixturesLoading(true);

      const teamId =
        team.id ||
        team.team_id ||
        team.teamId;

      const response =
        await fetch(
          `/api/team-fixture?team=${encodeURIComponent(
            teamId
          )}`,
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar los próximos partidos."
        );
      }

      const json =
        await response.json();

      console.log(
        "FIXTURES RECIBIDOS:",
        json
      );

      setTeamFixtures(
        Array.isArray(json)
          ? json
          : Array.isArray(json.fixtures)
            ? json.fixtures
            : Array.isArray(json.matches)
              ? json.matches
              : []
      );

    } catch (err) {

      console.error(
        "Error cargando fixture:",
        err
      );

      setTeamFixtures([]);

    } finally {

      setTeamFixturesLoading(false);
    }
  }

  // ==========================================
  // COMPETENCIA
  // ==========================================

  function obtenerCompetition(
    league
  ) {

    const nombre = (
      league?.name ||
      league?.nombre ||
      league?.title ||
      ""
    )
      .toLowerCase();

    if (
      nombre.includes("libertadores")
    ) {
      return "libertadores";
    }

    if (
      nombre.includes("sudamericana")
    ) {
      return "sudamericana";
    }

    if (
      nombre.includes("copa argentina")
    ) {
      return "copa_argentina";
    }

    if (
      nombre.includes("champions")
    ) {
      return "champions";
    }

    if (
      nombre.includes("europa league")
    ) {
      return "europa_league";
    }

    if (
      nombre.includes("conference")
    ) {
      return "conference_league";
    }

    return "argentina";
  }

  // ==========================================
  // NOMBRE DE LEAGUE
  // ==========================================

  function obtenerNombreLeague(
    league
  ) {

    return (
      league?.name ||
      league?.nombre ||
      league?.title ||
      "Partidos"
    );
  }

  // ==========================================
  // FECHA PARTIDO
  // ==========================================

  function obtenerFechaPartido(
    game
  ) {

    return (
      game?.date ||
      game?.datetime ||
      game?.start_time ||
      game?.startTime ||
      game?.kickoff ||
      game?.timestamp ||
      game?.start ||
      null
    );
  }

  // ==========================================
  // PARSEAR FECHA
  // ==========================================

  function obtenerFechaObjeto(
    game
  ) {

    const valor =
      obtenerFechaPartido(game);

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (
      typeof valor === "number"
    ) {

      const timestamp =
        valor < 10000000000
          ? valor * 1000
          : valor;

      const fecha =
        new Date(timestamp);

      if (
        !Number.isNaN(
          fecha.getTime()
        )
      ) {
        return fecha;
      }
    }

    const fecha =
      new Date(valor);

    if (
      !Number.isNaN(
        fecha.getTime()
      )
    ) {
      return fecha;
    }

    return null;
  }

  // ==========================================
  // FORMATEAR FECHA HORA ARGENTINA
  // ==========================================

  function formatearFechaHoraArgentina(
    game
  ) {

    const fecha =
      obtenerFechaObjeto(game);

    if (!fecha) {
      return null;
    }

    try {

      return fecha.toLocaleString(
        "es-AR",
        {
          timeZone:
            "America/Argentina/Buenos_Aires",

          day: "2-digit",
          month: "2-digit",

          hour: "2-digit",
          minute: "2-digit",

          hour12: false
        }
      );

    } catch {

      return null;
    }
  }

  // ==========================================
  // FORMATEAR HORA ARGENTINA
  // ==========================================

  function formatearHoraArgentina(
    game
  ) {

    const fecha =
      obtenerFechaObjeto(game);

    if (fecha) {

      try {

        return fecha.toLocaleTimeString(
          "es-AR",
          {
            timeZone:
              "America/Argentina/Buenos_Aires",

            hour: "2-digit",
            minute: "2-digit",

            hour12: false
          }
        );

      } catch {}
    }

    if (
      game?.time
    ) {
      return game.time;
    }

    if (
      game?.hour
    ) {
      return game.hour;
    }

    return null;
  }

  // ==========================================
  // FORMATEAR HORA
  // ==========================================

  function formatearHora(
    game
  ) {

    const hora =
      formatearHoraArgentina(game);

    if (
      game?.start_time
    ) {

      const texto =
        String(
          game.start_time
        ).trim();

      const encontrado =
        texto.match(
          /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/
        );

      if (
        encontrado
      ) {

        const dia =
          encontrado[1];

        const mes =
          encontrado[2];

        const anio =
          encontrado[3];

        const horaInicio =
          encontrado[4];

        const minutoInicio =
          encontrado[5];

        const ahora =
          new Date();

        const fechaArgentina =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              timeZone:
                "America/Argentina/Buenos_Aires",

              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            }
          ).formatToParts(
            ahora
          );

        const partes = {};

        fechaArgentina.forEach(
          parte => {
            partes[parte.type] =
              parte.value;
          }
        );

        const hoy =
          `${partes.day}-${partes.month}-${partes.year}`;

        if (
          `${dia}-${mes}-${anio}` !== hoy
        ) {

          return (
            `${dia}/${mes} ` +
            `${horaInicio}:${minutoInicio}`
          );
        }
      }
    }

    if (
      hora &&
      hora !== "--:--"
    ) {

      return hora;
    }

    if (
      game?.start_time
    ) {

      const texto =
        String(
          game.start_time
        ).trim();

      const encontrado =
        texto.match(
          /(\d{2}):(\d{2})/
        );

      if (
        encontrado
      ) {

        return (
          encontrado[1] +
          ":" +
          encontrado[2]
        );
      }
    }

    return "--:--";
  }

  // ==========================================
  // MINUTO LIVE
  // ==========================================

  function obtenerMinutoLive(
    game
  ) {

    if (
      game?.game_time_to_display
    ) {

      const encontrado =
        String(
          game.game_time_to_display
        ).match(
          /(\d{1,3})/
        );

      if (
        encontrado
      ) {

        return parseInt(
          encontrado[1],
          10
        );
      }
    }

    if (
      game?.game_time_status_to_display
    ) {

      const encontrado =
        String(
          game.game_time_status_to_display
        ).match(
          /(\d{1,3})/
        );

      if (
        encontrado
      ) {

        return parseInt(
          encontrado[1],
          10
        );
      }
    }

    if (
      game?.game_time !== undefined &&
      game?.game_time !== null &&
      game?.game_time !== ""
    ) {

      const numero =
        parseInt(
          String(
            game.game_time
          ),
          10
        );

      if (
        !Number.isNaN(numero)
      ) {

        return numero;
      }
    }

    return null;
  }

  // ==========================================
  // ESTADO
  // ==========================================

  function obtenerEstado(
    game
  ) {

    const estado =
      game?.status || {};

    const enumEstado =
      Number(
        estado?.enum
      );

    if (
      enumEstado === 2
    ) {

      const minuto =
        obtenerMinutoLive(game);

      return {

        texto:
          minuto !== null
            ? `EN VIVO ${minuto}'`
            : "EN VIVO",

        color:
          "#ef4444",

        live:
          true
      };
    }

    if (
      enumEstado === 3
    ) {

      return {

        texto:
          "FINAL",

        color:
          "#9ca3af",

        live:
          false
      };
    }

    if (
      enumEstado === 1
    ) {

      const fechaHora =
        formatearFechaHoraArgentina(
          game
        );

      return {

        texto:
          fechaHora ||
          formatearHora(game),

        color:
          "#3b82f6",

        live:
          false
      };
    }

    const fechaHora =
      formatearFechaHoraArgentina(
        game
      );

    return {

      texto:
        fechaHora ||
        estado?.name ||
        formatearHora(game),

      color:
        "#9ca3af",

      live:
        false
    };
  }

  // ==========================================
  // SCORE
  // ==========================================

  function obtenerScore(
    game,
    indice
  ) {

    if (
      Array.isArray(
        game?.scores
      )
    ) {

      return (
        game.scores[indice] ??
        "-"
      );
    }

    return "-";
  }

  // ==========================================
  // EQUIPO
  // ==========================================

  function obtenerEquipo(
    game,
    indice
  ) {

    return (
      game?.teams?.[indice] ||
      {}
    );
  }

  // ==========================================
  // NOMBRE EQUIPO
  // ==========================================

  function nombreEquipo(
    team
  ) {

    if (
      typeof team === "string"
    ) {
      return team;
    }

    return (
      team?.name ||
      team?.short_name ||
      team?.team_name ||
      "Equipo"
    );
  }

  // ==========================================
  // LOGO
  // ==========================================

  function logoEquipo(
    team
  ) {

    return (
      team?.logo ||
      team?.image ||
      team?.icon ||
      team?.symbol ||
      null
    );
  }

  // ==========================================
  // GLOBAL
  // ==========================================

  function obtenerGlobal(
    game
  ) {

    if (
      !game?.global
    ) {
      return null;
    }

    const global =
      game.global;

    let scoreA =
      global.score1;

    let scoreB =
      global.score2;

    if (
      scoreA === undefined ||
      scoreA === null
    ) {
      scoreA =
        global.team1?.score;
    }

    if (
      scoreB === undefined ||
      scoreB === null
    ) {
      scoreB =
        global.team2?.score;
    }

    if (
      scoreA === undefined ||
      scoreA === null ||
      scoreB === undefined ||
      scoreB === null
    ) {
      return null;
    }

    return {

      scoreA,
      scoreB,

      stage:
        global.stage ||
        null
    };
  }

  // ==========================================
// GOLES
// ==========================================

function obtenerGoles(team) {

  if (!Array.isArray(team?.goals)) {
    return [];
  }

  console.log("GOLES RECIBIDOS:", team.goals);

  return team.goals;
}

  // ==========================================
  // FIXTURE - NOMBRE RIVAL
  // ==========================================

  function obtenerRivalFixture(
    fixture
  ) {

    return (
      fixture?.opponent ||
      fixture?.rival ||
      fixture?.opponent_name ||
      fixture?.rival_name ||
      fixture?.vs ||
      fixture?.team_opponent ||
      fixture?.teamOpponent ||
      ""
    );
  }

  // ==========================================
  // FIXTURE - LOCAL / VISITANTE
  // ==========================================

  function obtenerCondicionFixture(
    fixture
  ) {

    const condicion =
      String(
        fixture?.homeAway ||
        fixture?.home_away ||
        fixture?.condition ||
        fixture?.local_visitante ||
        fixture?.localVisitante ||
        ""
      )
        .trim()
        .toUpperCase();

    if (
      condicion === "L"
    ) {
      return "L";
    }

    if (
      condicion === "V"
    ) {
      return "V";
    }

    if (
      condicion.includes("LOCAL")
    ) {
      return "L";
    }

    if (
      condicion.includes("VISIT")
    ) {
      return "V";
    }

    return "";
  }

  // ==========================================
  // FIXTURE - FECHA
  // ==========================================

  function obtenerFechaFixture(
    fixture
  ) {

    return (
      fixture?.date ||
      fixture?.fecha ||
      fixture?.day ||
      "--/--"
    );
  }

  // ==========================================
  // FIXTURE - HORA
  // ==========================================

  function obtenerHoraFixture(
    fixture
  ) {

    return (
      fixture?.time ||
      fixture?.hour ||
      fixture?.hora ||
      fixture?.start_time ||
      "--:--"
    );
  }

  // ==========================================
  // FIXTURE - COMPETENCIA
  // ==========================================

  function obtenerCompetenciaFixture(
    fixture
  ) {

    return (
      fixture?.competition ||
      fixture?.league ||
      fixture?.tournament ||
      fixture?.competencia ||
      ""
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d131a",
        color: "#e6edf3",
        padding: "20px"
      }}
    >

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto"
        }}
      >

        {/* ==================================
            HEADER
        ================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >

          <div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 800
              }}
            >
              ChiquiFútbol
            </h1>

            <div
              style={{
                color: "#8b949e",
                fontSize: "13px",
                marginTop: "4px"
              }}
            >
              Resultados y partidos en vivo
            </div>

          </div>

          {/* =================================
              BUSCADOR
          ================================= */}

          <div
            style={{
              position: "relative",
              width: "320px",
              maxWidth: "100%"
            }}
          >

            <input
              ref={searchInputRef}
              value={search}
              onChange={e => {

                setSearch(
                  e.target.value
                );

                if (
                  selectedTeam
                ) {

                  setSelectedTeam(
                    null
                  );

                  setTeamFixtures(
                    []
                  );
                }

              }}
              placeholder="Buscar equipo..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#121821",
                border:
                  "1px solid #263244",
                borderRadius: "8px",
                padding:
                  "10px 12px",
                color: "#e6edf3",
                outline: "none",
                fontSize: "14px"
              }}
            />

            {/* =================================
                SUGERENCIAS
            ================================= */}

            {search.trim() &&
              !selectedTeam &&
              equiposFiltrados.length > 0 && (

              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#121821",
                  border:
                    "1px solid #263244",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,.35)"
                }}
              >

                {equiposFiltrados.map(
                  team => (

                    <button
                      key={
                        team.id ||
                        team.team_id ||
                        team.name
                      }
                      onClick={() =>
                        seleccionarEquipo(
                          team
                        )
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding:
                          "10px 12px",
                        border: "none",
                        borderBottom:
                          "1px solid #263244",
                        background:
                          "transparent",
                        color:
                          "#e6edf3",
                        cursor:
                          "pointer",
                        fontSize:
                          "14px"
                      }}
                    >
                      {nombreEquipo(
                        team
                      )}
                    </button>

                  )
                )}

              </div>

            )}

            {/* =================================
                ESTADO DE CARGA DE EQUIPOS
            ================================= */}

            {teamSearchLoading &&
              search.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#121821",
                  border:
                    "1px solid #263244",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#8b949e",
                  fontSize: "13px"
                }}
              >
                Cargando equipos...
              </div>
            )}

          </div>

        </div>

        {/* ==================================
            FIXTURE DEL EQUIPO
        ================================== */}

        {selectedTeam && (

          <section
            style={{
              marginBottom: "20px",
              background: "#121821",
              border:
                "1px solid #263244",
              borderRadius: "10px",
              padding: "16px"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                gap: "10px"
              }}
            >

              <div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#8b949e",
                    textTransform:
                      "uppercase"
                  }}
                >
                  Próximos partidos
                </div>

                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    marginTop: "3px"
                  }}
                >
                  {nombreEquipo(
                    selectedTeam
                  )}
                </div>

              </div>

              <button
                onClick={() => {

                  setSelectedTeam(null);

                  setTeamFixtures([]);

                  setSearch("");

                }}
                style={{
                  background:
                    "transparent",
                  border:
                    "1px solid #263244",
                  color:
                    "#9ca3af",
                  borderRadius:
                    "6px",
                  padding:
                    "6px 10px",
                  cursor:
                    "pointer"
                }}
              >
                Cerrar
              </button>

            </div>

            {/* =================================
                CARGANDO
            ================================= */}

            {teamFixturesLoading ? (

              <div
                style={{
                  color: "#8b949e",
                  fontSize: "14px"
                }}
              >
                Cargando fixture...
              </div>

            ) : teamFixtures.length === 0 ? (

              <div
                style={{
                  color: "#8b949e",
                  fontSize: "14px"
                }}
              >
                No se encontraron próximos partidos.
              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gap: "8px"
                }}
              >

                {teamFixtures.map(
                  (
                    fixture,
                    index
                  ) => {

                    // ==================================
                    // DATOS DEL FIXTURE
                    // ==================================

                    const rival =
                      obtenerRivalFixture(
                        fixture
                      );

                    const condicion =
                      obtenerCondicionFixture(
                        fixture
                      );

                    const fecha =
                      obtenerFechaFixture(
                        fixture
                      );

                    const hora =
                      obtenerHoraFixture(
                        fixture
                      );

                    const competencia =
                      obtenerCompetenciaFixture(
                        fixture
                      );

                    // ==================================
                    // NOMBRES
                    // ==================================

                    let equipoLocal = "";
                    let equipoVisitante = "";

                    if (
                      condicion === "L"
                    ) {

                      equipoLocal =
                        nombreEquipo(
                          selectedTeam
                        );

                      equipoVisitante =
                        rival;

                    } else if (
                      condicion === "V"
                    ) {

                      equipoLocal =
                        rival;

                      equipoVisitante =
                        nombreEquipo(
                          selectedTeam
                        );

                    } else {

                      equipoLocal =
                        nombreEquipo(
                          selectedTeam
                        );

                      equipoVisitante =
                        rival;

                    }

                    return (

                      <div
                        key={
                          fixture?.id ||
                          `${fecha}-${rival}-${index}`
                        }
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "90px 45px minmax(180px, 1fr) 80px 180px",
                          alignItems: "center",
                          gap: "12px",
                          padding:
                            "11px 12px",
                          background:
                            "#0d131a",
                          border:
                            "1px solid #263244",
                          borderRadius:
                            "7px"
                        }}
                      >

                        {/* =================================
                            FECHA
                        ================================= */}

                        <div
                          style={{
                            color:
                              "#8b949e",
                            fontSize:
                              "13px",
                            fontWeight:
                              600
                          }}
                        >
                          {fecha}
                        </div>

                        {/* =================================
                            L / V
                        ================================= */}

                        <div
                          style={{
                            textAlign:
                              "center",
                            fontSize:
                              "12px",
                            fontWeight:
                              800,
                            color:
                              condicion === "L"
                                ? "#10b981"
                                : condicion === "V"
                                  ? "#3b82f6"
                                  : "#8b949e"
                          }}
                        >
                          {condicion}
                        </div>

                        {/* =================================
                            PARTIDO
                        ================================= */}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "1fr 20px 1fr",
                            alignItems:
                              "center",
                            gap:
                              "8px",
                            fontSize:
                              "14px"
                          }}
                        >

                          <div
                            style={{
                              textAlign:
                                "right",
                              fontWeight:
                                equipoLocal ===
                                nombreEquipo(
                                  selectedTeam
                                )
                                  ? 700
                                  : 500
                            }}
                          >
                            {equipoLocal ||
                              "Equipo"}
                          </div>

                          <div
                            style={{
                              textAlign:
                                "center",
                              color:
                                "#64748b",
                              fontWeight:
                                700
                            }}
                          >
                            -
                          </div>

                          <div
                            style={{
                              textAlign:
                                "left",
                              fontWeight:
                                equipoVisitante ===
                                nombreEquipo(
                                  selectedTeam
                                )
                                  ? 700
                                  : 500
                            }}
                          >
                            {equipoVisitante ||
                              "Equipo"}
                          </div>

                        </div>

                        {/* =================================
                            HORA
                        ================================= */}

                        <div
                          style={{
                            textAlign:
                              "center",
                            fontSize:
                              "13px",
                            color:
                              "#e6edf3",
                            fontWeight:
                              700
                          }}
                        >
                          {hora}
                        </div>

                        {/* =================================
                            COMPETENCIA
                        ================================= */}

                        <div
                          style={{
                            textAlign:
                              "right",
                            fontSize:
                              "11px",
                            color:
                              "#8b949e"
                          }}
                        >
                          {competencia}
                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </section>

        )}

        {/* ==================================
            FECHAS
        ================================== */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px"
          }}
        >

          {[
            ["ayer", "Ayer"],
            ["today", "Hoy"],
            ["manana", "Mañana"]
          ].map(
            ([value, label]) => (

              <button
                key={value}
                onClick={() =>
                  setDate(value)
                }
                style={{
                  background:
                    date === value
                      ? "#10b981"
                      : "#121821",

                  color:
                    date === value
                      ? "#06120d"
                      : "#e6edf3",

                  border:
                    date === value
                      ? "1px solid #10b981"
                      : "1px solid #263244",

                  borderRadius:
                    "7px",

                  padding:
                    "8px 16px",

                  fontWeight:
                    date === value
                      ? 700
                      : 500,

                  cursor:
                    "pointer"
                }}
              >
                {label}
              </button>

            )
          )}

        </div>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (

          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              border:
                "1px solid #5b2525",
              background:
                "#211416",
              color:
                "#fca5a5",
              borderRadius:
                "8px"
            }}
          >
            {error}
          </div>

        )}

        {/* ==================================
            CONTENIDO
        ================================== */}

        {loading ? (

          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: "#8b949e"
            }}
          >
            Cargando partidos...
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "20px"
            }}
          >

            {data.map(
              (
                league,
                leagueIndex
              ) => {

                const games =
                  Array.isArray(
                    league?.games
                  )
                    ? league.games
                    : [];

                if (
                  games.length === 0
                ) {
                  return null;
                }

                const competition =
                  obtenerCompetition(
                    league
                  );

                const nombreLeague =
                  obtenerNombreLeague(
                    league
                  );

                const posicionesHref =
                  `/posiciones?competition=${competition}`;

                return (

                  <section
                    key={
                      league?.key ||
                      league?.id ||
                      leagueIndex
                    }
                    style={{
                      background:
                        "#121821",
                      border:
                        "1px solid #263244",
                      borderRadius:
                        "10px",
                      overflow:
                        "hidden"
                    }}
                  >

                    {/* =================================
                        HEADER LIGA
                    ================================= */}

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        padding:
                          "12px 16px",
                        borderBottom:
                          "1px solid #263244",
                        background:
                          "#151d27"
                      }}
                    >

                      <Link
                        href={
                          posicionesHref
                        }
                        style={{
                          color:
                            "#e6edf3",
                          textDecoration:
                            "none",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "8px",
                          minWidth:
                            0
                        }}
                      >

                        <span
                          style={{
                            fontSize:
                              "16px",
                            fontWeight:
                              700
                          }}
                        >
                          {nombreLeague}
                        </span>

                        <span
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px"
                          }}
                        >
                          ↗
                        </span>

                      </Link>

                      <Link
                        href={
                          posicionesHref
                        }
                        style={{
                          color:
                            "#64748b",
                          textDecoration:
                            "none",
                          fontSize:
                            "12px",
                          whiteSpace:
                            "nowrap"
                        }}
                      >
                        {games.length}{" "}
                        partidos
                      </Link>

                    </div>

                    {/* =================================
                        PARTIDOS
                    ================================= */}

                    <div>

                      {games.map(
                        (
                          game,
                          gameIndex
                        ) => {

                          const estado =
                            obtenerEstado(
                              game
                            );

                          const teamA =
                            obtenerEquipo(
                              game,
                              0
                            );

                          const teamB =
                            obtenerEquipo(
                              game,
                              1
                            );

                          const scoreA =
                            obtenerScore(
                              game,
                              0
                            );

                          const scoreB =
                            obtenerScore(
                              game,
                              1
                            );

                          const global =
                            obtenerGlobal(
                              game
                            );

                          const golesA =
                            obtenerGoles(
                              teamA
                            );

                          const golesB =
                            obtenerGoles(
                              teamB
                            );

                          const tv =
                            obtenerTV(
                              game
                            );

                          return (

                            <div
                              key={
                                game?.id ||
                                gameIndex
                              }
                              style={{
                                borderBottom:
                                  gameIndex <
                                  games.length - 1
                                    ? "1px solid #263244"
                                    : "none",
                                padding:
                                  "12px 14px"
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "grid",
                                  gridTemplateColumns:
                                    "120px 1fr 160px",
                                  alignItems:
                                    "center",
                                  gap:
                                    "12px"
                                }}
                              >

                                {/* ESTADO */}

                                <div
                                  style={{
                                    textAlign:
                                      "center"
                                  }}
                                >

                                  <div
                                    style={{
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        700,
                                      color:
                                        estado.color,
                                      lineHeight:
                                        "1.3"
                                    }}
                                  >

                                    {estado.live && (

                                      <span
                                        style={{
                                          display:
                                            "inline-block",
                                          width:
                                            "6px",
                                          height:
                                            "6px",
                                          borderRadius:
                                            "50%",
                                          background:
                                            "#ef4444",
                                          marginRight:
                                            "5px",
                                          verticalAlign:
                                            "middle"
                                        }}
                                      />

                                    )}

                                    {estado.texto}

                                  </div>

                                </div>

                                {/* PARTIDO */}

                                <div>

                                  <div
                                    style={{
                                      display:
                                        "grid",
                                      gridTemplateColumns:
                                        "1fr 55px 1fr",
                                      alignItems:
                                        "center",
                                      gap:
                                        "10px"
                                    }}
                                  >

                                    {/* LOCAL */}

                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "flex-end",
                                        gap:
                                          "8px",
                                        textAlign:
                                          "right"
                                      }}
                                    >

                                      <span
                                        style={{
                                          fontSize:
                                            "14px",
                                          fontWeight:
                                            600,
                                          color:
                                            estado.live
                                              ? "#ef4444"
                                              : "#e6edf3"
                                        }}
                                      >
                                        {nombreEquipo(
                                          teamA
                                        )}
                                      </span>

                                      {logoEquipo(
                                        teamA
                                      ) && (

                                        <img
                                          src={logoEquipo(
                                            teamA
                                          )}
                                          alt=""
                                          width="28"
                                          height="28"
                                          style={{
                                            objectFit:
                                              "contain"
                                          }}
                                        />

                                      )}

                                    </div>

                                    {/* MARCADOR */}

                                    <div
                                      style={{
                                        textAlign:
                                          "center",
                                        fontSize:
                                          "20px",
                                        fontWeight:
                                          800,
                                        whiteSpace:
                                          "nowrap",
                                        color:
                                          estado.live
                                            ? "#ef4444"
                                            : "#e6edf3"
                                      }}
                                    >

                                      <span>
                                        {scoreA}
                                      </span>

                                      <span
                                        style={{
                                          margin:
                                            "0 5px",
                                          color:
                                            estado.live
                                              ? "#ef4444"
                                              : "#64748b"
                                        }}
                                      >
                                        -
                                      </span>

                                      <span>
                                        {scoreB}
                                      </span>

                                    </div>

                                    {/* VISITANTE */}

                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap:
                                          "8px"
                                      }}
                                    >

                                      {logoEquipo(
                                        teamB
                                      ) && (

                                        <img
                                          src={logoEquipo(
                                            teamB
                                          )}
                                          alt=""
                                          width="28"
                                          height="28"
                                          style={{
                                            objectFit:
                                              "contain"
                                          }}
                                        />

                                      )}

                                      <span
                                        style={{
                                          fontSize:
                                            "14px",
                                          fontWeight:
                                            600,
                                          color:
                                            estado.live
                                              ? "#ef4444"
                                              : "#e6edf3"
                                        }}
                                      >
                                        {nombreEquipo(
                                          teamB
                                        )}
                                      </span>

                                    </div>

                                  </div>

                                  {/* GLOBAL */}

                                  {global && (

                                    <div
                                      style={{
                                        marginTop:
                                          "5px",
                                        textAlign:
                                          "center"
                                      }}
                                    >

                                      <span
                                        style={{
                                          display:
                                            "inline-flex",
                                          alignItems:
                                            "center",
                                          gap:
                                            "6px",
                                          padding:
                                            "3px 9px",
                                          borderRadius:
                                            "5px",
                                          background:
                                            "#0d131a",
                                          border:
                                            "1px solid #263244",
                                          color:
                                            "#9ca3af",
                                          fontSize:
                                            "11px",
                                          fontWeight:
                                            600
                                        }}
                                      >

                                        <span
                                          style={{
                                            color:
                                              "#64748b",
                                            textTransform:
                                              "uppercase"
                                          }}
                                        >
                                          Global
                                        </span>

                                        <span
                                          style={{
                                            color:
                                              "#e6edf3",
                                            fontWeight:
                                              800
                                          }}
                                        >
                                          {global.scoreA}
                                          {" - "}
                                          {global.scoreB}
                                        </span>

                                      </span>

                                    </div>

                                  )}

                                  {/* GOLES */}

                                  {(golesA.length > 0 ||
                                    golesB.length > 0) && (

                                    <div
                                      style={{
                                        marginTop:
                                          "5px",
                                        display:
                                          "grid",
                                        gridTemplateColumns:
                                          "1fr 1fr",
                                        gap:
                                          "10px",
                                        fontSize:
                                          "11px",
                                        color:
                                          "#8b949e"
                                      }}
                                    >

                                      <div
                                        style={{
                                          textAlign:
                                            "right"
                                        }}
                                      >

                                        {golesA.map(
                                          (
                                            goal,
                                            index
                                          ) => (

                                            <div
                                              key={
                                                index
                                              }
                                            >

                                              {goal.player_name ||
                                                goal.player ||
                                                goal.name ||
                                                "Gol"}

                                              {goal.minute !=
                                                null &&
                                                ` ${goal.minute}'`}

                                            </div>

                                          )
                                        )}

                                      </div>

                                      <div>

                                        {golesB.map(
                                          (
                                            goal,
                                            index
                                          ) => (

                                            <div
                                              key={
                                                index
                                              }
                                            >

                                              {goal.player_name ||
                                                goal.player ||
                                                goal.name ||
                                                "Gol"}

                                              {goal.minute !=
                                                null &&
                                                ` ${goal.minute}'`}

                                            </div>

                                          )
                                        )}

                                      </div>

                                    </div>

                                  )}

                                </div>

                                {/* TV */}

                                <div
                                  style={{
                                    textAlign:
                                      "right",
                                    fontSize:
                                      "11px",
                                    color:
                                      "#8b949e"
                                  }}
                                >

                                  {tv.length > 0 &&
                                    tv.map(
                                      (
                                        network,
                                        index
                                      ) => (

                                        <div
                                          key={
                                            index
                                          }
                                          style={{
                                            marginBottom:
                                              "2px"
                                          }}
                                        >
                                          {network?.name ||
                                            network?.title ||
                                            network}
                                        </div>

                                      )
                                    )}

                                </div>

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </section>

                );
              }
            )}

            {/* =================================
                SIN PARTIDOS
            ================================= */}

            {data.every(
              league =>
                !Array.isArray(
                  league?.games
                ) ||
                league.games.length === 0
            ) && (

              <div
                style={{
                  textAlign:
                    "center",
                  padding:
                    "50px 20px",
                  color:
                    "#8b949e",
                  background:
                    "#121821",
                  border:
                    "1px solid #263244",
                  borderRadius:
                    "10px"
                }}
              >
                No hay partidos para esta fecha.
              </div>

            )}

          </div>

        )}

        {/* ==================================
            FOOTER
        ================================== */}

        <div
          style={{
            marginTop:
              "30px",
            padding:
              "15px 0",
            textAlign:
              "center",
            color:
              "#64748b",
            fontSize:
              "11px"
          }}
        >
          ChiquiFútbol
        </div>

      </div>

    </main>
  );
}