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
// CONTENIDO DE POSICIONES
// ============================================================

function PosicionesContent() {
  const searchParams = useSearchParams();

  // ==========================================================
  // COMPETENCIA
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

  const requestIdRef = useRef(0);


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  async function cargarDatos() {
    if (!competition) return;

    const requestId =
      ++requestIdRef.current;

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


      const response = await fetch(
        url,
        {
          cache: "no-store",
        }
      );


      if (!response.ok) {
        throw new Error(
          "No se pudieron obtener los datos."
        );
      }


      const json =
        await response.json();


      // ======================================================
      // DESCARTAR RESPUESTAS VIEJAS
      // ======================================================

      if (
        requestId !==
        requestIdRef.current
      ) {
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
        "POSICIONES - TABLES:",
        json?.tables
      );
      console.log("================================");


      setData(json);

    } catch (err) {

      if (
        requestId !==
        requestIdRef.current
      ) {
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

      if (
        requestId ===
        requestIdRef.current
      ) {
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
  // NOMBRE DE COMPETENCIA
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
  // OBTENER TORNEOS
  //
  // ESTRUCTURA REAL:
  //
  // data.tables[]
  //   ├── name
  //   └── tables[]
  //        ├── name
  //        └── table
  //             ├── columns[]
  //             └── rows[]
  //
  // ==========================================================

  function obtenerTablasPosiciones() {

    if (
      !data ||
      !Array.isArray(data.tables)
    ) {
      return [];
    }


    const resultado = [];


    data.tables.forEach(
      (torneo) => {

        if (
          !Array.isArray(
            torneo.tables
          )
        ) {
          return;
        }


        torneo.tables.forEach(
          (grupo) => {

            if (
              !grupo.table
            ) {
              return;
            }


            const tabla =
              grupo.table;


            if (
              !Array.isArray(
                tabla.rows
              )
            ) {
              return;
            }


            resultado.push({
              torneo:
                torneo.name ||
                "",

              grupo:
                grupo.name ||
                "",

              table:
                tabla,
            });
          }
        );
      }
    );


    return resultado;
  }


  // ==========================================================
  // OBTENER VALOR DE UNA FILA
  // ==========================================================

  function obtenerValorFila(
    fila,
    clave
  ) {

    if (
      !fila ||
      !Array.isArray(
        fila.values
      )
    ) {
      return "-";
    }


    const encontrado =
      fila.values.find(
        (item) =>
          item?.key === clave
      );


    if (
      encontrado &&
      encontrado.value !==
        undefined &&
      encontrado.value !== null
    ) {
      return encontrado.value;
    }


    return "-";
  }


  // ==========================================================
  // OBTENER ESTADÍSTICAS DE JUGADORES
  // ==========================================================

  function obtenerEstadisticasJugadores() {

    if (
      !data?.players_statistics
    ) {
      return [];
    }


    if (
      Array.isArray(
        data.players_statistics.tables
      )
    ) {
      return data.players_statistics.tables;
    }


    return [];
  }


  // ==========================================================
  // OBTENER FILAS DE ESTADÍSTICAS
  // ==========================================================

  function obtenerFilasEstadisticas(
    tabla
  ) {

    if (
      Array.isArray(
        tabla?.rows
      )
    ) {
      return tabla.rows;
    }


    if (
      Array.isArray(
        tabla?.data
      )
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

    return (
      fila?.entity?.object?.team_name ||
      fila?.entity?.object?.team?.name ||
      fila?.team_name ||
      fila?.team?.name ||
      "-"
    );
  }


  // ==========================================================
  // VALORES DE ESTADÍSTICAS
  // ==========================================================

  function obtenerValoresEstadistica(
    fila
  ) {

    if (!fila) {
      return [];
    }


    if (
      Array.isArray(
        fila.values
      )
    ) {
      return fila.values;
    }


    if (
      fila.values &&
      typeof fila.values ===
        "object"
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
  // COLUMNAS DE ESTADÍSTICAS
  // ==========================================================

  function obtenerColumnasEstadistica(
    tabla
  ) {

    if (!tabla) {
      return [];
    }


    if (
      Array.isArray(
        tabla.columns
      )
    ) {

      return tabla.columns
        .map((columna) => {

          if (
            typeof columna ===
            "string"
          ) {
            return {
              key: columna,
              title: columna,
            };
          }

          return columna;
        });
    }


    const filas =
      obtenerFilasEstadisticas(
        tabla
      );


    const columnas = [];


    filas.forEach(
      (fila) => {

        obtenerValoresEstadistica(
          fila
        ).forEach(
          (valor) => {

            if (
              valor?.key &&
              !columnas.some(
                (c) =>
                  c.key ===
                  valor.key
              )
            ) {

              columnas.push({
                key:
                  valor.key,

                title:
                  tituloColumna(
                    valor.key
                  ),
              });
            }
          }
        );
      }
    );


    return columnas;
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
          item?.key ===
          columna
      );


    if (
      encontrado &&
      encontrado.value !==
        undefined
    ) {
      return encontrado.value;
    }


    return "-";
  }


  // ==========================================================
  // TÍTULOS DE COLUMNAS
  // ==========================================================

  function tituloColumna(
    columna
  ) {

    const titulos = {

      Points: "PTS",

      GamePlayed: "J",

      Goals: "Gol",

      Ratio: "+/-",

      GamesWon: "G",

      GamesEven: "E",

      GamesLost: "P",

      "{trend}":
        "Últimas",

      GoalsScored:
        "Goles",

      Assists:
        "Asistencias",

      YellowCards:
        "Amarillas",

      RedCards:
        "Rojas",

      Minutes:
        "Minutos",

      Appearances:
        "PJ",
    };


    return (
      titulos[columna] ||
      columna
    );
  }


  // ==========================================================
  // FORMA
  // ==========================================================

  function UltimosPartidos({
    valor,
  }) {

    if (
      !Array.isArray(valor)
    ) {
      return (
        <span
          style={{
            color:
              colores.muted,
          }}
        >
          -
        </span>
      );
    }


    return (
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "center",
          gap: 4,
        }}
      >

        {valor.map(
          (
            resultado,
            index
          ) => {

            let color =
              colores.muted;


            // Promiedos utiliza:
            // 0 = derrota
            // 1 = empate
            // 2 = victoria

            if (
              resultado === 2
            ) {
              color =
                "#10b981";
            }

            else if (
              resultado === 1
            ) {
              color =
                "#f59e0b";
            }

            else if (
              resultado === 0
            ) {
              color =
                "#ef4444";
            }


            return (
              <span
                key={index}
                style={{
                  width: 9,
                  height: 9,
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
                marginBottom:
                  15,
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
                  "#fff",
                border:
                  "none",
                borderRadius:
                  7,
                padding:
                  "10px 18px",
                cursor:
                  "pointer",
                fontWeight:
                  600,
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
  // DATOS
  // ==========================================================

  const tablas =
    obtenerTablasPosiciones();


  const estadisticas =
    obtenerEstadisticasJugadores();


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

        {/* ==================================================
            ENCABEZADO
        ================================================== */}

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
              25,
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
                lineHeight:
                  1.2,
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
              borderRadius:
                7,
              padding:
                "9px 14px",
              cursor:
                "pointer",
              fontWeight:
                600,
            }}
          >
            Actualizar
          </button>

        </div>


        {/* ==================================================
            NOMBRE DE LA LIGA
        ================================================== */}

        {data?.league?.name && (

          <div
            style={{
              marginBottom:
                20,
              color:
                colores.muted,
              fontSize:
                14,
            }}
          >
            {data.league.name}
          </div>

        )}


        {/* ==================================================
            TABLAS DE POSICIONES
        ================================================== */}

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
                item,
                tablaIndex
              ) => {

                const tabla =
                  item.table;


                const columnas =
                  Array.isArray(
                    tabla.columns
                  )
                    ? tabla.columns
                    : [];


                const filas =
                  Array.isArray(
                    tabla.rows
                  )
                    ? tabla.rows
                    : [];


                return (
                  <section
                    key={
                      `${item.torneo}-${item.grupo}-${tablaIndex}`
                    }
                    style={{
                      background:
                        colores.superficie,
                      border:
                        `1px solid ${colores.borde}`,
                      borderRadius:
                        10,
                      overflow:
                        "hidden",
                    }}
                  >

                    {/* ======================================
                        CABECERA
                    ====================================== */}

                    <div
                      style={{
                        padding:
                          "15px 16px",
                        borderBottom:
                          `1px solid ${colores.borde}`,
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            18,
                          fontWeight:
                            700,
                        }}
                      >
                        {item.torneo}
                      </div>


                      {item.grupo && (

                        <div
                          style={{
                            marginTop:
                              4,
                            fontSize:
                              13,
                            color:
                              colores.muted,
                          }}
                        >
                          {item.grupo}
                        </div>

                      )}

                    </div>


                    {/* ======================================
                        TABLA
                    ====================================== */}

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
                              fontSize:
                                12,
                            }}
                          >

                            {/* POSICIÓN */}

                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "center",
                                width:
                                  45,
                              }}
                            >
                              #
                            </th>


                            {/* EQUIPO */}

                            <th
                              style={{
                                padding:
                                  "11px 10px",
                                textAlign:
                                  "left",
                                minWidth:
                                  190,
                              }}
                            >
                              Equipo
                            </th>


                            {/* COLUMNAS REALES
                                DE PROMIEDOS */}

                            {columnas.map(
                              (
                                columna,
                                index
                              ) => {

                                const key =
                                  columna?.key ||
                                  "";

                                return (
                                  <th
                                    key={
                                      `${key}-${index}`
                                    }
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                      whiteSpace:
                                        "nowrap",
                                      fontWeight:
                                        columna?.is_bold
                                          ? 700
                                          : 500,
                                    }}
                                  >
                                    {columna.title ||
                                      tituloColumna(
                                        key
                                      )}
                                  </th>
                                );
                              }
                            )}

                          </tr>

                        </thead>


                        <tbody>

                          {filas.map(
                            (
                              fila,
                              index
                            ) => {

                              const posicion =
                                fila.num ||
                                index + 1;


                              const equipo =
                                fila?.entity
                                  ?.object
                                  ?.name ||
                                "-";


                              const valores =
                                Array.isArray(
                                  fila.values
                                )
                                  ? fila.values
                                  : [];


                              return (
                                <tr
                                  key={
                                    fila?.entity
                                      ?.object
                                      ?.id ||
                                    `${equipo}-${index}`
                                  }
                                  style={{
                                    borderBottom:
                                      `1px solid ${colores.borde}`,
                                  }}
                                >

                                  {/* POSICIÓN */}

                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "center",
                                      fontWeight:
                                        700,
                                      color:
                                        posicion <= 4
                                          ? colores.verde
                                          : colores.muted,
                                    }}
                                  >
                                    {posicion}
                                  </td>


                                  {/* EQUIPO */}

                                  <td
                                    style={{
                                      padding:
                                        "11px 10px",
                                      textAlign:
                                        "left",
                                      fontWeight:
                                        600,
                                      whiteSpace:
                                        "nowrap",
                                    }}
                                  >

                                    {equipo}

                                  </td>


                                  {/* VALORES */}

                                  {columnas.map(
                                    (
                                      columna,
                                      columnaIndex
                                    ) => {

                                      const key =
                                        columna?.key ||
                                        "";


                                      const valor =
                                        obtenerValorFila(
                                          fila,
                                          key
                                        );


                                      // =================================
                                      // ÚLTIMOS PARTIDOS
                                      // =================================

                                      if (
                                        key ===
                                        "{trend}"
                                      ) {

                                        return (
                                          <td
                                            key={
                                              `${key}-${columnaIndex}`
                                            }
                                            style={{
                                              padding:
                                                "11px 10px",
                                              textAlign:
                                                "center",
                                            }}
                                          >
                                            <UltimosPartidos
                                              valor={
                                                valor
                                              }
                                            />
                                          </td>
                                        );
                                      }


                                      // =================================
                                      // VALOR NORMAL
                                      // =================================

                                      return (
                                        <td
                                          key={
                                            `${key}-${columnaIndex}`
                                          }
                                          style={{
                                            padding:
                                              "11px 10px",
                                            textAlign:
                                              "center",
                                            fontWeight:
                                              key ===
                                              "Points"
                                                ? 800
                                                : 500,
                                            color:
                                              key ===
                                              "Points"
                                                ? colores.verde
                                                : colores.texto,
                                            whiteSpace:
                                              "nowrap",
                                          }}
                                        >
                                          {valor}
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

                  </section>
                );
              }
            )}

          </div>

        )}


        {/* ==================================================
            SIN TABLAS
        ================================================== */}

        {tablas.length === 0 && (

          <div
            style={{
              background:
                colores.superficie,
              border:
                `1px solid ${colores.borde}`,
              borderRadius:
                10,
              padding:
                25,
              textAlign:
                "center",
              color:
                colores.muted,
            }}
          >
            No se encontraron tablas
            de posiciones para esta
            competencia.
          </div>

        )}


        {/* ==================================================
            ESTADÍSTICAS DE JUGADORES
        ================================================== */}

        {estadisticas.length > 0 && (

          <section
            style={{
              marginTop:
                35,
            }}
          >

            <h2
              style={{
                margin:
                  "0 0 18px",
                fontSize:
                  21,
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

              {estadisticas.map(
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
                        borderRadius:
                          10,
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
                            fontSize:
                              17,
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
                              550,
                          }}
                        >

                          <thead>

                            <tr
                              style={{
                                borderBottom:
                                  `1px solid ${colores.borde}`,
                                color:
                                  colores.muted,
                                fontSize:
                                  12,
                              }}
                            >

                              <th
                                style={{
                                  padding:
                                    "11px 10px",
                                  textAlign:
                                    "center",
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
                                  columna,
                                  index
                                ) => {

                                  const key =
                                    typeof columna ===
                                    "string"
                                      ? columna
                                      : columna.key;


                                  return (
                                    <th
                                      key={
                                        `${key}-${index}`
                                      }
                                      style={{
                                        padding:
                                          "11px 10px",
                                        textAlign:
                                          "center",
                                        whiteSpace:
                                          "nowrap",
                                      }}
                                    >
                                      {typeof columna ===
                                      "object"
                                        ? columna.title ||
                                          tituloColumna(
                                            key
                                          )
                                        : tituloColumna(
                                            key
                                          )}
                                    </th>
                                  );
                                }
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
                                        whiteSpace:
                                          "nowrap",
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
                                        whiteSpace:
                                          "nowrap",
                                      }}
                                    >
                                      {equipo}
                                    </td>


                                    {columnas.map(
                                      (
                                        columna,
                                        columnaIndex
                                      ) => {

                                        const key =
                                          typeof columna ===
                                          "string"
                                            ? columna
                                            : columna.key;


                                        return (
                                          <td
                                            key={
                                              `${key}-${columnaIndex}`
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


        {/* ==================================================
            PIE
        ================================================== */}

        <div
          style={{
            marginTop:
              35,
            paddingTop:
              15,
            borderTop:
              `1px solid ${colores.borde}`,
            textAlign:
              "center",
            color:
              colores.muted,
            fontSize:
              12,
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
            padding:
              24,
          }}
        >

          <div
            style={{
              maxWidth:
                1200,
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
                borderRadius:
                  10,
                padding:
                  30,
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