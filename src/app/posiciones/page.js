"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PosicionesPage() {
  const searchParams = useSearchParams();

  const competition =
    searchParams.get("competition") || "argentina";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  useEffect(() => {
    cargarDatos();
  }, [competition]);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/standings?competition=${encodeURIComponent(
          competition
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudieron obtener los datos."
        );
      }

      const json = await response.json();

      console.log("================================");
console.log("COMPETENCIA URL:", competition);
console.log("COMPETENCIA API:", json?.competition);
console.log("LIGA API:", json?.league?.name);
console.log("TABLAS:", json?.tables);
console.log("================================");

      setData(json);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Error al cargar los datos."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // COLORES
  // ============================================================

  const colores = {
    verde: "#10b981",
    verdeSuave: "rgba(16,185,129,0.15)",
    fondo: "rgba(128,128,128,0.02)",
    fondoHeader: "rgba(128,128,128,0.08)",
    fondoFila: "rgba(128,128,128,0.025)",
    borde: "rgba(128,128,128,0.25)",
    bordeSuave: "rgba(128,128,128,0.15)",
    textoSecundario:
      "rgba(180,180,180,0.75)",
  };

  // ============================================================
  // OBTENER TABLAS DE POSICIONES
  // ============================================================

function obtenerTablasPosiciones() {
  if (!Array.isArray(data?.tables_groups)) return [];

  const resultado = [];

  data.tables_groups.forEach((grupo) => {
    if (!Array.isArray(grupo?.tables)) return;

    grupo.tables.forEach((tabla) => {
      if (!tabla?.table) return;
      if (!Array.isArray(tabla.table.rows)) return;

      resultado.push({
        torneo: grupo.name || "",
        nombre: tabla.name || "Tabla",
        table: tabla.table,
      });
    });
  });

  return resultado;
}

  // ============================================================
  // OBTENER VALOR DE UNA COLUMNA
  // ============================================================

  function obtenerValorFila(fila, key) {
    if (!Array.isArray(fila?.values)) {
      return "-";
    }

    const encontrado = fila.values.find(
      (item) => item?.key === key
    );

    if (!encontrado) {
      return "-";
    }

    return encontrado.value;
  }

  // ============================================================
  // ESTADISTICAS DE JUGADORES
  // ============================================================

  function obtenerEstadisticasJugadores() {
    if (!data?.players_statistics) {
      return [];
    }

    if (
      Array.isArray(
        data.players_statistics.tables
      )
    ) {
      return data.players_statistics.tables;
    }

    if (
      Array.isArray(data.players_statistics)
    ) {
      return data.players_statistics;
    }

    return [];
  }

  function obtenerFilasEstadisticas(tabla) {
    if (Array.isArray(tabla?.rows)) {
      return tabla.rows;
    }

    if (
      Array.isArray(tabla?.table?.rows)
    ) {
      return tabla.table.rows;
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
      fila?.team?.name ||
      fila?.entity?.object?.team_name ||
      fila?.entity?.object?.team?.name ||
      fila?.entity?.object?.team?.short_name ||
      fila?.entity?.object?.club?.name ||
      fila?.entity?.object?.club?.short_name ||
      "-"
    );
  }

  function obtenerValoresEstadistica(fila) {
    if (Array.isArray(fila?.values)) {
      return fila.values;
    }

    return [];
  }

  function obtenerColumnasEstadistica(tabla) {
    const filas =
      obtenerFilasEstadisticas(tabla);

    const columnas = [];

    filas.forEach((fila) => {
      const valores =
        obtenerValoresEstadistica(fila);

      valores.forEach((item) => {
        if (
          item?.key &&
          !columnas.includes(item.key)
        ) {
          columnas.push(item.key);
        }
      });
    });

    return columnas;
  }

  function obtenerValorEstadistica(
    fila,
    columna
  ) {
    const valores =
      obtenerValoresEstadistica(fila);

    const encontrado = valores.find(
      (item) => item?.key === columna
    );

    if (!encontrado) {
      return "-";
    }

    if (
      Array.isArray(encontrado.value)
    ) {
      return encontrado.value.join(" ");
    }

    return encontrado.value;
  }

  function tituloColumna(columna) {
    const titulos = {
      Goals: "Goles",
      Assists: "Asist.",
      Matches: "PJ",
      Games: "PJ",
      Minutes: "Min.",
      YellowCards: "Amarillas",
      RedCards: "Rojas",
      Rating: "Puntaje",
    };

    return (
      titulos[columna] || columna
    );
  }

  // ============================================================
  // POSICION
  // ============================================================

  function estiloPosicion(posicion) {
    if (posicion === 1) {
      return {
        background:
          "rgba(234,179,8,0.15)",
        color: "#facc15",
        border:
          "1px solid rgba(234,179,8,0.35)",
      };
    }

    if (posicion === 2) {
      return {
        background:
          "rgba(148,163,184,0.15)",
        color: "#cbd5e1",
        border:
          "1px solid rgba(148,163,184,0.35)",
      };
    }

    if (posicion === 3) {
      return {
        background:
          "rgba(249,115,22,0.15)",
        color: "#fb923c",
        border:
          "1px solid rgba(249,115,22,0.35)",
      };
    }

    return {
      background: "transparent",
      color: colores.textoSecundario,
      border:
        "1px solid transparent",
    };
  }

  function Posicion({ numero }) {
    return (
      <span
        style={{
          ...estiloPosicion(numero),
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
        {numero}
      </span>
    );
  }

  // ============================================================
  // ULTIMOS PARTIDOS
  // ============================================================

  function UltimosPartidos({
    valores,
  }) {
    if (!Array.isArray(valores)) {
      return (
        <span
          style={{
            color:
              colores.textoSecundario,
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
          justifyContent:
            "center",
          gap: "3px",
        }}
      >
        {valores.map(
          (resultado, index) => {
            let background =
              "rgba(128,128,128,0.15)";
            let color =
              colores.textoSecundario;

            if (resultado === 1) {
              background =
                "rgba(16,185,129,0.18)";
              color = "#10b981";
            }

            if (resultado === 2) {
              background =
                "rgba(239,68,68,0.18)";
              color = "#ef4444";
            }

            if (resultado === 0) {
              background =
                "rgba(148,163,184,0.15)";
              color = "#94a3b8";
            }

            return (
              <span
                key={index}
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius:
                    "50%",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background,
                  color,
                  fontSize:
                    "0.65rem",
                  fontWeight: 700,
                }}
              >
                {resultado === 1
                  ? "G"
                  : resultado === 2
                  ? "P"
                  : resultado === 0
                  ? "E"
                  : "-"}
              </span>
            );
          }
        )}
      </div>
    );
  }

  // ============================================================
  // BRACKETS
  // ============================================================

  function obtenerBrackets() {
    if (
      !data?.brackets ||
      !Array.isArray(
        data.brackets.stages
      )
    ) {
      return [];
    }

    return data.brackets.stages;
  }

  function obtenerNombreParticipante(
    participante
  ) {
    if (!participante) {
      return "-";
    }

    return (
      participante.name ||
      participante.short_name ||
      participante.object?.name ||
      participante.team?.name ||
      "-"
    );
  }

  function obtenerParticipantesGrupo(
    grupo
  ) {
    if (
      !Array.isArray(
        grupo?.participants
      )
    ) {
      return [];
    }

    return grupo.participants;
  }

  function obtenerPartidosGrupo(grupo) {
    if (
      !Array.isArray(grupo?.games)
    ) {
      return [];
    }

    return grupo.games;
  }

  function obtenerEquipoPartido(
    equipo
  ) {
    if (!equipo) {
      return "-";
    }

    return (
      equipo.name ||
      equipo.short_name ||
      equipo.object?.name ||
      equipo.team?.name ||
      "-"
    );
  }

  function obtenerMarcador(
    equipo
  ) {
    if (!equipo) {
      return null;
    }

    return (
      equipo.score ??
      equipo.goals ??
      equipo.result ??
      null
    );
  }

  function obtenerEstadoPartido(
    partido
  ) {
    return (
      partido?.status?.name ||
      partido?.status ||
      ""
    );
  }

  function obtenerEquiposPartido(
    partido
  ) {
    const local =
      partido?.home_team ||
      partido?.home ||
      partido?.teams?.home ||
      partido?.teams?.[0] ||
      null;

    const visitante =
      partido?.away_team ||
      partido?.away ||
      partido?.teams?.away ||
      partido?.teams?.[1] ||
      null;

    return {
      local,
      visitante,
    };
  }

  // ============================================================
  // COMPONENTE BRACKET
  // ============================================================

  function BracketStage({
    stage,
  }) {
    const groups =
      Array.isArray(
        stage?.groups
      )
        ? stage.groups
        : [];

    if (!groups.length) {
      return null;
    }

    return (
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            marginBottom: "10px",
            padding: "10px 14px",
            background:
              colores.verdeSuave,
            border:
              `1px solid ${colores.borde}`,
            borderRadius: "7px",
            color: colores.verde,
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          {stage.name ||
            "Etapa"}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {groups.map(
            (grupo, indiceGrupo) => {
              const participantes =
                obtenerParticipantesGrupo(
                  grupo
                );

              const partidos =
                obtenerPartidosGrupo(
                  grupo
                );

              return (
                <div
                  key={
                    indiceGrupo
                  }
                  style={{
                    border:
                      `1px solid ${colores.borde}`,
                    borderRadius:
                      "8px",
                    overflow:
                      "hidden",
                    background:
                      colores.fondo,
                  }}
                >
                  <div
                    style={{
                      padding:
                        "10px 14px",
                      background:
                        colores.fondoHeader,
                      borderBottom:
                        `1px solid ${colores.bordeSuave}`,
                      fontWeight: 700,
                      fontSize:
                        "0.9rem",
                    }}
                  >
                    {grupo.name ||
                      `Serie ${
                        indiceGrupo +
                        1
                      }`}
                  </div>

                  {participantes.length >
                    0 && (
                    <div
                      style={{
                        padding:
                          "10px 14px",
                        borderBottom:
                          partidos.length
                            ? `1px solid ${colores.bordeSuave}`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "0.72rem",
                          color:
                            colores.textoSecundario,
                          marginBottom:
                            "7px",
                        }}
                      >
                        Participantes
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: "6px",
                        }}
                      >
                        {participantes.map(
                          (
                            participante,
                            indice
                          ) => (
                            <span
                              key={
                                indice
                              }
                              style={{
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  "5px",
                                background:
                                  "rgba(128,128,128,0.08)",
                                border:
                                  `1px solid ${colores.bordeSuave}`,
                                fontSize:
                                  "0.8rem",
                              }}
                            >
                              {obtenerNombreParticipante(
                                participante
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {partidos.length >
                    0 && (
                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                      }}
                    >
                      {partidos.map(
                        (
                          partido,
                          indicePartido
                        ) => {
                          const {
                            local,
                            visitante,
                          } =
                            obtenerEquiposPartido(
                              partido
                            );

                          const marcadorLocal =
                            obtenerMarcador(
                              local
                            );

                          const marcadorVisitante =
                            obtenerMarcador(
                              visitante
                            );

                          return (
                            <div
                              key={
                                indicePartido
                              }
                              style={{
                                padding:
                                  "12px 14px",
                                borderBottom:
                                  indicePartido <
                                  partidos.length -
                                    1
                                    ? `1px solid ${colores.bordeSuave}`
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "12px",
                                }}
                              >
                                <div
                                  style={{
                                    flex:
                                      1,
                                    textAlign:
                                      "right",
                                    fontWeight:
                                      600,
                                    fontSize:
                                      "0.84rem",
                                  }}
                                >
                                  {obtenerEquipoPartido(
                                    local
                                  )}
                                </div>

                                <div
                                  style={{
                                    minWidth:
                                      "60px",
                                    textAlign:
                                      "center",
                                    fontWeight:
                                      800,
                                    fontSize:
                                      "0.95rem",
                                  }}
                                >
                                  {marcadorLocal !==
                                    null &&
                                  marcadorVisitante !==
                                    null
                                    ? `${marcadorLocal} - ${marcadorVisitante}`
                                    : "vs"}
                                </div>

                                <div
                                  style={{
                                    flex:
                                      1,
                                    textAlign:
                                      "left",
                                    fontWeight:
                                      600,
                                    fontSize:
                                      "0.84rem",
                                  }}
                                >
                                  {obtenerEquipoPartido(
                                    visitante
                                  )}
                                </div>
                              </div>

                              {obtenerEstadoPartido(
                                partido
                              ) && (
                                <div
                                  style={{
                                    marginTop:
                                      "5px",
                                    textAlign:
                                      "center",
                                    fontSize:
                                      "0.7rem",
                                    color:
                                      colores.textoSecundario,
                                  }}
                                >
                                  {obtenerEstadoPartido(
                                    partido
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {!participantes.length &&
                    !partidos.length && (
                      <div
                        style={{
                          padding:
                            "15px",
                          color:
                            colores.textoSecundario,
                          fontSize:
                            "0.8rem",
                          textAlign:
                            "center",
                        }}
                      >
                        Sin información
                      </div>
                    )}
                </div>
              );
            }
          )}
        </div>
      </div>
    );
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
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            border:
              `1px solid ${colores.borde}`,
            borderRadius: "8px",
            padding: "30px",
            textAlign:
              "center",
            background:
              colores.fondo,
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
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            border:
              "1px solid rgba(239,68,68,0.4)",
            borderRadius: "8px",
            padding: "20px",
            background:
              "rgba(239,68,68,0.08)",
            color: "#fca5a5",
          }}
        >
          <strong>
            Error:
          </strong>{" "}
          {error}

          <div
            style={{
              marginTop: "15px",
            }}
          >
            <button
              onClick={
                cargarDatos
              }
              style={{
                padding:
                  "7px 14px",
                borderRadius:
                  "6px",
                border:
                  `1px solid ${colores.borde}`,
                background:
                  "transparent",
                color:
                  "inherit",
                cursor:
                  "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const tablas =
    obtenerTablasPosiciones();

  const estadisticas =
    obtenerEstadisticasJugadores();

  const brackets =
    obtenerBrackets();

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
          borderBottom:
            `1px solid ${colores.borde}`,
          paddingBottom:
            "16px",
          marginBottom:
            "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: "15px",
            flexWrap:
              "wrap",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "14px",
            }}
          >
            <img
              src="/logo.svg"
              alt="Chiquifutbol"
              style={{
                height:
                  "58px",
                width:
                  "auto",
                display:
                  "block",
              }}
            />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "1.5rem",
                  fontWeight:
                    700,
                  letterSpacing:
                    "1px",
                  textTransform:
                    "uppercase",
                }}
              >
                Posiciones
              </h1>

              {data?.league
                ?.name && (
                <div
                  style={{
                    marginTop:
                      "3px",
                    fontSize:
                      "0.82rem",
                    color:
                      colores.textoSecundario,
                  }}
                >
                  {
                    data
                      .league
                      .name
                  }
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              gap: "8px",
            }}
          >
            <Link
              href="/"
              style={{
                display:
                  "inline-block",
                padding:
                  "7px 14px",
                borderRadius:
                  "6px",
                border:
                  `1px solid ${colores.borde}`,
                color:
                  "inherit",
                textDecoration:
                  "none",
                background:
                  "transparent",
                fontSize:
                  "0.85rem",
              }}
            >
              ← Partidos
            </Link>

            <button
              onClick={
                cargarDatos
              }
              style={{
                padding:
                  "7px 14px",
                borderRadius:
                  "6px",
                border:
                  `1px solid ${colores.borde}`,
                background:
                  "transparent",
                color:
                  "inherit",
                cursor:
                  "pointer",
                fontSize:
                  "0.85rem",
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

      {tablas.length >
        0 && (
        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <div
            style={{
              marginBottom:
                "12px",
              fontSize:
                "1.1rem",
              fontWeight:
                700,
              color:
                colores.verde,
            }}
          >
            Tablas de posiciones
          </div>

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: "18px",
            }}
          >
            {tablas.map(
              (
                tabla,
                indiceTabla
              ) => {
                const columnas =
                  Array.isArray(
                    tabla
                      .table
                      ?.columns
                  )
                    ? tabla
                        .table
                        .columns
                    : [];

                const filas =
                  Array.isArray(
                    tabla
                      .table
                      ?.rows
                  )
                    ? tabla
                        .table
                        .rows
                    : [];

                return (
                  <div
                    key={
                      indiceTabla
                    }
                    style={{
                      border:
                        `1px solid ${colores.borde}`,
                      borderRadius:
                        "8px",
                      overflow:
                        "hidden",
                      background:
                        colores.fondo,
                    }}
                  >
                    <div
                      style={{
                        padding:
                          "11px 14px",
                        background:
                          colores.verdeSuave,
                        borderBottom:
                          `1px solid ${colores.borde}`,
                        color:
                          colores.verde,
                        fontWeight:
                          700,
                        fontSize:
                          "0.95rem",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          "10px",
                      }}
                    >
                      <span>
                        {tabla.torneo
                          ? `${tabla.torneo} — `
                          : ""}
                        {
                          tabla.nombre
                        }
                      </span>

                      <span
                        style={{
                          fontSize:
                            "0.72rem",
                          color:
                            colores.textoSecundario,
                          fontWeight:
                            500,
                        }}
                      >
                        {
                          filas.length
                        }{" "}
                        equipos
                      </span>
                    </div>

                    <div
                      style={{
                        width:
                          "100%",
                        overflowX:
                          "auto",
                      }}
                    >
                      <table
                        style={{
                          width:
                            "100%",
                          minWidth:
                            "720px",
                          borderCollapse:
                            "collapse",
                          borderSpacing:
                            0,
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding:
                                  "10px 8px",
                                border:
                                  `1px solid ${colores.borde}`,
                                background:
                                  colores.fondoHeader,
                                width:
                                  "55px",
                                textAlign:
                                  "center",
                                fontSize:
                                  "0.78rem",
                              }}
                            >
                              #
                            </th>

                            <th
                              style={{
                                padding:
                                  "10px 8px",
                                border:
                                  `1px solid ${colores.borde}`,
                                background:
                                  colores.fondoHeader,
                                textAlign:
                                  "left",
                                minWidth:
                                  "210px",
                                fontSize:
                                  "0.78rem",
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
                                    columna.key
                                  }
                                  style={{
                                    padding:
                                      "10px 8px",
                                    border:
                                      `1px solid ${colores.borde}`,
                                    background:
                                      colores.fondoHeader,
                                    textAlign:
                                      "center",
                                    whiteSpace:
                                      "nowrap",
                                    fontSize:
                                      "0.78rem",
                                    fontWeight:
                                      columna.is_bold
                                        ? 800
                                        : 600,
                                  }}
                                >
                                  {
                                    columna.title
                                  ||
                                    columna.key
                                  }
                                </th>
                              )
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {filas.map(
                            (
                              fila,
                              indiceFila
                            ) => {
                              const posicion =
                                Number(
                                  fila.num
                                ) ||
                                indiceFila +
                                  1;

                              const nombre =
                                fila
                                  ?.entity
                                  ?.object
                                  ?.name ||
                                "-";

                              return (
                                <tr
                                  key={
                                    indiceFila
                                  }
                                  style={{
                                    background:
                                      indiceFila %
                                        2 ===
                                      0
                                        ? "transparent"
                                        : colores.fondoFila,
                                  }}
                                >
                                  <td
                                    style={{
                                      padding:
                                        "8px",
                                      border:
                                        `1px solid ${colores.bordeSuave}`,
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    <Posicion
                                      numero={
                                        posicion
                                      }
                                    />
                                  </td>

                                  <td
                                    style={{
                                      padding:
                                        "9px 8px",
                                      border:
                                        `1px solid ${colores.bordeSuave}`,
                                      textAlign:
                                        "left",
                                      fontWeight:
                                        600,
                                      whiteSpace:
                                        "nowrap",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap:
                                          "8px",
                                      }}
                                    >
                                      {fila.destination_color && (
                                        <span
                                          style={{
                                            width:
                                              "4px",
                                            height:
                                              "25px",
                                            borderRadius:
                                              "3px",
                                            background:
                                              fila.destination_color,
                                            display:
                                              "inline-block",
                                            flexShrink:
                                              0,
                                          }}
                                        />
                                      )}

                                      <span>
                                        {
                                          nombre
                                        }
                                      </span>
                                    </div>
                                  </td>

                                  {columnas.map(
                                    (
                                      columna
                                    ) => {
                                      const valor =
                                        obtenerValorFila(
                                          fila,
                                          columna.key
                                        );

                                      if (
                                        columna.key ===
                                        "{trend}"
                                      ) {
                                        return (
                                          <td
                                            key={
                                              columna.key
                                            }
                                            style={{
                                              padding:
                                                "8px",
                                              border:
                                                `1px solid ${colores.bordeSuave}`,
                                              textAlign:
                                                "center",
                                            }}
                                          >
                                            <UltimosPartidos
                                              valores={
                                                valor
                                              }
                                            />
                                          </td>
                                        );
                                      }

                                      const esPuntos =
                                        columna.key ===
                                        "Points";

                                      const esRatio =
                                        columna.key ===
                                        "Ratio";

                                      return (
                                        <td
                                          key={
                                            columna.key
                                          }
                                          style={{
                                            padding:
                                              "9px 8px",
                                            border:
                                              `1px solid ${colores.bordeSuave}`,
                                            textAlign:
                                              "center",
                                            fontWeight:
                                              columna.is_bold ||
                                              esPuntos
                                                ? 800
                                                : 500,
                                            color:
                                              esPuntos
                                                ? colores.verde
                                                : esRatio
                                                ? Number(
                                                    valor
                                                  ) >
                                                  0
                                                  ? "#10b981"
                                                  : Number(
                                                      valor
                                                    ) <
                                                    0
                                                  ? "#ef4444"
                                                  : "inherit"
                                                : "inherit",
                                          }}
                                        >
                                          {
                                            valor
                                          }
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

      {/* ======================================================
          ELIMINATORIAS / BRACKETS
      ====================================================== */}

      {brackets.length >
        0 && (
        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <div
            style={{
              marginBottom:
                "12px",
              fontSize:
                "1.1rem",
              fontWeight:
                700,
              color:
                colores.verde,
            }}
          >
            Eliminatorias
          </div>

          <div
            style={{
              border:
                `1px solid ${colores.borde}`,
              borderRadius:
                "8px",
              padding:
                "14px",
              background:
                colores.fondo,
            }}
          >
            {brackets.map(
              (
                stage,
                indice
              ) => (
                <BracketStage
                  key={
                    indice
                  }
                  stage={
                    stage
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* ======================================================
          ESTADISTICAS DE JUGADORES
      ====================================================== */}

      {estadisticas.length >
        0 && (
        <section
          style={{
            marginBottom:
              "30px",
          }}
        >
          <div
            style={{
              marginBottom:
                "12px",
              fontSize:
                "1.1rem",
              fontWeight:
                700,
              color:
                colores.verde,
            }}
          >
            Estadísticas de jugadores
          </div>

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "18px",
            }}
          >
            {estadisticas.map(
              (
                tabla,
                indiceTabla
              ) => {
                const filas =
                  obtenerFilasEstadisticas(
                    tabla
                  );

                if (
                  !filas.length
                ) {
                  return null;
                }

                const columnas =
                  obtenerColumnasEstadistica(
                    tabla
                  );

                const nombreTabla =
                  tabla?.name ||
                  tabla?.title ||
                  tabla?.label ||
                  tabla
                    ?.table
                    ?.name ||
                  "Estadísticas";

                return (
                  <div
                    key={
                      indiceTabla
                    }
                    style={{
                      border:
                        `1px solid ${colores.borde}`,
                      borderRadius:
                        "8px",
                      overflow:
                        "hidden",
                      background:
                        colores.fondo,
                    }}
                  >
                    <div
                      style={{
                        padding:
                          "11px 14px",
                        background:
                          colores.verdeSuave,
                        borderBottom:
                          `1px solid ${colores.borde}`,
                        color:
                          colores.verde,
                        fontWeight:
                          700,
                        fontSize:
                          "0.95rem",
                      }}
                    >
                      {
                        nombreTabla
                      }
                    </div>

                    <div
                      style={{
                        width:
                          "100%",
                        overflowX:
                          "auto",
                      }}
                    >
                      <table
                        style={{
                          width:
                            "100%",
                          minWidth:
                            "720px",
                          borderCollapse:
                            "collapse",
                          borderSpacing:
                            0,
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding:
                                  "10px 8px",
                                border:
                                  `1px solid ${colores.borde}`,
                                background:
                                  colores.fondoHeader,
                                width:
                                  "55px",
                                textAlign:
                                  "center",
                                fontSize:
                                  "0.78rem",
                              }}
                            >
                              #
                            </th>

                            <th
                              style={{
                                padding:
                                  "10px 8px",
                                border:
                                  `1px solid ${colores.borde}`,
                                background:
                                  colores.fondoHeader,
                                textAlign:
                                  "left",
                                minWidth:
                                  "190px",
                                fontSize:
                                  "0.78rem",
                              }}
                            >
                              Jugador
                            </th>

                            <th
                              style={{
                                padding:
                                  "10px 8px",
                                border:
                                  `1px solid ${colores.borde}`,
                                background:
                                  colores.fondoHeader,
                                textAlign:
                                  "left",
                                minWidth:
                                  "160px",
                                fontSize:
                                  "0.78rem",
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
                                      "10px 8px",
                                    border:
                                      `1px solid ${colores.borde}`,
                                    background:
                                      colores.fondoHeader,
                                    textAlign:
                                      "center",
                                    fontSize:
                                      "0.78rem",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {tituloColumna(
                                    columna
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
                              indiceFila
                            ) => {
                              const posicion =
                                Number(
                                  fila?.num
                                ) ||
                                indiceFila +
                                  1;

                              return (
                                <tr
                                  key={
                                    indiceFila
                                  }
                                  style={{
                                    background:
                                      indiceFila %
                                        2 ===
                                      0
                                        ? "transparent"
                                        : colores.fondoFila,
                                  }}
                                >
                                  <td
                                    style={{
                                      padding:
                                        "8px",
                                      border:
                                        `1px solid ${colores.bordeSuave}`,
                                      textAlign:
                                        "center",
                                    }}
                                  >
                                    <Posicion
                                      numero={
                                        posicion
                                      }
                                    />
                                  </td>

                                  <td
                                    style={{
                                      padding:
                                        "9px 8px",
                                      border:
                                        `1px solid ${colores.bordeSuave}`,
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    {obtenerNombreJugador(
                                      fila
                                    )}
                                  </td>

                                  <td
                                    style={{
                                      padding:
                                        "9px 8px",
                                      border:
                                        `1px solid ${colores.bordeSuave}`,
                                    }}
                                  >
                                    <span
                                      style={{
                                        display:
                                          "inline-block",
                                        padding:
                                          "4px 8px",
                                        borderRadius:
                                          "5px",
                                        background:
                                          "rgba(16,185,129,0.08)",
                                        border:
                                          "1px solid rgba(16,185,129,0.18)",
                                        fontSize:
                                          "0.78rem",
                                        whiteSpace:
                                          "nowrap",
                                      }}
                                    >
                                      {obtenerEquipoJugador(
                                        fila
                                      )}
                                    </span>
                                  </td>

                                  {columnas.map(
                                    (
                                      columna
                                    ) => (
                                      <td
                                        key={
                                          columna
                                        }
                                        style={{
                                          padding:
                                            "9px 8px",
                                          border:
                                            `1px solid ${colores.bordeSuave}`,
                                          textAlign:
                                            "center",
                                          fontWeight:
                                            columna ===
                                            "Goals"
                                              ? 700
                                              : 500,
                                          color:
                                            columna ===
                                            "Goals"
                                              ? colores.verde
                                              : "inherit",
                                        }}
                                      >
                                        {obtenerValorEstadistica(
                                          fila,
                                          columna
                                        )}
                                      </td>
                                    )
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

      {/* ======================================================
          SIN DATOS
      ====================================================== */}

      {tablas.length ===
        0 &&
        estadisticas.length ===
          0 &&
        brackets.length ===
          0 && (
          <div
            style={{
              border:
                `1px solid ${colores.borde}`,
              borderRadius:
                "8px",
              padding:
                "25px",
              textAlign:
                "center",
              background:
                colores.fondo,
              color:
                colores.textoSecundario,
            }}
          >
            No hay datos de posiciones
            disponibles.
          </div>
        )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        style={{
          marginTop:
            "30px",
          paddingTop:
            "15px",
          borderTop:
            `1px solid ${colores.bordeSuave}`,
          textAlign:
            "center",
          fontSize:
            "0.75rem",
          color:
            colores.textoSecundario,
        }}
      >
        Chiquifutbol
      </footer>
    </main>
  );
}