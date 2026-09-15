"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";


// ============================================================
// EXTRAER VALOR DE values[]
// ============================================================

function getValue(values, key, defaultValue = 0) {
  if (!Array.isArray(values)) {
    return defaultValue;
  }

  const item = values.find(
    (v) => v && v.key === key
  );

  return item?.value ?? defaultValue;
}


// ============================================================
// NORMALIZAR UN GRUPO DE PROMIEDOS
// ============================================================

function normalizarGrupo(grupo) {

  if (!grupo || typeof grupo !== "object") {
    return null;
  }

  /*
    La estructura real de Promiedos es aproximadamente:

    {
      ...
      values: [
        {
          num: 1,
          values: [
            { key: "GamePlayed", value: "9" },
            { key: "Goals", value: "20:8" },
            { key: "Ratio", value: "12" },
            { key: "Points", value: "21" },
            { key: "GamesWon", value: "6" },
            { key: "GamesEven", value: "3" },
            { key: "GamesLost", value: "0" }
          ],
          entity: {
            object: {
              name: "Equipo"
            }
          }
        }
      ]
    }
  */

  let filas = [];

  if (Array.isArray(grupo.values)) {
    filas = grupo.values;
  } else if (Array.isArray(grupo.rows)) {
    filas = grupo.rows;
  } else if (Array.isArray(grupo.teams)) {
    filas = grupo.teams;
  }

  const teams = filas
    .map((fila, index) => {

      if (!fila) {
        return null;
      }

      // ------------------------------------------
      // EQUIPO
      // ------------------------------------------

      const entity =
        fila.entity?.object ||
        fila.entity ||
        {};

      const teamName =
        entity.name ||
        entity.short_name ||
        fila.name ||
        fila.team_name ||
        "Equipo";


      // ------------------------------------------
      // VALORES
      // ------------------------------------------

      const values =
        Array.isArray(fila.values)
          ? fila.values
          : [];


      const played =
        getValue(
          values,
          "GamePlayed",
          0
        );


      const goals =
        getValue(
          values,
          "Goals",
          "0:0"
        );


      const goalDifference =
        getValue(
          values,
          "Ratio",
          0
        );


      const points =
        getValue(
          values,
          "Points",
          0
        );


      const won =
        getValue(
          values,
          "GamesWon",
          0
        );


      const drawn =
        getValue(
          values,
          "GamesEven",
          0
        );


      const lost =
        getValue(
          values,
          "GamesLost",
          0
        );


      const trend =
        getValue(
          values,
          "{trend}",
          []
        );


      return {
        id:
          entity.id ||
          fila.id ||
          `${teamName}-${index}`,

        name: teamName,

        short_name:
          entity.short_name ||
          teamName,

        position:
          fila.num ??
          index + 1,

        played,

        goals,

        goalDifference,

        points,

        won,

        drawn,

        lost,

        trend,

        entity
      };

    })
    .filter(Boolean);


  if (teams.length === 0) {
    return null;
  }


  // ------------------------------------------
  // NOMBRE DEL GRUPO
  // ------------------------------------------

  const title =
    grupo.name ||
    grupo.title ||
    grupo.label ||
    grupo.description ||
    grupo.type ||
    "Tabla de posiciones";


  return {
    ...grupo,
    title,
    teams
  };
}


// ============================================================
// OBTENER TODAS LAS TABLAS
// ============================================================

function obtenerTablas(data) {

  if (!data) {
    return [];
  }


  // ------------------------------------------
  // ESTRUCTURA ACTUAL DE PROMIEDOS
  // ------------------------------------------

  if (
    Array.isArray(data.tables_groups)
  ) {

    return data.tables_groups
      .map(normalizarGrupo)
      .filter(Boolean);

  }


  // ------------------------------------------
  // ESTRUCTURA QUE GUARDAMOS EN REDIS
  // ------------------------------------------

  if (
    Array.isArray(data.tables)
  ) {

    return data.tables
      .map(normalizarGrupo)
      .filter(Boolean);

  }


  return [];
}


// ============================================================
// PÁGINA
// ============================================================

function StandingsContent() {

  const searchParams =
    useSearchParams();


  const leagueId =
    searchParams.get("leagueId");


  const leagueName =
    searchParams.get("name") ||
    "Liga Profesional Argentina";


  const [standings, setStandings] =
    useState(null);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState(null);


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  useEffect(() => {

    const fetchStandings = async () => {

      try {

        setLoading(true);
        setError(null);


        const url =
          leagueId
            ? `/api/standings?leagueId=${encodeURIComponent(leagueId)}`
            : `/api/standings`;


        console.log(
          "Cargando posiciones:",
          url
        );


        const res =
          await fetch(
            url,
            {
              cache: "no-store"
            }
          );


        if (!res.ok) {

          throw new Error(
            `No se pudieron cargar los datos (${res.status})`
          );

        }


        const data =
          await res.json();


        console.log(
          "=========================================="
        );

        console.log(
          "DATOS RECIBIDOS DE /api/standings"
        );

        console.log(data);

        console.log(
          "=========================================="
        );


        setStandings(data);


      } catch (err) {

        console.error(
          "Error cargando posiciones:",
          err
        );


        setError(
          err.message
        );


      } finally {

        setLoading(false);

      }

    };


    fetchStandings();

  }, [leagueId]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
          textAlign: "center"
        }}
      >

        <div
          style={{
            opacity: 0.7
          }}
        >
          Cargando posiciones...
        </div>

      </main>
    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px"
        }}
      >

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            borderBottom:
              "1px solid rgba(128,128,128,0.2)",
            paddingBottom: "15px"
          }}
        >

          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: "bold",
              margin: 0
            }}
          >
            {decodeURIComponent(leagueName)}
          </h1>


          <Link
            href="/"
            style={{
              color: "#10b981",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            ← Volver al inicio
          </Link>

        </header>


        <div
          style={{
            padding: "30px",
            border:
              "1px solid rgba(128,128,128,0.2)",
            borderRadius: "8px",
            textAlign: "center"
          }}
        >
          Error: {error}
        </div>

      </main>
    );

  }


  // ==========================================================
  // TABLAS
  // ==========================================================

  const tablesList =
    obtenerTablas(standings);


  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================

  let playerStats = [];


  if (
    Array.isArray(
      standings?.stats
    )
  ) {

    playerStats =
      standings.stats;

  } else if (
    Array.isArray(
      standings?.players_statistics
    )
  ) {

    playerStats =
      standings.players_statistics;

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px"
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
          paddingBottom: "15px"
        }}
      >

        <h1
          style={{
            fontSize: "1.3rem",
            fontWeight: "bold",
            margin: 0
          }}
        >
          ⚽ {decodeURIComponent(leagueName)}
        </h1>


        <Link
          href="/"
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontWeight: "600"
          }}
        >
          ← Volver al inicio
        </Link>

      </header>


      {/* ======================================
          TABLAS
      ====================================== */}

      {tablesList.length > 0 ? (

        tablesList.map(
          (section, sIndex) => {

            const sectionTitle =
              String(
                section.title ||
                `Tabla ${sIndex + 1}`
              );


            const lowerTitle =
              sectionTitle.toLowerCase();


            const isPromedios =
              lowerTitle.includes(
                "promedio"
              ) ||
              lowerTitle.includes(
                "promedios"
              );


            return (

              <section
                key={sIndex}
                style={{
                  marginBottom: "35px"
                }}
              >

                {/* ==================================
                    TITULO
                ================================== */}

                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#10b981",
                    marginBottom: "10px",
                    textTransform:
                      "uppercase"
                  }}
                >
                  {sectionTitle}
                </h2>


                {/* ==================================
                    TABLA
                ================================== */}

                <div
                  style={{
                    border:
                      "1px solid rgba(128,128,128,0.2)",
                    borderRadius: "8px",
                    overflowX: "auto"
                  }}
                >

                  <table
                    style={{
                      width: "100%",
                      borderCollapse:
                        "collapse",
                      fontSize: "0.9rem"
                    }}
                  >

                    {/* ==============================
                        CABECERA
                    ============================== */}

                    <thead>

                      <tr
                        style={{
                          background:
                            "rgba(16,185,129,0.15)",
                          color:
                            "#10b981"
                        }}
                      >

                        <th
                          style={{
                            padding: "10px",
                            width: "40px",
                            textAlign: "center"
                          }}
                        >
                          #
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "left"
                          }}
                        >
                          Equipo
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          Pts
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          PJ
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          G
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          E
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          P
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          GF:GC
                        </th>


                        <th
                          style={{
                            padding: "10px",
                            textAlign: "center"
                          }}
                        >
                          DG
                        </th>

                      </tr>

                    </thead>


                    {/* ==============================
                        EQUIPOS
                    ============================== */}

                    <tbody>

                      {section.teams.map(
                        (team, index) => {

                          return (

                            <tr
                              key={
                                team.id ||
                                `${team.name}-${index}`
                              }
                              style={{
                                borderBottom:
                                  "1px solid rgba(128,128,128,0.1)"
                              }}
                            >

                              {/* POSICION */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8,
                                  fontWeight:
                                    "600"
                                }}
                              >
                                {team.position}
                              </td>


                              {/* EQUIPO */}

                              <td
                                style={{
                                  padding: "10px",
                                  fontWeight: "500"
                                }}
                              >
                                {team.name}
                              </td>


                              {/* PUNTOS */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: "#10b981"
                                }}
                              >
                                {team.points}
                              </td>


                              {/* PJ */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8
                                }}
                              >
                                {team.played}
                              </td>


                              {/* GANADOS */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8
                                }}
                              >
                                {team.won}
                              </td>


                              {/* EMPATADOS */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8
                                }}
                              >
                                {team.drawn}
                              </td>


                              {/* PERDIDOS */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8
                                }}
                              >
                                {team.lost}
                              </td>


                              {/* GOLES */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  opacity: 0.8
                                }}
                              >
                                {team.goals}
                              </td>


                              {/* DIFERENCIA */}

                              <td
                                style={{
                                  padding: "10px",
                                  textAlign: "center",
                                  fontWeight: "600"
                                }}
                              >
                                {team.goalDifference}
                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </section>

            );

          }

        )

      ) : (

        <div
          style={{
            border:
              "1px solid rgba(128,128,128,0.2)",
            borderRadius: "8px",
            padding: "30px",
            textAlign: "center",
            opacity: 0.6
          }}
        >
          No hay tabla de posiciones disponible.
        </div>

      )}


      {/* ======================================
          ESTADÍSTICAS
      ====================================== */}

      {playerStats.length > 0 && (

        <section
          style={{
            marginTop: "40px"
          }}
        >

          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#10b981",
              marginBottom: "20px",
              textTransform: "uppercase",
              textAlign: "center"
            }}
          >
            Estadísticas
          </h2>


          {playerStats.map(
            (statGroup, idx) => {

              if (!statGroup) {
                return null;
              }


              const players =
                Array.isArray(
                  statGroup.players
                )
                  ? statGroup.players
                  : Array.isArray(
                      statGroup.data
                    )
                  ? statGroup.data
                  : Array.isArray(
                      statGroup.rows
                    )
                  ? statGroup.rows
                  : [];


              if (
                players.length === 0
              ) {
                return null;
              }


              const category =
                statGroup.category ||
                statGroup.name ||
                statGroup.title ||
                "ESTADÍSTICAS";


              return (

                <div
                  key={idx}
                  style={{
                    marginBottom: "25px",
                    border:
                      "1px solid rgba(128,128,128,0.2)",
                    borderRadius: "8px",
                    overflow: "hidden"
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
                      fontSize: "0.95rem"
                    }}
                  >
                    {category}
                  </div>


                  <table
                    style={{
                      width: "100%",
                      borderCollapse:
                        "collapse",
                      fontSize: "0.9rem"
                    }}
                  >

                    <thead>

                      <tr
                        style={{
                          background:
                            "rgba(128,128,128,0.06)"
                        }}
                      >

                        <th
                          style={{
                            padding: "8px 15px",
                            textAlign: "left"
                          }}
                        >
                          Jugador
                        </th>

                        <th
                          style={{
                            padding: "8px 15px",
                            textAlign: "left"
                          }}
                        >
                          Equipo
                        </th>

                        <th
                          style={{
                            padding: "8px 15px",
                            textAlign: "right"
                          }}
                        >
                          Total
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {players.map(
                        (player, pIdx) => {

                          const playerName =
                            player.name ||
                            player.player_name ||
                            player.player ||
                            player.nombre ||
                            player.full_name ||
                            "Jugador";


                          const playerTeam =
                            player.team ||
                            player.team_name ||
                            player.club ||
                            player.club_name ||
                            player.equipo ||
                            player.teamName ||
                            "Sin equipo";


                          const playerValue =
                            player.value ??
                            player.goals ??
                            player.assists ??
                            player.total ??
                            player.count ??
                            player.amount ??
                            0;


                          return (

                            <tr
                              key={
                                player.id ||
                                player.player_id ||
                                `${playerName}-${pIdx}`
                              }
                              style={{
                                borderBottom:
                                  "1px solid rgba(128,128,128,0.1)"
                              }}
                            >

                              <td
                                style={{
                                  padding: "10px 15px",
                                  fontWeight: "500"
                                }}
                              >
                                {playerName}
                              </td>


                              <td
                                style={{
                                  padding: "10px 15px",
                                  opacity: 0.7
                                }}
                              >
                                {playerTeam}
                              </td>


                              <td
                                style={{
                                  padding: "10px 15px",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                  color: "#10b981"
                                }}
                              >
                                {playerValue}
                              </td>

                            </tr>

                          );

                        }
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


// ============================================================
// EXPORT
// ============================================================

export default function MatchesPage() {

  return (

    <Suspense
      fallback={
        <div
          style={{
            padding: "40px",
            textAlign: "center"
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