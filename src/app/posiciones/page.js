"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";


// ============================================================
// COLORES
// ============================================================

const colores = {
  fondo: "#0d131a",
  superficie: "#121821",
  borde: "#263244",
  texto: "#e6edf3",
  muted: "#8b949e",
  muted2: "#9ca3af",
  verde: "#10b981",
};


// ============================================================
// CONTENIDO PRINCIPAL
// ============================================================

function PosicionesContent() {
  const searchParams = useSearchParams();

  // ==========================================================
  // COMPETENCIA DESDE LA URL
  // ==========================================================

  const competition =
    searchParams.get("competition") || "argentina";

  console.log(
    "POSICIONES - competition:",
    competition
  );


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sirve para evitar que una respuesta vieja de la API
  // sobrescriba los datos de una competencia nueva.
  const requestIdRef = useRef(0);


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  async function cargarDatos() {
    if (!competition) return;

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const url =
        `/api/standings?competition=${encodeURIComponent(
          competition
        )}`;

      console.log("================================");
      console.log(
        "POSICIONES - competition:",
        competition
      );
      console.log(
        "POSICIONES - URL:",
        url
      );
      console.log("================================");


      const response = await fetch(url, {
        cache: "no-store",
      });


      if (!response.ok) {
        throw new Error(
          "No se pudieron obtener los datos."
        );
      }


      const json = await response.json();


      // ======================================================
      // SI YA HAY UNA PETICIÓN MÁS NUEVA, DESCARTAMOS ESTA
      // ======================================================

      if (requestId !== requestIdRef.current) {
        console.log(
          "RESPUESTA DESCARTADA:",
          competition
        );

        return;
      }


      console.log("================================");
      console.log(
        "POSICIONES - API competition:",
        json?.competition
      );
      console.log(
        "POSICIONES - API league:",
        json?.league?.name
      );
      console.log(
        "POSICIONES - TABLAS:",
        json?.tables
      );
      console.log("================================");


      setData(json);

    } catch (err) {

      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        "Error cargando posiciones:",
        err
      );

      setError(
        err.message ||
          "Error al cargar los datos."
      );

    } finally {

      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }


  // ==========================================================
  // CARGAR CUANDO CAMBIA LA COMPETENCIA
  // ==========================================================

  useEffect(() => {
    cargarDatos();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition]);


  // ==========================================================
  // NOMBRE DE LA COMPETENCIA
  // ==========================================================

  function nombreCompetencia() {
    switch (competition) {
      case "libertadores":
        return "Copa Libertadores";

      case "sudamericana":
        return "Copa Sudamericana";

      case "copa_argentina":
        return "Copa Argentina";

      case "champions":
        return "Champions League";

      case "europa_league":
        return "Europa League";

      case "conference_league":
        return "Conference League";

      case "argentina":
      default:
        return "Liga Argentina";
    }
  }


  // ==========================================================
  // OBTENER TABLAS DE POSICIONES
  // ==========================================================

  function obtenerTablasPosiciones() {
    if (!data) return [];

    if (Array.isArray(data.tables)) {
      return data.tables;
    }

    if (
      data.tables_groups &&
      Array.isArray(data.tables_groups)
    ) {
      const resultado = [];

      for (const grupo of data.tables_groups) {

        if (
          Array.isArray(grupo.tables)
        ) {
          resultado.push(
            ...grupo.tables
          );
        }
      }

      return resultado;
    }

    return [];
  }


  // ==========================================================
  // OBTENER VALOR DE UNA FILA
  // ==========================================================

  function obtenerValorFila(
    fila,
    posiblesClaves
  ) {
    if (!fila) return "-";

    for (const clave of posiblesClaves) {

      if (
        fila[clave] !== undefined &&
        fila[clave] !== null
      ) {
        return fila[clave];
      }

      if (
        fila.values &&
        typeof fila.values === "object"
      ) {

        if (
          fila.values[clave] !== undefined &&
          fila.values[clave] !== null
        ) {
          return fila.values[clave];
        }
      }
    }

    return "-";
  }


  // ==========================================================
  // ESTADÍSTICAS DE JUGADORES
  // ==========================================================

  function obtenerEstadisticasJugadores() {
    if (!data) return null;

    if (
      data.players_statistics
    ) {
      return data.players_statistics;
    }

    return null;
  }


  // ==========================================================
  // OBTENER TABLAS DE ESTADÍSTICAS
  // ==========================================================

  function obtenerFilasEstadisticas(
    tabla
  ) {
    if (!tabla) return [];

    if (
      Array.isArray(tabla.rows)
    ) {
      return tabla.rows;
    }

    if (
      Array.isArray(tabla.data)
    ) {
      return tabla.data;
    }

    return [];
  }


  // ==========================================================
  // NOMBRE DEL JUGADOR
  // ==========================================================

  function obtenerNombreJugador(
    fila
  ) {
    return (
      fila?.entity?.object?.name ||
      fila?.entity?.name ||
      fila?.name ||
      "-"
    );
  }


  // ==========================================================
  // EQUIPO DEL JUGADOR
  // ==========================================================

  function obtenerEquipoJugador(
    fila
  ) {

    const equipo =
      fila?.entity?.object?.team_name ||
      fila?.entity?.object?.team?.name ||
      fila?.team_name ||
      fila?.team?.name;

    if (equipo) {
      return equipo;
    }

    return "-";
  }


  // ==========================================================
  // VALORES DE ESTADÍSTICA
  // ==========================================================

  function obtenerValoresEstadistica(
    fila
  ) {

    if (!fila) return [];

    if (
      Array.isArray(fila.values)
    ) {
      return fila.values;
    }

    if (
      fila.values &&
      typeof fila.values === "object"
    ) {
      return Object.entries(
        fila.values
      ).map(
        ([key, value]) => ({
          key,
          value,
        })
      );
    }

    return [];
  }


  // ==========================================================
  // COLUMNAS DE ESTADÍSTICA
  // ==========================================================

  function obtenerColumnasEstadistica(
    tabla
  ) {

    if (!tabla) return [];

    if (
      Array.isArray(tabla.columns)
    ) {
      return tabla.columns;
    }

    if (
      Array.isArray(tabla.headers)
    ) {
      return tabla.headers;
    }

    const filas =
      obtenerFilasEstadisticas(tabla);

    if (!filas.length) {
      return [];
    }

    const columnas = new Set();

    filas.forEach((fila) => {

      obtenerValoresEstadistica(
        fila
      ).forEach((valor) => {

        if (valor?.key) {
          columnas.add(
            valor.key
          );
        }
      });
    });

    return Array.from(
      columnas
    );
  }


  // ==========================================================
  // VALOR DE ESTADÍSTICA
  // ==========================================================

  function obtenerValorEstadistica(
    fila,
    columna
  ) {

    const valores =
      obtenerValoresEstadistica(
        fila
      );

    const encontrado =
      valores.find(
        (item) =>
          item?.key === columna
      );

    if (
      encontrado &&
      encontrado.value !== undefined
    ) {
      return encontrado.value;
    }

    return "-";
  }


  // ==========================================================
  // TÍTULO DE COLUMNA
  // ==========================================================

  function tituloColumna(
    columna
  ) {

    const titulos = {
      P: "PJ",
      PJ: "PJ",
      W: "G",
      D: "E",
      L: "P",
      GF: "GF",
      GA: "GC",
      GD: "DG",
      Pts: "PTS",
      Points: "PTS",

      Goals: "Goles",
      GoalsScored: "Goles",
      Assists: "Asistencias",
      YellowCards: "Amarillas",
      RedCards: "Rojas",
      Minutes: "Minutos",
      Appearances: "PJ",
    };

    return (
      titulos[columna] ||
      columna
    );
  }


  // ==========================================================
  // COLOR SEGÚN POSICIÓN
  // ==========================================================

  function colorPosicion(
    posicion
  ) {

    if (
      posicion === 1 ||
      posicion === 2 ||
      posicion === 3 ||
      posicion === 4
    ) {
      return "#10b981";
    }

    return colores.muted;
  }


  // ==========================================================
  // ÚLTIMOS PARTIDOS
  // ==========================================================

  function UltimosPartidos({
    fila,
  }) {

    const posibles =
      fila?.form ||
      fila?.last_matches ||
      fila?.lastGames ||
      fila?.results;

    if (
      !Array.isArray(posibles)
    ) {
      return (
        <span
          style={{
            color: colores.muted,
          }}
        >
          -
        </span>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          gap: 3,
          justifyContent: "center",
        }}
      >
        {posibles
          .slice(-5)
          .map(
            (
              resultado,
              index
            ) => {

              let color =
                colores.muted;

              if (
                resultado === "W" ||
                resultado === "G" ||
                resultado === "V"
              ) {
                color = "#10b981";
              }

              if (
                resultado === "L" ||
                resultado === "P" ||
                resultado === "D"
              ) {
                color = "#ef4444";
              }

              return (
                <span
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius:
                      "50%",
                    backgroundColor:
                      color,
                    display:
                      "inline-block",
                  }}
                />
              );
            }
          )}
      </div>
    );
  }


  // ==========================================================
  // BRACKET
  // ==========================================================

  function BracketStage({
    title,
    matches,
  }) {

    if (
      !Array.isArray(matches) ||
      matches.length === 0
    ) {
      return null;
    }

    return (
      <div
        style={{
          minWidth: 220,
        }}
      >

        <h3
          style={{
            margin:
              "0 0 14px",
            fontSize: 15,
            color:
              colores.texto,
          }}
        >
          {title}
        </h3>


        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 12,
          }}
        >

          {matches.map(
            (
              partido,
              index
            ) => {

              const local =
                partido?.home_team ||
                partido?.home ||
                partido?.local ||
                "-";

              const visitante =
                partido?.away_team ||
                partido?.away ||
                partido?.visitor ||
                "-";

              const resultado =
                partido?.score ||
                partido?.result ||
                "";

              return (
                <div
                  key={index}
                  style={{
                    background:
                      colores.superficie,
                    border:
                      `1px solid ${colores.borde}`,
                    borderRadius: 8,
                    padding: 10,
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span>
                      {local}
                    </span>

                    <strong>
                      {resultado}
                    </strong>
                  </div>


                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                    }}
                  >
                    {visitante}
                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>
    );
  }


  // ==========================================================
  // CARGANDO
  // ==========================================================

  if (loading) {

    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            colores.fondo,
          color:
            colores.texto,
          padding: 24,
        }}
      >

        <div
          style={{
            maxWidth: 1200,
            margin:
              "0 auto",
          }}
        >

          <div
            style={{
              background:
                colores.superficie,
              border:
                `1px solid ${colores.borde}`,
              borderRadius: 10,
              padding: 30,
              textAlign:
                "center",
              color:
                colores.muted,
            }}
          >
            Cargando posiciones...
          </div>

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
          minHeight:
            "100vh",
          background:
            colores.fondo,
          color:
            colores.texto,
          padding: 24,
        }}
      >

        <div
          style={{
            maxWidth: 1200,
            margin:
              "0 auto",
          }}
        >

          <div
            style={{
              background:
                colores.superficie,
              border:
                `1px solid ${colores.borde}`,
              borderRadius: 10,
              padding: 30,
              textAlign:
                "center",
            }}
          >

            <div
              style={{
                color:
                  "#ef4444",
                marginBottom: 15,
              }}
            >
              {error}
            </div>


            <button
              onClick={
                cargarDatos
              }
              style={{
                background:
                  colores.verde,
                color:
                  "#ffffff",
                border: "none",
                borderRadius: 7,
                padding:
                  "10px 18px",
                cursor:
                  "pointer",
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>

          </div>

        </div>

      </main>
    );
  }


  // ==========================================================
  // TABLAS
  // ==========================================================

  const tablas =
    obtenerTablasPosiciones();


  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================

  const estadisticas =
    obtenerEstadisticasJugadores();


  const tablasEstadisticas =
    estadisticas?.tables || [];


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      style={{
        minHeight:
          "100vh",
        background:
          colores.fondo,
        color:
          colores.texto,
        padding:
          "24px 16px 50px",
      }}
    >

      <div
        style={{
          maxWidth: 1200,
          margin:
            "0 auto",
        }}
      >

        {/* ====================================================
            ENCABEZADO
        ==================================================== */}

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 15,
            marginBottom:
              24,
            flexWrap:
              "wrap",
          }}
        >

          <div>

            <Link
              href="/"
              style={{
                color:
                  colores.muted,
                textDecoration:
                  "none",
                fontSize: 13,
              }}
            >
              ← Volver
            </Link>


            <h1
              style={{
                margin:
                  "8px 0 0",
                fontSize:
                  "clamp(24px, 4vw, 32px)",
                lineHeight: 1.2,
              }}
            >
              {nombreCompetencia()}
            </h1>

          </div>


          <button
            onClick={
              cargarDatos
            }
            style={{
              background:
                colores.superficie,
              color:
                colores.texto,
              border:
                `1px solid ${colores.borde}`,
              borderRadius: 7,
              padding:
                "9px 14px",
              cursor:
                "pointer",
              fontWeight: 600,
            }}
          >
            Actualizar
          </button>

        </div>


        {/* ====================================================
            INFORMACIÓN DE API
        ==================================================== */}

        {data?.league && (
          <div
            style={{
              marginBottom: 20,
              color:
                colores.muted,
              fontSize: 14,
            }}
          >
            {data.league.name}
          </div>
        )}


        {/* ====================================================
            TABLAS DE POSICIONES
        ==================================================== */}

        {tablas.length > 0 && (

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 22,
            }}
          >

            {tablas.map(
              (
                tabla,
                tablaIndex
              ) => {

                const filas =
                  tabla?.rows ||
                  tabla?.data ||
                  [];

                if (
                  !Array.isArray(
                    filas
                  ) ||
                  filas.length === 0
                ) {
                  return null;
                }


                return (
                  <section
                    key={
                      tabla.id ||
                      tabla.name ||
                      tablaIndex
                    }
                    style={{
                      background:
                        colores.superficie,
                      border:
                        `1px solid ${colores.borde}`,
                      borderRadius: 10,
                      overflow:
                        "hidden",
                    }}
                  >

                    {/* TÍTULO */}

                    <div
                      style={{
                        padding:
                          "15px 16px",
                        borderBottom:
                          `1px solid ${colores.borde}`,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: 10,
                      }}
                    >

                      <h2
                        style={{
                          margin: 0,
                          fontSize: 17,
                        }}
                      >
                        {tabla.name ||
                          tabla.title ||
                          `Tabla ${tablaIndex + 1}`}
                      </h2>

                    </div>


                    {/* TABLA */}

                    <div
                      style={{
                        overflowX:
                          "auto",
                      }}
                    >

                      <table
                        style={{
                          width:
                            "100%",
                          borderCollapse:
                            "collapse",
                          minWidth:
                            650,
                        }}
                      >

                        <thead>

                          <tr
                            style={{
                              borderBottom:
                                `1px solid ${colores.borde}`,
                              color:
                                colores.muted,
                              fontSize: 12,
                            }}
                          >

                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                                width: 45,
                              }}
                            >
                              #
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "left",
                              }}
                            >
                              Equipo
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              PJ
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              G
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              E
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              P
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              GF
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              GC
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              DG
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                                fontWeight:
                                  700,
                              }}
                            >
                              PTS
                            </th>


                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                              }}
                            >
                              Forma
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {filas.map(
                            (
                              fila,
                              index
                            ) => {

                              const posicion =
                                fila.position ||
                                fila.pos ||
                                index + 1;

                              const equipo =
                                fila.team?.name ||
                                fila.team_name ||
                                fila.name ||
                                fila.entity?.object?.name ||
                                "-";

                              const pj =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "PJ",
                                    "pj",
                                    "played",
                                    "matches",
                                  ]
                                );

                              const ganados =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "W",
                                    "w",
                                    "wins",
                                    "won",
                                  ]
                                );

                              const empatados =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "D",
                                    "d",
                                    "draws",
                                    "draw",
                                  ]
                                );

                              const perdidos =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "L",
                                    "l",
                                    "losses",
                                    "lost",
                                  ]
                                );

                              const gf =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "GF",
                                    "gf",
                                    "goals_for",
                                  ]
                                );

                              const gc =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "GA",
                                    "ga",
                                    "GC",
                                    "gc",
                                    "goals_against",
                                  ]
                                );

                              const gd =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "GD",
                                    "gd",
                                    "goal_difference",
                                  ]
                                );

                              const puntos =
                                obtenerValorFila(
                                  fila,
                                  [
                                    "Pts",
                                    "pts",
                                    "Points",
                                    "points",
                                    "Puntos",
                                  ]
                                );


                              return (
                                <tr
                                  key={
                                    fila.id ||
                                    fila.team_id ||
                                    index
                                  }
                                  style={{
                                    borderBottom:
                                      `1px solid ${colores.borde}`,
                                  }}
                                >

                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                      color:
                                        colorPosicion(
                                          posicion
                                        ),
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {posicion}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "left",
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    {equipo}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {pj}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {ganados}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {empatados}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {perdidos}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {gf}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {gc}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {gd}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                      fontWeight:
                                        800,
                                      color:
                                        colores.verde,
                                    }}
                                  >
                                    {puntos}
                                  </td>


                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    <UltimosPartidos
                                      fila={
                                        fila
                                      }
                                    />
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
            )}

          </div>
        )}


        {/* ====================================================
            SI NO HAY TABLAS
        ==================================================== */}

        {tablas.length === 0 && (

          <div
            style={{
              background:
                colores.superficie,
              border:
                `1px solid ${colores.borde}`,
              borderRadius: 10,
              padding: 25,
              color:
                colores.muted,
              textAlign:
                "center",
            }}
          >
            No hay tablas de posiciones
            disponibles para esta competencia.
          </div>

        )}


        {/* ====================================================
            ESTADÍSTICAS DE JUGADORES
        ==================================================== */}

        {tablasEstadisticas.length >
          0 && (

          <section
            style={{
              marginTop: 30,
            }}
          >

            <h2
              style={{
                margin:
                  "0 0 18px",
                fontSize: 21,
              }}
            >
              Estadísticas de jugadores
            </h2>


            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: 20,
              }}
            >

              {tablasEstadisticas.map(
                (
                  tabla,
                  tablaIndex
                ) => {

                  const filas =
                    obtenerFilasEstadisticas(
                      tabla
                    );

                  const columnas =
                    obtenerColumnasEstadistica(
                      tabla
                    );


                  if (
                    filas.length === 0
                  ) {
                    return null;
                  }


                  return (
                    <div
                      key={
                        tabla.id ||
                        tabla.name ||
                        tablaIndex
                      }
                      style={{
                        background:
                          colores.superficie,
                        border:
                          `1px solid ${colores.borde}`,
                        borderRadius: 10,
                        overflow:
                          "hidden",
                      }}
                    >

                      <div
                        style={{
                          padding:
                            "15px 16px",
                          borderBottom:
                            `1px solid ${colores.borde}`,
                        }}
                      >

                        <h3
                          style={{
                            margin: 0,
                            fontSize: 17,
                          }}
                        >
                          {tabla.name ||
                            tabla.title ||
                            `Estadística ${tablaIndex + 1}`}
                        </h3>

                      </div>


                      <div
                        style={{
                          overflowX:
                            "auto",
                        }}
                      >

                        <table
                          style={{
                            width:
                              "100%",
                            borderCollapse:
                              "collapse",
                            minWidth:
                              500,
                          }}
                        >

                          <thead>

                            <tr
                              style={{
                                borderBottom:
                                  `1px solid ${colores.borde}`,
                                color:
                                  colores.muted,
                                fontSize: 12,
                              }}
                            >

                              <th
                                style={{
                                  padding:
                                    "11px 10px",
                                  textAlign:
                                    "center",
                                  width: 45,
                                }}
                              >
                                #
                              </th>


                              <th
                                style={{
                                  padding:
                                    "11px 10px",
                                  textAlign:
                                    "left",
                                }}
                              >
                                Jugador
                              </th>


                              <th
                                style={{
                                  padding:
                                    "11px 10px",
                                  textAlign:
                                    "left",
                                }}
                              >
                                Equipo
                              </th>


                              {columnas.map(
                                (
                                  columna
                                ) => (
                                  <th
                                    key={
                                      columna
                                    }
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    {tituloColumna(
                                      typeof columna ===
                                        "object"
                                        ? columna.key ||
                                            columna.name
                                        : columna
                                    )}
                                  </th>
                                )
                              )}

                            </tr>

                          </thead>


                          <tbody>

                            {filas.map(
                              (
                                fila,
                                index
                              ) => {

                                const jugador =
                                  obtenerNombreJugador(
                                    fila
                                  );

                                const equipo =
                                  obtenerEquipoJugador(
                                    fila
                                  );


                                return (
                                  <tr
                                    key={
                                      fila.num ||
                                      fila.id ||
                                      index
                                    }
                                    style={{
                                      borderBottom:
                                        `1px solid ${colores.borde}`,
                                    }}
                                  >

                                    <td
                                      style={{
                                        padding:
                                          "11px 10px",
                                        textAlign:
                                          "center",
                                        color:
                                          colores.muted,
                                      }}
                                    >
                                      {fila.num ||
                                        index + 1}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          "11px 10px",
                                        fontWeight:
                                          600,
                                      }}
                                    >
                                      {jugador}
                                    </td>


                                    <td
                                      style={{
                                        padding:
                                          "11px 10px",
                                        color:
                                          colores.muted2,
                                      }}
                                    >
                                      {equipo}
                                    </td>


                                    {columnas.map(
                                      (
                                        columna
                                      ) => {

                                        const key =
                                          typeof columna ===
                                          "object"
                                            ? columna.key ||
                                              columna.name
                                            : columna;

                                        return (
                                          <td
                                            key={
                                              key
                                            }
                                            style={{
                                              padding:
                                                "11px 10px",
                                              textAlign:
                                                "center",
                                              fontWeight:
                                                700,
                                            }}
                                          >
                                            {obtenerValorEstadistica(
                                              fila,
                                              key
                                            )}
                                          </td>
                                        );
                                      }
                                    )}

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>
        )}


        {/* ====================================================
            ELIMINATORIAS / BRACKETS
        ==================================================== */}

        {data?.brackets &&
          Array.isArray(
            data.brackets
          ) &&
          data.brackets.length > 0 && (

            <section
              style={{
                marginTop: 30,
              }}
            >

              <h2
                style={{
                  margin:
                    "0 0 18px",
                  fontSize: 21,
                }}
              >
                Eliminatorias
              </h2>


              <div
                style={{
                  display:
                    "flex",
                  gap: 24,
                  overflowX:
                    "auto",
                  paddingBottom:
                    10,
                }}
              >

                {data.brackets.map(
                  (
                    etapa,
                    index
                  ) => (

                    <BracketStage
                      key={
                        etapa.id ||
                        etapa.name ||
                        index
                      }
                      title={
                        etapa.name ||
                        etapa.title ||
                        `Etapa ${index + 1}`
                      }
                      matches={
                        etapa.matches ||
                        etapa.games ||
                        []
                      }
                    />

                  )
                )}

              </div>

            </section>
          )}


        {/* ====================================================
            ACTUALIZACIÓN
        ==================================================== */}

        <div
          style={{
            marginTop: 30,
            paddingTop: 15,
            borderTop:
              `1px solid ${colores.borde}`,
            color:
              colores.muted,
            fontSize: 12,
            textAlign:
              "center",
          }}
        >
          Datos actualizados desde Promiedos.
        </div>

      </div>

    </main>
  );
}


// ============================================================
// SUSPENSE
// ============================================================
// IMPORTANTE:
// useSearchParams() necesita estar dentro de Suspense para que
// Next.js pueda hacer correctamente el build/prerender en Vercel.
// ============================================================

export default function PosicionesPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight:
              "100vh",
            background:
              colores.fondo,
            color:
              colores.texto,
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin:
                "0 auto",
            }}
          >
            <div
              style={{
                background:
                  colores.superficie,
                border:
                  `1px solid ${colores.borde}`,
                borderRadius: 10,
                padding: 30,
                textAlign:
                  "center",
                color:
                  colores.muted,
              }}
            >
              Cargando posiciones...
            </div>
          </div>
        </main>
      }
    >
      <PosicionesContent />
    </Suspense>
  );
}