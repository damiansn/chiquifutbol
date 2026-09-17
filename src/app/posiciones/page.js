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
// CONFIGURACIÓN DE COMPETENCIAS
// ============================================================

const COMPETENCIAS = {
  argentina: {
    nombre: "Liga Profesional Argentina",
    corto: "Liga Argentina",
  },

  copa_argentina: {
    nombre: "Copa Argentina",
    corto: "Copa Argentina",
  },

  libertadores: {
    nombre: "CONMEBOL Copa Libertadores",
    corto: "Copa Libertadores",
  },

  sudamericana: {
    nombre: "CONMEBOL Copa Sudamericana",
    corto: "Copa Sudamericana",
  },

  champions: {
    nombre: "Champions League",
    corto: "Champions League",
  },

  europa_league: {
    nombre: "UEFA Europa League",
    corto: "Europa League",
  },

  conference_league: {
    nombre: "UEFA Conference League",
    corto: "Conference League",
  },
};

// ============================================================
// UTILIDADES
// ============================================================

function obtenerValor(fila, key) {
  if (!fila || !Array.isArray(fila.values)) return "";

  const valor = fila.values.find((v) => v.key === key);

  return valor?.value ?? "";
}

function obtenerNombreEquipo(fila) {
  return (
    fila?.entity?.object?.name ||
    fila?.entity?.object?.short_name ||
    "Equipo"
  );
}

function obtenerColorEquipo(fila) {
  return fila?.entity?.object?.colors?.color || "#334155";
}

function obtenerTextoColorEquipo(fila) {
  return fila?.entity?.object?.colors?.text_color || "#ffffff";
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  // Formato habitual de Promiedos:
  // 11-08-2026 19:30

  const partes = fecha.split(" ");

  if (partes.length !== 2) return fecha;

  const [fechaParte, hora] = partes;

  const [dia, mes, anio] = fechaParte.split("-");

  if (!dia || !mes || !anio) return fecha;

  return `${dia}/${mes}/${anio} ${hora}`;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

function PosicionesContent() {
  const searchParams = useSearchParams();

  const competition =
    searchParams.get("competition") || "argentina";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  useEffect(() => {
    let cancelado = false;

    async function cargarDatos() {
      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setError("");

        const url =
          `/api/standings?competition=${encodeURIComponent(
            competition
          )}`;

        const response = await fetch(url, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            "No se pudieron obtener los datos."
          );
        }

        const json = await response.json();

        if (cancelado) return;

        if (requestId !== requestIdRef.current) {
          return;
        }

        setData(json);
      } catch (err) {
        if (cancelado) return;

        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          err?.message ||
            "Error al cargar los datos."
        );
      } finally {
        if (!cancelado && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [competition]);

  // ==========================================================
  // NOMBRE DE LA COMPETENCIA
  // ==========================================================

  const competenciaConfig =
    COMPETENCIAS[competition] || {
      nombre:
        data?.league?.name || "Competencia",
      corto:
        data?.league?.name || "Competencia",
    };

  // ==========================================================
  // OBTENER TODAS LAS TABLAS
  //
  // Estructura real:
  //
  // data.tables[]
  //   └── torneo
  //       └── tables[]
  //           └── grupo
  //               └── table
  // ==========================================================

  function obtenerTablasPosiciones() {
    if (!data || !Array.isArray(data.tables)) {
      return [];
    }

    const resultado = [];

    data.tables.forEach((torneo) => {
      if (!Array.isArray(torneo.tables)) {
        return;
      }

      torneo.tables.forEach((grupo) => {
        if (!grupo?.table) {
          return;
        }

        const tabla = grupo.table;

        if (!Array.isArray(tabla.rows)) {
          return;
        }

        resultado.push({
          torneo: torneo.name || "",
          grupo: grupo.name || "",
          table: tabla,
        });
      });
    });

    return resultado;
  }

  // ==========================================================
  // OBTENER BRACKETS
  //
  // Estructura real:
  //
  // data.brackets
  //   └── stages[]
  //       └── groups[]
  //           ├── participants[]
  //           └── games[]
  // ==========================================================

  function obtenerBrackets() {
    if (
      !data?.brackets ||
      !Array.isArray(data.brackets.stages)
    ) {
      return [];
    }

    return data.brackets.stages.filter(
      (stage) =>
        Array.isArray(stage?.groups) &&
        stage.groups.length > 0
    );
  }

  // ==========================================================
  // ESTADÍSTICAS DE JUGADORES
  // ==========================================================

  function obtenerEstadisticasJugadores() {
    if (
      !data?.players_statistics ||
      !Array.isArray(data.players_statistics.tables)
    ) {
      return [];
    }

    return data.players_statistics.tables;
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loading}>
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
      <main style={styles.page}>
        <div style={styles.container}>
          <Link href="/" style={styles.backLink}>
            ← Volver
          </Link>

          <div style={styles.header}>
            <h1 style={styles.title}>
              {competenciaConfig.nombre}
            </h1>
          </div>

          <div style={styles.errorBox}>
            {error}
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // DATOS
  // ==========================================================

  const tablas = obtenerTablasPosiciones();
  const brackets = obtenerBrackets();
  const estadisticas =
    obtenerEstadisticasJugadores();

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* ====================================================
            VOLVER
        ==================================================== */}

        <Link href="/" style={styles.backLink}>
          ← Volver a partidos
        </Link>

        {/* ====================================================
            CABECERA
        ==================================================== */}

        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              POSICIONES Y ESTADÍSTICAS
            </div>

            <h1 style={styles.title}>
              {data?.league?.name ||
                competenciaConfig.nombre}
            </h1>
          </div>
        </header>

        {/* ====================================================
            NAVEGACIÓN DE COMPETENCIAS
        ==================================================== */}

        <nav style={styles.competitionNav}>

          <Link
            href="/posiciones?competition=argentina"
            style={{
              ...styles.competitionButton,
              ...(competition === "argentina"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Liga Argentina
          </Link>

          <Link
            href="/posiciones?competition=copa_argentina"
            style={{
              ...styles.competitionButton,
              ...(competition === "copa_argentina"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Copa Argentina
          </Link>

          <Link
            href="/posiciones?competition=libertadores"
            style={{
              ...styles.competitionButton,
              ...(competition === "libertadores"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Libertadores
          </Link>

          <Link
            href="/posiciones?competition=sudamericana"
            style={{
              ...styles.competitionButton,
              ...(competition === "sudamericana"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Sudamericana
          </Link>

          <Link
            href="/posiciones?competition=champions"
            style={{
              ...styles.competitionButton,
              ...(competition === "champions"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Champions
          </Link>

          <Link
            href="/posiciones?competition=europa_league"
            style={{
              ...styles.competitionButton,
              ...(competition === "europa_league"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Europa League
          </Link>

          <Link
            href="/posiciones?competition=conference_league"
            style={{
              ...styles.competitionButton,
              ...(competition === "conference_league"
                ? styles.competitionButtonActive
                : {}),
            }}
          >
            Conference League
          </Link>

        </nav>

        {/* ====================================================
            TABLAS DE POSICIONES
        ==================================================== */}

        {tablas.length > 0 && (
          <section style={styles.section}>

            <div style={styles.sectionTitle}>
              <span>Tablas de posiciones</span>
            </div>

            <div style={styles.tablesGrid}>

              {tablas.map((item, index) => (
                <TablaPosiciones
                  key={`${item.torneo}-${item.grupo}-${index}`}
                  item={item}
                />
              ))}

            </div>

          </section>
        )}

        {/* ====================================================
            ELIMINATORIAS / BRACKETS
        ==================================================== */}

        {brackets.length > 0 && (
          <section style={styles.section}>

            <div style={styles.sectionTitle}>
              <span>Eliminatorias</span>
            </div>

            <div style={styles.bracketsContainer}>

              {brackets.map((stage, index) => (
                <StageBracket
                  key={`${stage.name}-${index}`}
                  stage={stage}
                />
              ))}

            </div>

          </section>
        )}

        {/* ====================================================
            ESTADÍSTICAS DE JUGADORES
        ==================================================== */}

        {estadisticas.length > 0 && (
          <section style={styles.section}>

            <div style={styles.sectionTitle}>
              <span>Estadísticas de jugadores</span>
            </div>

            <div style={styles.playerTables}>

              {estadisticas.map(
                (tabla, index) => (
                  <EstadisticasJugadores
                    key={`${tabla.name || "tabla"}-${index}`}
                    tabla={tabla}
                  />
                )
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            SIN DATOS
        ==================================================== */}

        {tablas.length === 0 &&
          brackets.length === 0 &&
          estadisticas.length === 0 && (
            <div style={styles.empty}>
              No hay información disponible para
              esta competencia.
            </div>
          )}

      </div>
    </main>
  );
}

// ============================================================
// TABLA DE POSICIONES
// ============================================================

function TablaPosiciones({ item }) {
  const { torneo, grupo, table } = item;

  const columns = Array.isArray(table.columns)
    ? table.columns
    : [];

  const rows = Array.isArray(table.rows)
    ? table.rows
    : [];

  return (
    <div style={styles.tableCard}>

      {/* CABECERA */}

      <div style={styles.tableHeader}>

        <div>
          {torneo && (
            <div style={styles.tableTournament}>
              {torneo}
            </div>
          )}

          <div style={styles.tableName}>
            {grupo || "Tabla de posiciones"}
          </div>
        </div>

      </div>

      {/* TABLA */}

      <div style={styles.tableScroll}>

        <table style={styles.table}>

          <thead>
            <tr>

              <th style={styles.posHeader}>
                #
              </th>

              <th
                style={{
                  ...styles.teamHeader,
                  textAlign: "left",
                }}
              >
                Equipo
              </th>

              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...styles.statHeader,
                    fontWeight:
                      column.is_bold
                        ? 800
                        : 600,
                  }}
                >
                  {column.title}
                </th>
              ))}

            </tr>
          </thead>

          <tbody>

            {rows.map((fila, index) => {

              const nombre =
                obtenerNombreEquipo(fila);

              const color =
                obtenerColorEquipo(fila);

              const textColor =
                obtenerTextoColorEquipo(fila);

              const posicion =
                fila.num ?? index + 1;

              return (
                <tr
                  key={`${nombre}-${index}`}
                  style={styles.tableRow}
                >

                  <td style={styles.position}>
                    {posicion}
                  </td>

                  <td style={styles.teamCell}>

                    <div
                      style={{
                        ...styles.teamBadge,
                        backgroundColor: color,
                        color: textColor,
                      }}
                    />

                    <span>
                      {nombre}
                    </span>

                  </td>

                  {columns.map(
                    (column) => {

                      const valor =
                        obtenerValor(
                          fila,
                          column.key
                        );

                      return (
                        <td
                          key={column.key}
                          style={{
                            ...styles.statCell,
                            fontWeight:
                              column.is_bold
                                ? 800
                                : 500,
                          }}
                        >
                          {Array.isArray(valor)
                            ? valor.join(" ")
                            : valor}
                        </td>
                      );
                    }
                  )}

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// ============================================================
// ETAPA DE ELIMINATORIAS
// ============================================================

function StageBracket({ stage }) {
  const groups = Array.isArray(stage?.groups)
    ? stage.groups
    : [];

  return (
    <div style={styles.stage}>

      <div style={styles.stageTitle}>
        {stage.name}
      </div>

      <div style={styles.bracketGrid}>

        {groups.map((group, index) => (
          <BracketGroup
            key={`${group?.participants
              ?.map((p) => p.id)
              .join("-") || "llave"}-${index}`}
            group={group}
          />
        ))}

      </div>

    </div>
  );
}

// ============================================================
// LLAVE / SERIE
// ============================================================

function BracketGroup({ group }) {
  const participants = Array.isArray(
    group?.participants
  )
    ? group.participants
    : [];

  const games = Array.isArray(group?.games)
    ? group.games
    : [];

  // ----------------------------------------------------------
  // Buscar quién clasifica
  // ----------------------------------------------------------

  let qualifiedId = null;

  for (const game of games) {
    if (
      game?.to_qualify &&
      Array.isArray(game.teams)
    ) {
      const indice =
        Number(game.to_qualify) - 1;

      if (
        indice >= 0 &&
        game.teams[indice]
      ) {
        qualifiedId =
          game.teams[indice].id;
      }
    }
  }

  // ----------------------------------------------------------
  // Si no encontramos por to_qualify,
  // buscamos por winner en un partido único.
  // ----------------------------------------------------------

  if (!qualifiedId && games.length === 1) {
    const game = games[0];

    if (
      game?.winner &&
      Array.isArray(game.teams)
    ) {
      const indice =
        Number(game.winner) - 1;

      if (
        indice >= 0 &&
        game.teams[indice]
      ) {
        qualifiedId =
          game.teams[indice].id;
      }
    }
  }

  return (
    <div style={styles.bracketCard}>

      {/* EQUIPOS DE LA LLAVE */}

      <div style={styles.bracketTeams}>

        {participants.map(
          (participant, index) => {

            const clasificado =
              qualifiedId ===
              participant.id;

            return (
              <div
                key={
                  participant.id ||
                  `${participant.name}-${index}`
                }
                style={{
                  ...styles.participant,
                  ...(clasificado
                    ? styles.participantQualified
                    : {}),
                }}
              >

                <div
                  style={
                    styles.participantPosition
                  }
                >
                  {index + 1}
                </div>

                <div
                  style={
                    styles.participantName
                  }
                >
                  {participant.short_name ||
                    participant.name}
                </div>

                {clasificado && (
                  <div
                    style={
                      styles.qualifiedLabel
                    }
                  >
                    CLASIF.
                  </div>
                )}

              </div>
            );
          }
        )}

      </div>

      {/* PARTIDOS */}

      {games.length > 0 && (
        <div style={styles.games}>

          {games.map((game, index) => (
            <BracketGame
              key={
                game?.id ||
                `partido-${index}`
              }
              game={game}
            />
          ))}

        </div>
      )}

    </div>
  );
}

// ============================================================
// PARTIDO DE ELIMINATORIA
// ============================================================

function BracketGame({ game }) {
  const teams = Array.isArray(game?.teams)
    ? game.teams
    : [];

  const scores = Array.isArray(game?.scores)
    ? game.scores
    : [];

  return (
    <div style={styles.game}>

      {/* FECHA */}

      {game?.start_time && (
        <div style={styles.gameDate}>
          {formatearFecha(
            game.start_time
          )}
        </div>
      )}

      {/* EQUIPOS */}

      <div style={styles.gameTeams}>

        {teams.map((team, index) => {

          const score =
            scores[index] ?? "-";

          const esGanador =
            game?.winner === index + 1;

          const clasifica =
            game?.to_qualify === index + 1;

          return (
            <div
              key={
                team?.id ||
                `${team?.name}-${index}`
              }
              style={{
                ...styles.gameTeam,
                ...(esGanador
                  ? styles.gameWinner
                  : {}),
              }}
            >

              <div style={styles.gameTeamName}>

                <div
                  style={{
                    ...styles.teamDot,
                    backgroundColor:
                      team?.colors?.color ||
                      "#334155",
                  }}
                />

                <span>
                  {team?.short_name ||
                    team?.name ||
                    "Equipo"}
                </span>

              </div>

              <div
                style={{
                  ...styles.gameScore,
                  ...(esGanador
                    ? styles.gameScoreWinner
                    : {}),
                }}
              >
                {score}
              </div>

              {clasifica && (
                <div
                  style={
                    styles.gameQualified
                  }
                >
                  →
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* ESTADO */}

      {game?.status?.name && (
        <div style={styles.gameStatus}>
          {game.status.name}
        </div>
      )}

    </div>
  );
}

// ============================================================
// ESTADÍSTICAS DE JUGADORES
// ============================================================

function EstadisticasJugadores({
  tabla,
}) {
  const rows = Array.isArray(tabla?.rows)
    ? tabla.rows
    : [];

  if (rows.length === 0) {
    return null;
  }

  // Detectamos automáticamente las columnas
  // disponibles en los jugadores.

  const keys = [];

  rows.forEach((row) => {
    if (!Array.isArray(row?.values)) {
      return;
    }

    row.values.forEach((value) => {
      if (
        value?.key &&
        !keys.includes(value.key)
      ) {
        keys.push(value.key);
      }
    });
  });

  function obtenerValorJugador(
    row,
    key
  ) {
    const valor = row?.values?.find(
      (v) => v.key === key
    );

    return valor?.value ?? "-";
  }

  return (
    <div style={styles.playerCard}>

      <div style={styles.tableHeader}>

        <div>

          <div style={styles.tableName}>
            {tabla.name ||
              "Estadísticas"}
          </div>

        </div>

      </div>

      <div style={styles.tableScroll}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.posHeader}>
                #
              </th>

              <th
                style={{
                  ...styles.teamHeader,
                  textAlign: "left",
                }}
              >
                Jugador
              </th>

              <th
                style={{
                  ...styles.teamHeader,
                  textAlign: "left",
                }}
              >
                Equipo
              </th>

              {keys.map((key) => (
                <th
                  key={key}
                  style={styles.statHeader}
                >
                  {key}
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {rows.map(
              (row, index) => {

                const jugador =
                  row?.entity?.object;

                const nombre =
                  jugador?.name ||
                  "Jugador";

                /*
                 * Por ahora dejamos "-"
                 * para equipo, tal como viene
                 * actualmente en la API.
                 *
                 * El team_id existe en entity.object,
                 * pero todavía no tenemos un mapa
                 * global team_id -> nombre.
                 */

                const equipo = "-";

                return (
                  <tr
                    key={
                      jugador?.name ||
                      `jugador-${index}`
                    }
                    style={styles.tableRow}
                  >

                    <td style={styles.position}>
                      {row?.num ??
                        index + 1}
                    </td>

                    <td
                      style={{
                        ...styles.teamCell,
                        fontWeight: 700,
                      }}
                    >
                      {nombre}
                    </td>

                    <td
                      style={{
                        ...styles.teamCell,
                        color:
                          "#8b949e",
                      }}
                    >
                      {equipo}
                    </td>

                    {keys.map((key) => (
                      <td
                        key={key}
                        style={
                          styles.statCell
                        }
                      >
                        {obtenerValorJugador(
                          row,
                          key
                        )}
                      </td>
                    ))}

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

// ============================================================
// PÁGINA
// ============================================================

export default function PosicionesPage() {
  return (
    <Suspense
      fallback={
        <main style={styles.page}>
          <div style={styles.container}>
            <div style={styles.loading}>
              Cargando...
            </div>
          </div>
        </main>
      }
    >
      <PosicionesContent />
    </Suspense>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = {

  page: {
    minHeight: "100vh",
    backgroundColor: "#0d131a",
    color: "#e6edf3",
    padding: "24px 16px 60px",
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  loading: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "15px",
  },

  backLink: {
    display: "inline-block",
    color: "#9ca3af",
    textDecoration: "none",
    fontSize: "14px",
    marginBottom: "20px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
  },

  eyebrow: {
    color: "#10b981",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#e6edf3",
  },

  competitionNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "30px",
  },

  competitionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "36px",
    padding: "0 13px",
    borderRadius: "7px",
    border: "1px solid #263244",
    backgroundColor: "#121821",
    color: "#9ca3af",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 700,
    transition:
      "background-color .15s ease, color .15s ease",
  },

  competitionButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
    color: "#07130f",
  },

  section: {
    marginTop: "30px",
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: 800,
    color: "#e6edf3",
    marginBottom: "14px",
  },

  tablesGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "14px",
  },

  tableCard: {
    backgroundColor: "#121821",
    border: "1px solid #263244",
    borderRadius: "10px",
    overflow: "hidden",
  },

  playerCard: {
    backgroundColor: "#121821",
    border: "1px solid #263244",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "14px",
  },

  tableHeader: {
    padding: "14px 16px",
    borderBottom:
      "1px solid #263244",
    backgroundColor: "#151d28",
  },

  tableTournament: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    marginBottom: "4px",
  },

  tableName: {
    color: "#e6edf3",
    fontSize: "15px",
    fontWeight: 800,
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "620px",
  },

  posHeader: {
    width: "38px",
    padding: "9px 6px",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 800,
    textAlign: "center",
    borderBottom:
      "1px solid #263244",
  },

  teamHeader: {
    padding: "9px 8px",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    borderBottom:
      "1px solid #263244",
    whiteSpace: "nowrap",
  },

  statHeader: {
    padding: "9px 7px",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "center",
    borderBottom:
      "1px solid #263244",
    whiteSpace: "nowrap",
  },

  tableRow: {
    borderBottom:
      "1px solid #1e2937",
  },

  position: {
    padding: "10px 6px",
    color: "#64748b",
    fontSize: "12px",
    textAlign: "center",
    verticalAlign: "middle",
  },

  teamCell: {
    padding: "10px 8px",
    color: "#e6edf3",
    fontSize: "13px",
    textAlign: "left",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  teamBadge: {
    display: "inline-block",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    marginRight: "8px",
    verticalAlign: "middle",
    border:
      "1px solid rgba(255,255,255,.12)",
  },

  statCell: {
    padding: "10px 7px",
    color: "#d7dee7",
    fontSize: "12px",
    textAlign: "center",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  // ==========================================================
  // BRACKETS
  // ==========================================================

  bracketsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  stage: {
    backgroundColor: "#121821",
    border:
      "1px solid #263244",
    borderRadius: "10px",
    overflow: "hidden",
  },

  stageTitle: {
    padding: "14px 16px",
    backgroundColor: "#151d28",
    borderBottom:
      "1px solid #263244",
    color: "#e6edf3",
    fontSize: "15px",
    fontWeight: 800,
  },

  bracketGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "12px",
    padding: "14px",
  },

  bracketCard: {
    backgroundColor: "#0d131a",
    border:
      "1px solid #263244",
    borderRadius: "8px",
    overflow: "hidden",
  },

  bracketTeams: {
    padding: "8px",
    borderBottom:
      "1px solid #263244",
  },

  participant: {
    display: "flex",
    alignItems: "center",
    minHeight: "32px",
    padding: "5px 7px",
    borderRadius: "5px",
    color: "#cbd5e1",
    fontSize: "13px",
    gap: "8px",
  },

  participantQualified: {
    backgroundColor:
      "rgba(16,185,129,.10)",
    color: "#e6edf3",
  },

  participantPosition: {
    width: "18px",
    color: "#64748b",
    fontSize: "10px",
    textAlign: "center",
    flexShrink: 0,
  },

  participantName: {
    flex: 1,
    fontWeight: 600,
  },

  qualifiedLabel: {
    color: "#10b981",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: ".5px",
  },

  games: {
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  game: {
    border:
      "1px solid #263244",
    borderRadius: "6px",
    overflow: "hidden",
    backgroundColor: "#121821",
  },

  gameDate: {
    padding: "5px 8px",
    color: "#64748b",
    fontSize: "10px",
    borderBottom:
      "1px solid #1e2937",
  },

  gameTeams: {
    display: "flex",
    flexDirection: "column",
  },

  gameTeam: {
    display: "flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "4px 8px",
    gap: "7px",
  },

  gameWinner: {
    backgroundColor:
      "rgba(16,185,129,.06)",
  },

  gameTeamName: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minWidth: 0,
    color: "#d7dee7",
    fontSize: "12px",
    fontWeight: 600,
  },

  teamDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
    border:
      "1px solid rgba(255,255,255,.1)",
  },

  gameScore: {
    minWidth: "20px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "13px",
    fontWeight: 700,
  },

  gameScoreWinner: {
    color: "#e6edf3",
    fontWeight: 900,
  },

  gameQualified: {
    color: "#10b981",
    fontSize: "15px",
    fontWeight: 900,
    width: "15px",
    textAlign: "center",
  },

  gameStatus: {
    padding: "5px 8px",
    borderTop:
      "1px solid #1e2937",
    color: "#64748b",
    fontSize: "10px",
  },

  empty: {
    padding: "40px 20px",
    textAlign: "center",
    backgroundColor: "#121821",
    border:
      "1px solid #263244",
    borderRadius: "10px",
    color: "#8b949e",
    fontSize: "14px",
  },

  errorBox: {
    padding: "18px",
    backgroundColor: "#121821",
    border:
      "1px solid #7f1d1d",
    borderRadius: "8px",
    color: "#fca5a5",
    fontSize: "14px",
  },
};