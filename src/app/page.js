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

  // ========================================
  // CARGAR PARTIDOS
  // ========================================

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

  // ========================================
  // CARGA INICIAL + CAMBIO DE FECHA
  // ========================================

  useEffect(() => {

    setLoading(true);

    cargarPartidos();

  }, [date]);

  // ========================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ========================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        cargarPartidos();

      }, 30000);

    return () =>
      clearInterval(interval);

  }, [date]);

  // ========================================
  // CARGAR EQUIPOS
  // ========================================

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

  // ========================================
  // CARGAR EQUIPOS AL ENFOCAR BÚSQUEDA
  // ========================================

  useEffect(() => {

    if (
      searchInputRef.current
    ) {
      cargarEquipos();
    }

  }, []);

  // ========================================
  // BUSCAR EQUIPOS
  // ========================================

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

  // ========================================
  // SELECCIONAR EQUIPO
  // ========================================

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

      setTeamFixtures(
        Array.isArray(json)
          ? json
          : json.fixtures || []
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

  // ========================================
  // COMPETENCIA
  // ========================================

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

  // ========================================
  // OBTENER NOMBRE DE LEAGUE
  // ========================================

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

  // ========================================
  // FORMATEAR HORA
  // ========================================

  function formatearHora(
    game
  ) {

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

    if (
      game?.date
    ) {

      try {

        const fecha =
          new Date(game.date);

        if (
          !Number.isNaN(
            fecha.getTime()
          )
        ) {

          return fecha.toLocaleTimeString(
            "es-AR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );
        }

      } catch {}
    }

    return "--:--";
  }

  // ========================================
  // OBTENER SCORE
  // ========================================

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

  // ========================================
  // ESTADO DEL PARTIDO
  // ========================================

  function obtenerEstado(
    game
  ) {

    const estado =
      game?.status;

    if (
      estado?.enum === 2
    ) {
      return {
        texto: "EN VIVO",
        color: "#10b981",
        live: true
      };
    }

    if (
      estado?.enum === 3
    ) {
      return {
        texto: "FINAL",
        color: "#9ca3af",
        live: false
      };
    }

    if (
      estado?.enum === 1
    ) {
      return {
        texto:
          formatearHora(game),
        color: "#3b82f6",
        live: false
      };
    }

    return {
      texto:
        estado?.name ||
        formatearHora(game),

      color: "#9ca3af",

      live: false
    };
  }

  // ========================================
  // EQUIPO
  // ========================================

  function obtenerEquipo(
    game,
    indice
  ) {

    return (
      game?.teams?.[indice] ||
      {}
    );
  }

  // ========================================
  // NOMBRE EQUIPO
  // ========================================

  function nombreEquipo(
    team
  ) {

    return (
      team?.name ||
      team?.short_name ||
      team?.team_name ||
      "Equipo"
    );
  }

  // ========================================
  // LOGO EQUIPO
  // ========================================

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

  // ========================================
  // GLOBAL
  // ========================================

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

    // --------------------------------------
    // El sync guarda el global siguiendo
    // el orden del partido actual.
    // --------------------------------------

    let scoreA =
      global.score1;

    let scoreB =
      global.score2;

    // --------------------------------------
    // Si por alguna razón no existen score1/2
    // intentamos leer team1/team2.
    // --------------------------------------

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

  // ========================================
  // GOLES
  // ========================================

  function obtenerGoles(
    team
  ) {

    if (
      !Array.isArray(
        team?.goals
      )
    ) {
      return [];
    }

    return team.goals;
  }

  // ========================================
  // TV
  // ========================================

  function obtenerTV(
    game
  ) {

    if (
      !Array.isArray(
        game?.tv_networks
      )
    ) {
      return [];
    }

    return game.tv_networks;
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d131a",
        color: "#e6edf3",
        padding: "20px"
      }}
    >

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto"
        }}
      >

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

          {/* ================================= */}
          {/* BUSCADOR DE EQUIPOS */}
          {/* ================================= */}

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
                border: "1px solid #263244",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#e6edf3",
                outline: "none",
                fontSize: "14px"
              }}
            />

            {search.trim() &&
              !selectedTeam &&
              equiposFiltrados.length >
                0 && (

              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#121821",
                  border: "1px solid #263244",
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
                        padding: "10px 12px",
                        border: "none",
                        borderBottom:
                          "1px solid #263244",
                        background:
                          "transparent",
                        color: "#e6edf3",
                        cursor: "pointer",
                        fontSize: "14px"
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

          </div>

        </div>

        {/* ================================== */}
        {/* FIXTURE DEL EQUIPO */}
        {/* ================================== */}

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
                justifyContent:
                  "space-between",
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
                  setSelectedTeam(
                    null
                  );

                  setTeamFixtures(
                    []
                  );

                  setSearch("");
                }}
                style={{
                  background:
                    "transparent",
                  border:
                    "1px solid #263244",
                  color: "#9ca3af",
                  borderRadius: "6px",
                  padding:
                    "6px 10px",
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>

            </div>

            {teamFixturesLoading ? (

              <div
                style={{
                  color: "#8b949e",
                  fontSize: "14px"
                }}
              >
                Cargando fixture...
              </div>

            ) : teamFixtures.length ===
              0 ? (

              <div
                style={{
                  color: "#8b949e",
                  fontSize: "14px"
                }}
              >
                No se encontraron próximos
                partidos.
              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gap: "8px"
                }}
              >

                {teamFixtures.map(
                  (fixture, index) => {

                    const teamsFixture =
                      fixture?.teams ||
                      [];

                    const local =
                      teamsFixture[0] ||
                      {};

                    const visitante =
                      teamsFixture[1] ||
                      {};

                    return (
                      <div
                        key={
                          fixture.id ||
                          index
                        }
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "100px 1fr 160px",
                          alignItems:
                            "center",
                          gap: "12px",
                          padding:
                            "10px 12px",
                          background:
                            "#0d131a",
                          border:
                            "1px solid #263244",
                          borderRadius:
                            "7px"
                        }}
                      >

                        <div
                          style={{
                            color:
                              "#8b949e",
                            fontSize:
                              "13px"
                          }}
                        >
                          {fixture.date ||
                            ""}
                        </div>

                        <div
                          style={{
                            fontSize:
                              "14px"
                          }}
                        >
                          {nombreEquipo(
                            local
                          )}
                          {" - "}
                          {nombreEquipo(
                            visitante
                          )}
                        </div>

                        <div
                          style={{
                            textAlign:
                              "right",
                            color:
                              "#8b949e",
                            fontSize:
                              "13px"
                          }}
                        >
                          {fixture.competition ||
                            fixture.league ||
                            ""}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

        )}

        {/* ================================== */}
        {/* FECHAS */}
        {/* ================================== */}

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

        {/* ================================== */}
        {/* ERROR */}
        {/* ================================== */}

        {error && (

          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              border:
                "1px solid #5b2525",
              background:
                "#211416",
              color: "#fca5a5",
              borderRadius: "8px"
            }}
          >
            {error}
          </div>

        )}

        {/* ================================== */}
        {/* LOADING */}
        {/* ================================== */}

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

            {/* ================================= */}
            {/* LIGAS */}
            {/* ================================= */}

            {data.map(
              (league, leagueIndex) => {

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

                    {/* ======================= */}
                    {/* HEADER LIGA */}
                    {/* ======================= */}

                    <div
                      style={{
                        display: "flex",
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

                      <div
                        style={{
                          fontSize:
                            "16px",
                          fontWeight:
                            700
                        }}
                      >
                        {obtenerNombreLeague(
                          league
                        )}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#64748b"
                        }}
                      >
                        {games.length}{" "}
                        partidos
                      </div>

                    </div>

                    {/* ======================= */}
                    {/* PARTIDOS */}
                    {/* ======================= */}

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

                          const competition =
                            obtenerCompetition(
                              league
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
                                    "95px 1fr 160px",
                                  alignItems:
                                    "center",
                                  gap:
                                    "12px"
                                }}
                              >

                                {/* ================= */}
                                {/* ESTADO */}
                                {/* ================= */}

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
                                        estado.color
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
                                            "#10b981",
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

                                {/* ================= */}
                                {/* PARTIDO */}
                                {/* ================= */}

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
                                            600
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
                                          "nowrap"
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
                                            "#64748b"
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
                                            600
                                        }}
                                      >
                                        {nombreEquipo(
                                          teamB
                                        )}
                                      </span>

                                    </div>

                                  </div>

                                  {/* ================= */}
                                  {/* GLOBAL */}
                                  {/* ================= */}

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
                                            600,
                                          letterSpacing:
                                            "0.3px"
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

                                  {/* ================= */}
                                  {/* GOLES */}
                                  {/* ================= */}

                                  {(golesA.length >
                                    0 ||
                                    golesB.length >
                                    0) && (

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

                                {/* ================= */}
                                {/* TV */}
                                {/* ================= */}

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

                                  {tv.length >
                                  0 ? (

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
                                    )

                                  ) : null}

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

            {/* ================================= */}
            {/* SIN PARTIDOS */}
            {/* ================================= */}

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
                No hay partidos para
                esta fecha.
              </div>

            )}

          </div>

        )}

        {/* ================================== */}
        {/* FOOTER */}
        {/* ================================== */}

        <div
          style={{
            marginTop: "30px",
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
