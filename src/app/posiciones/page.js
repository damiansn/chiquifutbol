"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function StandingsContent() {
  const searchParams = useSearchParams();

  const leagueId = searchParams.get("leagueId");
  const leagueName =
    searchParams.get("name") || "Liga Profesional Argentina";

  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = leagueId
          ? `/api/standings?leagueId=${encodeURIComponent(leagueId)}`
          : `/api/standings`;

        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("No se pudieron cargar los datos");
        }

        const data = await res.json();

        setStandings(data);
      } catch (err) {
        console.error("Error cargando posiciones:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ opacity: 0.7 }}>
          Cargando posiciones...
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
            paddingBottom: "15px",
          }}
        >
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            {decodeURIComponent(leagueName)}
          </h1>

          <Link
            href="/"
            style={{
              color: "#10b981",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            ← Volver al inicio
          </Link>
        </header>

        <div
          style={{
            padding: "30px",
            border: "1px solid rgba(128,128,128,0.2)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          Error: {error}
        </div>
      </main>
    );
  }

  // ==========================================
  // TABLAS
  // ==========================================

  let tablesList = [];

  if (Array.isArray(standings?.tables)) {
    tablesList = standings.tables;
  } else if (Array.isArray(standings?.teams)) {
    tablesList = [
      {
        title: "Tabla de posiciones",
        teams: standings.teams,
      },
    ];
  } else if (Array.isArray(standings)) {
    tablesList = [
      {
        title: "Tabla de posiciones",
        teams: standings,
      },
    ];
  }

  // ==========================================
  // NORMALIZAR TITULOS
  // ==========================================

  tablesList = tablesList.map((table, index) => {
    const originalTitle = String(
      table.title ||
      table.name ||
      `Tabla ${index + 1}`
    );

    const lowerTitle = originalTitle.toLowerCase();

    let customTitle = originalTitle;

    if (
      lowerTitle.includes("promedio") ||
      lowerTitle.includes("relegation")
    ) {
      customTitle = "PROMEDIOS";
    } else if (
      lowerTitle.includes("anual") ||
      lowerTitle.includes("general")
    ) {
      customTitle = "TABLA ANUAL";
    }

    return {
      ...table,
      title: customTitle,
      teams: Array.isArray(table.teams)
        ? table.teams
        : [],
    };
  });

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const playerStats = Array.isArray(standings?.stats)
    ? standings.stats
    : [];

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}
    >

      {/* ======================================
          CABECERA
      ====================================== */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          borderBottom:
            "1px solid rgba(128,128,128,0.2)",
          paddingBottom: "15px",
        }}
      >
        <h1
          style={{
            fontSize: "1.3rem",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          ⚽ {decodeURIComponent(leagueName)}
        </h1>

        <Link
          href="/"
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* ======================================
          TABLAS DE POSICIONES
      ====================================== */}

      {tablesList.length > 0 ? (
        tablesList.map((section, sIndex) => {
          const isPromedios =
            section.title
              .toLowerCase()
              .includes("promedio");

          return (
            <section
              key={sIndex}
              style={{
                marginBottom: "35px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  color: "#10b981",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                }}
              >
                {section.title}
              </h2>

              <div
                style={{
                  border:
                    "1px solid rgba(128,128,128,0.2)",
                  borderRadius: "8px",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "rgba(16,185,129,0.15)",
                        textAlign: "left",
                        color: "#10b981",
                      }}
                    >
                      <th
                        style={{
                          padding: "10px",
                          width: "40px",
                          textAlign: "center",
                        }}
                      >
                        #
                      </th>

                      <th
                        style={{
                          padding: "10px",
                        }}
                      >
                        Equipo
                      </th>

                      {isPromedios ? (
                        <>
                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            Prom
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            Pts
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            PJ
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            '24
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            '25
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            '26
                          </th>
                        </>
                      ) : (
                        <>
                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            Pts
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            PJ
                          </th>

                          <th
                            style={{
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            DG
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {section.teams.map(
                      (team, index) => {
                        const teamName =
                          team.name ||
                          team.team_name ||
                          team.team ||
                          "Equipo";

                        const position =
                          team.position ||
                          team.pos ||
                          index + 1;

                        const points =
                          team.points ??
                          team.pts ??
                          team.puntos ??
                          0;

                        const played =
                          team.played ??
                          team.pj ??
                          team.games ??
                          0;

                        const goalDifference =
                          team.goal_difference ??
                          team.dg ??
                          team.difference ??
                          0;

                        return (
                          <tr
                            key={
                              team.id ||
                              team.team_id ||
                              `${teamName}-${index}`
                            }
                            style={{
                              borderBottom:
                                "1px solid rgba(128,128,128,0.1)",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px",
                                textAlign: "center",
                                opacity: 0.8,
                              }}
                            >
                              {position}
                            </td>

                            <td
                              style={{
                                padding: "10px",
                                fontWeight: "500",
                              }}
                            >
                              {teamName}
                            </td>

                            {isPromedios ? (
                              <>
                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    color: "#10b981",
                                  }}
                                >
                                  {team.points ??
                                    team.promedio ??
                                    "0.000"}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                  }}
                                >
                                  {points}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {played}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {team.seasons?.[0] ?? 0}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {team.seasons?.[1] ?? 0}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {team.seasons?.[2] ?? 0}
                                </td>
                              </>
                            ) : (
                              <>
                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    color: "#10b981",
                                  }}
                                >
                                  {Math.round(
                                    Number(points)
                                  )}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {played}
                                </td>

                                <td
                                  style={{
                                    padding: "10px",
                                    textAlign: "center",
                                    opacity: 0.8,
                                  }}
                                >
                                  {goalDifference}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      ) : (
        <div
          style={{
            border:
              "1px solid rgba(128,128,128,0.2)",
            borderRadius: "8px",
            padding: "30px",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          No hay tabla de posiciones disponible.
        </div>
      )}

      {/* ======================================
          GOLEADORES / ASISTIDORES
      ====================================== */}

      {playerStats.length > 0 && (
        <section
          style={{
            marginTop: "40px",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#10b981",
              marginBottom: "20px",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Estadísticas
          </h2>

          {playerStats.map(
            (statGroup, idx) => {

              if (
                !statGroup ||
                !Array.isArray(
                  statGroup.players
                )
              ) {
                return null;
              }

              return (
                <div
                  key={idx}
                  style={{
                    marginBottom: "25px",
                    border:
                      "1px solid rgba(128,128,128,0.2)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background:
                        "rgba(16,185,129,0.15)",
                      padding: "10px 15px",
                      fontWeight: "bold",
                      color: "#10b981",
                      textAlign: "center",
                      textTransform: "uppercase",
                      fontSize: "0.95rem",
                    }}
                  >
                    {statGroup.category}
                  </div>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
                    <tbody>
                      {statGroup.players.map(
                        (player, pIdx) => (
                          <tr
                            key={pIdx}
                            style={{
                              borderBottom:
                                "1px solid rgba(128,128,128,0.1)",
                            }}
                          >
                            <td
                              style={{
                                padding:
                                  "10px 15px",
                                fontWeight: "500",
                              }}
                            >
                              {player.name}
                            </td>

                            <td
                              style={{
                                padding:
                                  "10px 15px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#10b981",
                                width: "80px",
                              }}
                            >
                              {player.value}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}

export default function MatchesPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Cargando...
        </div>
      }
    >
      <StandingsContent />
    </Suspense>
  );
}