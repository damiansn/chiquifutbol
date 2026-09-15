"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PosicionesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/standings", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron obtener los datos.");
      }

      const json = await response.json();
      console.log("==========================================");
console.log("DEBUG TABLAS DE POSICIONES");
console.log("==========================================");
console.log(
  JSON.stringify(json.tables_groups, null, 2)
);
console.log("==========================================");
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FUNCIONES DE DATOS
  // ============================================================

  function obtenerValor(objeto, claves = []) {
    for (const clave of claves) {
      if (
        objeto &&
        objeto[clave] !== undefined &&
        objeto[clave] !== null &&
        objeto[clave] !== ""
      ) {
        return objeto[clave];
      }
    }

    return "";
  }

  function normalizarFilas(tabla) {
    if (!tabla) return [];

    if (Array.isArray(tabla.rows)) {
      return tabla.rows;
    }

    if (Array.isArray(tabla.table?.rows)) {
      return tabla.table.rows;
    }

    if (Array.isArray(tabla.data?.rows)) {
      return tabla.data.rows;
    }

    if (Array.isArray(tabla.data)) {
      return tabla.data;
    }

    return [];
  }

  function obtenerTablas() {
  if (!data) return [];

  const resultado = [];

  // ============================================================
  // 1. TABLAS DIRECTAS
  // ============================================================

  if (Array.isArray(data.tables)) {
    data.tables.forEach((tabla) => {
      if (tabla) {
        resultado.push(tabla);
      }
    });
  }

  // ============================================================
  // 2. TABLAS DENTRO DE tables_groups
  // ============================================================

  if (Array.isArray(data.tables_groups)) {
    data.tables_groups.forEach((grupo) => {
      if (!grupo) return;

      // El grupo puede tener las tablas directamente
      if (Array.isArray(grupo.tables)) {
        grupo.tables.forEach((tabla) => {
          if (tabla) {
            resultado.push(tabla);
          }
        });
      }

      // Algunos formatos pueden tener una sola tabla
      if (grupo.table) {
        resultado.push(grupo.table);
      }

      // O pueden estar dentro de data
      if (Array.isArray(grupo.data)) {
        grupo.data.forEach((tabla) => {
          if (tabla) {
            resultado.push(tabla);
          }
        });
      }
    });
  }

  // ============================================================
  // 3. EVITAR DUPLICADOS
  // ============================================================

  const vistas = new Set();

  return resultado.filter((tabla) => {
    const nombre =
      tabla?.name ||
      tabla?.title ||
      tabla?.label ||
      tabla?.table?.name ||
      tabla?.table?.title ||
      "";

    const filas = normalizarFilas(tabla);

    // Si no tiene filas, no es una tabla útil
    if (!filas.length) {
      return false;
    }

    // Creamos una firma para detectar duplicados
    const firma =
      String(nombre) +
      "|" +
      filas.length +
      "|" +
      JSON.stringify(
        filas[0]?.entity?.object?.name ||
        filas[0]?.team_name ||
        filas[0]?.name ||
        ""
      );

    if (vistas.has(firma)) {
      return false;
    }

    vistas.add(firma);

    return true;
  });
}

  function obtenerEstadisticasJugadores() {
    if (!data?.players_statistics) return [];

    if (Array.isArray(data.players_statistics)) {
      return data.players_statistics;
    }

    if (Array.isArray(data.players_statistics.tables)) {
      return data.players_statistics.tables;
    }

    return [];
  }

  function obtenerNombreJugador(fila) {
    return (
      fila?.entity?.object?.name ||
      fila?.entity?.object?.sname ||
      fila?.name ||
      "-"
    );
  }

  function obtenerEquipoJugador(fila) {
    return (
      fila?.team_name ||
      fila?.entity?.object?.team_name ||
      "-"
    );
  }

  function obtenerValoresEstadistica(fila) {
    if (Array.isArray(fila?.values)) {
      return fila.values;
    }

    if (Array.isArray(fila?.stats)) {
      return fila.stats;
    }

    return [];
  }

  function valorComoTexto(valor) {
    if (valor === null || valor === undefined) return "-";

    if (typeof valor === "object") {
      if (valor.value !== undefined) {
        return String(valor.value);
      }

      return JSON.stringify(valor);
    }

    return String(valor);
  }

  function obtenerColumnasEstadistica(tabla) {
    const filas = normalizarFilas(tabla);

    const columnas = [];

    filas.forEach((fila) => {
      const valores = obtenerValoresEstadistica(fila);

      valores.forEach((item) => {
        const key = item?.key;

        if (
          key &&
          !columnas.some((columna) => columna === key)
        ) {
          columnas.push(key);
        }
      });
    });

    return columnas;
  }

  function obtenerValorEstadistica(fila, columna) {
    const valores = obtenerValoresEstadistica(fila);

    const encontrado = valores.find(
      (item) => item?.key === columna
    );

    if (!encontrado) return "-";

    return valorComoTexto(encontrado.value);
  }

  function tituloColumna(columna) {
    const titulos = {
      Goals: "Goles",
      Assists: "Asistencias",
      Matches: "PJ",
      Games: "PJ",
      Minutes: "Min.",
      YellowCards: "Amarillas",
      RedCards: "Rojas",
      GoalsPerGame: "G/PJ",
      Average: "Promedio",
      Rating: "Puntaje",
    };

    return titulos[columna] || columna;
  }

  // ============================================================
  // ESTILOS
  // ============================================================

  const colores = {
    verde: "#10b981",
    verdeSuave: "rgba(16,185,129,0.15)",
    fondo: "rgba(128,128,128,0.02)",
    fondoHeader: "rgba(128,128,128,0.08)",
    fondoFila: "rgba(128,128,128,0.025)",
    borde: "rgba(128,128,128,0.25)",
    bordeSuave: "rgba(128,128,128,0.15)",
    texto: "inherit",
    textoSecundario: "rgba(180,180,180,0.75)",
  };

  const tablaTh = {
    padding: "10px 8px",
    border: `1px solid ${colores.borde}`,
    background: colores.fondoHeader,
    fontSize: "0.78rem",
    fontWeight: 700,
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const tablaTd = {
    padding: "9px 8px",
    border: `1px solid ${colores.bordeSuave}`,
    fontSize: "0.86rem",
    verticalAlign: "middle",
  };

  function clasePosicion(posicion) {
    if (posicion === 1) {
      return {
        background: "rgba(234,179,8,0.15)",
        color: "#facc15",
        border: "1px solid rgba(234,179,8,0.35)",
      };
    }

    if (posicion === 2) {
      return {
        background: "rgba(148,163,184,0.15)",
        color: "#cbd5e1",
        border: "1px solid rgba(148,163,184,0.35)",
      };
    }

    if (posicion === 3) {
      return {
        background: "rgba(249,115,22,0.15)",
        color: "#fb923c",
        border: "1px solid rgba(249,115,22,0.35)",
      };
    }

    return {
      background: "transparent",
      color: colores.textoSecundario,
      border: "1px solid transparent",
    };
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main
        style={{
          maxWidth: "950px",
          width: "100%",
          margin: "0 auto",
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            border: `1px solid ${colores.borde}`,
            borderRadius: "8px",
            padding: "30px",
            textAlign: "center",
            background: colores.fondo,
          }}
        >
          Cargando posiciones...
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <main
        style={{
          maxWidth: "950px",
          width: "100%",
          margin: "0 auto",
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "8px",
            padding: "20px",
            background: "rgba(239,68,68,0.08)",
            color: "#fca5a5",
          }}
        >
          <strong>Error:</strong> {error}

          <div style={{ marginTop: "15px" }}>
            <button
              onClick={cargarDatos}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: `1px solid ${colores.borde}`,
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const tablas = obtenerTablas();
  const estadisticas = obtenerEstadisticasJugadores();

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main
      style={{
        maxWidth: "950px",
        width: "100%",
        margin: "0 auto",
        padding: "20px",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          borderBottom: `1px solid ${colores.borde}`,
          paddingBottom: "16px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <img
              src="/logo.svg"
              alt="Chiquifutbol"
              style={{
                height: "58px",
                width: "auto",
                display: "block",
              }}
            />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Posiciones
              </h1>

              {data?.league?.name && (
                <div
                  style={{
                    marginTop: "3px",
                    fontSize: "0.82rem",
                    color: colores.textoSecundario,
                  }}
                >
                  {data.league.name}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "7px 14px",
                borderRadius: "6px",
                border: `1px solid ${colores.borde}`,
                color: "inherit",
                textDecoration: "none",
                background: "transparent",
                fontSize: "0.85rem",
              }}
            >
              ← Partidos
            </Link>

            <button
              onClick={cargarDatos}
              style={{
                padding: "7px 14px",
                borderRadius: "6px",
                border: `1px solid ${colores.borde}`,
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          TABLAS DE POSICIONES
      ====================================================== */}

      {tablas.length > 0 && (
        <section style={{ marginBottom: "28px" }}>
          <div
            style={{
              marginBottom: "12px",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: colores.verde,
            }}
          >
            Tablas de posiciones
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {tablas.map((tabla, indiceTabla) => {
              const filas = normalizarFilas(tabla);

              if (!filas.length) return null;

              const nombreTabla =
                tabla?.name ||
                tabla?.title ||
                tabla?.label ||
                tabla?.table?.name ||
                tabla?.table?.title ||
                `Tabla ${indiceTabla + 1}`;

              return (
                <div
                  key={indiceTabla}
                  style={{
                    border: `1px solid ${colores.borde}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: colores.fondo,
                  }}
                >
                  {/* CABECERA DE TABLA */}

                  <div
                    style={{
                      padding: "11px 14px",
                      background: colores.verdeSuave,
                      borderBottom: `1px solid ${colores.borde}`,
                      color: colores.verde,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    {nombreTabla}
                  </div>

                  {/* TABLA */}

                  <div
                    style={{
                      width: "100%",
                      overflowX: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        minWidth: "720px",
                        borderCollapse: "collapse",
                        borderSpacing: 0,
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              ...tablaTh,
                              width: "55px",
                            }}
                          >
                            #
                          </th>

                          <th
                            style={{
                              ...tablaTh,
                              textAlign: "left",
                              minWidth: "210px",
                            }}
                          >
                            Equipo
                          </th>

                          <th style={tablaTh}>PJ</th>
                          <th style={tablaTh}>PG</th>
                          <th style={tablaTh}>PE</th>
                          <th style={tablaTh}>PP</th>
                          <th style={tablaTh}>GF</th>
                          <th style={tablaTh}>GC</th>
                          <th style={tablaTh}>DG</th>

                          <th
                            style={{
                              ...tablaTh,
                              width: "70px",
                            }}
                          >
                            Pts
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filas.map((fila, indiceFila) => {
                          const posicion =
                            Number(
                              obtenerValor(fila, [
                                "pos",
                                "position",
                                "rank",
                                "num",
                              ])
                            ) || indiceFila + 1;

                          const equipo =
                            obtenerValor(fila, [
                              "team_name",
                              "team",
                              "name",
                            ]) ||
                            fila?.entity?.object?.name ||
                            "-";

                          const pj = obtenerValor(fila, [
                            "PJ",
                            "pj",
                            "played",
                            "matches",
                            "games",
                          ]);

                          const pg = obtenerValor(fila, [
                            "PG",
                            "pg",
                            "won",
                            "wins",
                          ]);

                          const pe = obtenerValor(fila, [
                            "PE",
                            "pe",
                            "draw",
                            "draws",
                          ]);

                          const pp = obtenerValor(fila, [
                            "PP",
                            "pp",
                            "lost",
                            "losses",
                          ]);

                          const gf = obtenerValor(fila, [
                            "GF",
                            "gf",
                            "goals_for",
                            "goalsFor",
                          ]);

                          const gc = obtenerValor(fila, [
                            "GC",
                            "gc",
                            "goals_against",
                            "goalsAgainst",
                          ]);

                          const dg = obtenerValor(fila, [
                            "DG",
                            "dg",
                            "difference",
                            "goal_difference",
                            "goalDifference",
                          ]);

                          const pts = obtenerValor(fila, [
                            "Pts",
                            "pts",
                            "points",
                            "score",
                          ]);

                          return (
                            <tr
                              key={indiceFila}
                              style={{
                                background:
                                  indiceFila % 2 === 0
                                    ? "transparent"
                                    : colores.fondoFila,
                              }}
                            >
                              {/* POSICION */}

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                <span
                                  style={{
                                    ...clasePosicion(posicion),
                                    width: "30px",
                                    height: "30px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {posicion}
                                </span>
                              </td>

                              {/* EQUIPO */}

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "left",
                                  fontWeight: 600,
                                }}
                              >
                                {equipo}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {pj || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {pg || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {pe || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {pp || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {gf || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                {gc || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color:
                                    Number(dg) > 0
                                      ? "#10b981"
                                      : Number(dg) < 0
                                      ? "#ef4444"
                                      : "inherit",
                                }}
                              >
                                {dg || "-"}
                              </td>

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                  fontWeight: 800,
                                  fontSize: "0.95rem",
                                  color: colores.verde,
                                }}
                              >
                                {pts || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================
          ESTADISTICAS DE JUGADORES
      ====================================================== */}

      {estadisticas.length > 0 && (
        <section style={{ marginBottom: "28px" }}>
          <div
            style={{
              marginBottom: "12px",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: colores.verde,
            }}
          >
            Estadísticas de jugadores
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {estadisticas.map((tabla, indiceTabla) => {
              const filas = normalizarFilas(tabla);

              if (!filas.length) return null;

              const columnas = obtenerColumnasEstadistica(tabla);

              const nombreTabla =
                tabla?.name ||
                tabla?.title ||
                tabla?.label ||
                tabla?.table?.name ||
                tabla?.table?.title ||
                "Estadísticas";

              return (
                <div
                  key={indiceTabla}
                  style={{
                    border: `1px solid ${colores.borde}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: colores.fondo,
                  }}
                >
                  {/* TITULO */}

                  <div
                    style={{
                      padding: "11px 14px",
                      background: colores.verdeSuave,
                      borderBottom: `1px solid ${colores.borde}`,
                      color: colores.verde,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    {nombreTabla}
                  </div>

                  {/* TABLA DE ESTADISTICAS */}

                  <div
                    style={{
                      width: "100%",
                      overflowX: "auto",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        minWidth: "720px",
                        borderCollapse: "collapse",
                        borderSpacing: 0,
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              ...tablaTh,
                              width: "55px",
                            }}
                          >
                            #
                          </th>

                          <th
                            style={{
                              ...tablaTh,
                              textAlign: "left",
                              minWidth: "190px",
                            }}
                          >
                            Jugador
                          </th>

                          <th
                            style={{
                              ...tablaTh,
                              textAlign: "left",
                              minWidth: "160px",
                            }}
                          >
                            Equipo
                          </th>

                          {columnas.map((columna) => (
                            <th
                              key={columna}
                              style={tablaTh}
                            >
                              {tituloColumna(columna)}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {filas.map((fila, indiceFila) => {
                          const posicion =
                            Number(fila?.num) ||
                            indiceFila + 1;

                          const nombre =
                            obtenerNombreJugador(fila);

                          const equipo =
                            obtenerEquipoJugador(fila);

                          return (
                            <tr
                              key={indiceFila}
                              style={{
                                background:
                                  indiceFila % 2 === 0
                                    ? "transparent"
                                    : colores.fondoFila,
                              }}
                            >
                              {/* POSICION */}

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "center",
                                }}
                              >
                                <span
                                  style={{
                                    ...clasePosicion(posicion),
                                    width: "30px",
                                    height: "30px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {posicion}
                                </span>
                              </td>

                              {/* JUGADOR */}

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "left",
                                  fontWeight: 600,
                                }}
                              >
                                {nombre}
                              </td>

                              {/* EQUIPO */}

                              <td
                                style={{
                                  ...tablaTd,
                                  textAlign: "left",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: "5px",
                                    background:
                                      "rgba(16,185,129,0.08)",
                                    border:
                                      "1px solid rgba(16,185,129,0.18)",
                                    fontSize: "0.78rem",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {equipo}
                                </span>
                              </td>

                              {/* ESTADISTICAS */}

                              {columnas.map((columna) => {
                                const valor =
                                  obtenerValorEstadistica(
                                    fila,
                                    columna
                                  );

                                return (
                                  <td
                                    key={columna}
                                    style={{
                                      ...tablaTd,
                                      textAlign: "center",
                                      fontWeight:
                                        columna === "Goals"
                                          ? 700
                                          : 500,
                                      color:
                                        columna === "Goals"
                                          ? colores.verde
                                          : "inherit",
                                    }}
                                  >
                                    {valor}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================
          SIN DATOS
      ====================================================== */}

      {tablas.length === 0 &&
        estadisticas.length === 0 && (
          <div
            style={{
              border: `1px solid ${colores.borde}`,
              borderRadius: "8px",
              padding: "25px",
              textAlign: "center",
              background: colores.fondo,
              color: colores.textoSecundario,
            }}
          >
            No hay datos de posiciones disponibles.
          </div>
        )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        style={{
          marginTop: "30px",
          paddingTop: "15px",
          borderTop: `1px solid ${colores.bordeSuave}`,
          textAlign: "center",
          fontSize: "0.75rem",
          color: colores.textoSecundario,
        }}
      >
        Chiquifutbol
      </footer>
    </main>
  );
}