"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const COMPETENCIAS = {
  argentina: { nombre: "Liga Profesional Argentina", corto: "Liga Argentina" },
  copa_argentina: { nombre: "Copa Argentina", corto: "Copa Argentina" },
  libertadores: { nombre: "CONMEBOL Copa Libertadores", corto: "Copa Libertadores" },
  sudamericana: { nombre: "CONMEBOL Copa Sudamericana", corto: "Copa Sudamericana" },
  champions: { nombre: "Champions League", corto: "Champions League" },
  europa_league: { nombre: "UEFA Europa League", corto: "Europa League" },
  conference_league: { nombre: "UEFA Conference League", corto: "Conference League" },
};

const NAV_ITEMS = [
  ["argentina", "Liga Argentina"],
  ["copa_argentina", "Copa Argentina"],
  ["libertadores", "Libertadores"],
  ["sudamericana", "Sudamericana"],
  ["champions", "Champions"],
  ["europa_league", "Europa League"],
  ["conference_league", "Conference"],
];

const S = {
  page: { background: "#F3F4F6", color: "#111111", minHeight: "100vh", fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: "11px" },
  navbar: { background: "#1E3A8A", padding: "0", borderBottom: "2px solid #162d6e" },
  navInner: { maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center" },
  navLogo: { color: "#ffffff", fontWeight: "bold", fontSize: "14px", padding: "6px 10px", textDecoration: "none", borderRight: "1px solid #2d4fa0", whiteSpace: "nowrap" },
  navLink: { color: "#d0d9f0", fontSize: "11px", padding: "6px 8px", textDecoration: "none", borderRight: "1px solid #2d4fa0", display: "inline-block" },
  wrap: { maxWidth: "1000px", margin: "0 auto", padding: "4px", background: "#ffffff" },
  breadcrumb: { fontSize: "10px", color: "#6b7280", marginBottom: "4px" },
  breadLink: { color: "#1E3A8A", textDecoration: "underline" },
  compNav: { display: "flex", flexWrap: "wrap", gap: "2px", marginBottom: "6px", borderBottom: "2px solid #1E3A8A", paddingBottom: "4px" },
  compBtn: { background: "#e8eaf0", border: "1px solid #9ca3af", color: "#1E3A8A", padding: "2px 7px", fontSize: "11px", fontWeight: "bold", textDecoration: "none", display: "inline-block" },
  compBtnActive: { background: "#1E3A8A", border: "1px solid #162d6e", color: "#ffffff", padding: "2px 7px", fontSize: "11px", fontWeight: "bold", textDecoration: "none", display: "inline-block" },
  pageTitle: { fontSize: "13px", fontWeight: "bold", color: "#1E3A8A", borderBottom: "1px solid #D1D5DB", paddingBottom: "3px", marginBottom: "6px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "6px", alignItems: "start" },
  tableBox: { border: "1px solid #D1D5DB", background: "#ffffff", marginBottom: "4px" },
  tableHead: { background: "#1E3A8A", color: "#ffffff", padding: "2px 5px", fontSize: "11px", fontWeight: "bold" },
  tableSubHead: { background: "#2d4fa0", color: "#d0d9f0", padding: "1px 5px", fontSize: "10px" },
  th: { padding: "2px 4px", background: "#f3f4f6", borderBottom: "1px solid #D1D5DB", borderRight: "1px solid #e5e7eb", textAlign: "center", fontWeight: "bold", fontSize: "10px", color: "#374151", whiteSpace: "nowrap" },
  thLeft: { padding: "2px 4px", background: "#f3f4f6", borderBottom: "1px solid #D1D5DB", borderRight: "1px solid #e5e7eb", textAlign: "left", fontWeight: "bold", fontSize: "10px", color: "#374151" },
  td: { padding: "2px 4px", borderBottom: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", textAlign: "center", fontSize: "11px", whiteSpace: "nowrap" },
  tdLeft: { padding: "2px 4px", borderBottom: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", textAlign: "left", fontSize: "11px", whiteSpace: "nowrap" },
  tdPos: { padding: "2px 4px", borderBottom: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", textAlign: "center", fontSize: "11px", color: "#6b7280", width: "22px" },
  teamBadge: { display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", marginRight: "4px", verticalAlign: "middle", border: "1px solid rgba(0,0,0,0.15)" },
  sectionTitle: { fontSize: "12px", fontWeight: "bold", color: "#1E3A8A", borderBottom: "1px solid #D1D5DB", paddingBottom: "2px", marginBottom: "4px", marginTop: "8px" },
  bracketsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "4px" },
  bracketCard: { border: "1px solid #D1D5DB", background: "#ffffff" },
  bracketCardWinner: { border: "1px solid #10B981" },
  bracketTeamRow: { display: "flex", alignItems: "center", padding: "2px 5px", gap: "4px", borderBottom: "1px solid #e5e7eb", fontSize: "11px" },
  bracketTeamQual: { background: "#f0fdf4" },
  qualLabel: { color: "#10B981", fontSize: "9px", fontWeight: "bold", marginLeft: "auto" },
  gameBox: { border: "1px solid #e5e7eb", margin: "3px 4px", background: "#F9FAFB" },
  gameHeader: { background: "#e8eaf0", padding: "1px 4px", fontSize: "10px", display: "flex", justifyContent: "space-between" },
  gameTeamRow: { display: "flex", alignItems: "center", padding: "1px 4px", gap: "4px", fontSize: "11px", borderBottom: "1px solid #e5e7eb" },
  gameWinner: { background: "#f0fdf4" },
  gameScore: { marginLeft: "auto", fontWeight: "bold", minWidth: "16px", textAlign: "right" },
  globalBox: { background: "#f3f4f6", borderTop: "1px solid #D1D5DB", padding: "2px 5px", fontSize: "10px" },
  playerGrid: { display: "flex", flexDirection: "column", gap: "4px" },
  loading: { padding: "20px", textAlign: "center", color: "#6b7280", fontSize: "11px" },
  errorBox: { background: "#fef2f2", border: "1px solid #EF4444", color: "#EF4444", padding: "4px 6px", fontSize: "11px", marginBottom: "4px" },
  empty: { padding: "12px", textAlign: "center", color: "#6b7280", border: "1px solid #D1D5DB", fontSize: "11px" },
  footer: { borderTop: "2px solid #1E3A8A", background: "#f3f4f6", padding: "4px 6px", textAlign: "center", color: "#6b7280", fontSize: "10px", marginTop: "6px" },
};

function obtenerValor(fila, key) {
  if (!fila || !Array.isArray(fila.values)) return "";
  const v = fila.values.find(v => v.key === key);
  return v?.value ?? "";
}

function obtenerNombreEquipo(fila) {
  return fila?.entity?.object?.name || fila?.entity?.object?.short_name || "Equipo";
}

function obtenerColorEquipo(fila) {
  return fila?.entity?.object?.colors?.color || "#334155";
}

function obtenerTextoColorEquipo(fila) {
  return fila?.entity?.object?.colors?.text_color || "#ffffff";
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const p = String(fecha).split(" ");
  if (p.length !== 2) return fecha;
  const [f, h] = p;
  const [d, m, a] = f.split("-");
  if (!d || !m || !a) return fecha;
  return `${d}/${m}/${a} ${h}`;
}

function obtenerScore(score) {
  if (score === null || score === undefined) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function TablaPosiciones({ item }) {
  const { torneo, grupo, table } = item;
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  return (
    <div style={S.tableBox}>
      {torneo && <div style={S.tableSubHead}>{torneo}</div>}
      <div style={S.tableHead}>{grupo || "Tabla de posiciones"}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "280px" }}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={S.thLeft}>Equipo</th>
              {columns.map(c => (
                <th key={c.key} style={{ ...S.th, fontWeight: c.is_bold ? "900" : "bold" }}>{c.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((fila, i) => {
              const nombre = obtenerNombreEquipo(fila);
              const color = obtenerColorEquipo(fila);
              const pos = fila.num ?? i + 1;
              return (
                <tr key={`${nombre}-${i}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FAFB" }}>
                  <td style={S.tdPos}>{pos}</td>
                  <td style={S.tdLeft}>
                    <span style={{ ...S.teamBadge, backgroundColor: color }} />
                    {nombre}
                  </td>
                  {columns.map(c => {
                    const v = obtenerValor(fila, c.key);
                    return (
                      <td key={c.key} style={{ ...S.td, fontWeight: c.is_bold ? "900" : "normal" }}>
                        {Array.isArray(v) ? v.join(" ") : v}
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
}

function BracketGame({ game, numeroPartido, esSerie }) {
  const teams = Array.isArray(game?.teams) ? game.teams : [];
  const scores = Array.isArray(game?.scores) ? game.scores : [];
  let etiqueta = "";
  if (esSerie) {
    if (numeroPartido === 0) etiqueta = "IDA";
    else if (numeroPartido === 1) etiqueta = "VUELTA";
    else etiqueta = `PARTIDO ${numeroPartido + 1}`;
  }
  return (
    <div style={S.gameBox}>
      <div style={S.gameHeader}>
        <span style={{ fontWeight: "bold", color: "#1E3A8A" }}>{etiqueta}</span>
        {game?.start_time && <span style={{ color: "#6b7280" }}>{formatearFecha(game.start_time)}</span>}
      </div>
      {teams.map((team, i) => {
        const score = scores[i] ?? "-";
        const esGanador = game?.winner === i + 1;
        const clasifica = game?.to_qualify === i + 1;
        return (
          <div key={team?.id || `${team?.name}-${i}`} style={{ ...S.gameTeamRow, ...(esGanador ? S.gameWinner : {}) }}>
            <span style={{ flex: 1, fontWeight: esGanador ? "bold" : "normal" }}>{team?.short_name || team?.name || "Equipo"}</span>
            <span style={{ ...S.gameScore, color: esGanador ? "#10B981" : "#111111" }}>{score}</span>
            {clasifica && <span style={{ color: "#10B981", fontSize: "10px", marginLeft: "3px" }}>✓</span>}
          </div>
        );
      })}
      {game?.status?.name && <div style={{ padding: "1px 4px", fontSize: "9px", color: "#6b7280", borderTop: "1px solid #e5e7eb" }}>{game.status.name}</div>}
    </div>
  );
}

function BracketGroup({ group }) {
  const participants = Array.isArray(group?.participants) ? group.participants : [];
  const games = Array.isArray(group?.games) ? group.games : [];
  const esSerie = games.length > 1;

  let qualifiedId = null;
  for (const game of games) {
    if (game?.to_qualify && Array.isArray(game.teams)) {
      const idx = Number(game.to_qualify) - 1;
      if (idx >= 0 && game.teams[idx]) qualifiedId = game.teams[idx].id;
    }
  }
  if (!qualifiedId && games.length === 1) {
    const game = games[0];
    if (game?.winner && Array.isArray(game.teams)) {
      const idx = Number(game.winner) - 1;
      if (idx >= 0 && game.teams[idx]) qualifiedId = game.teams[idx].id;
    }
  }

  const globales = {};
  participants.forEach(p => { if (p?.id) globales[p.id] = 0; });
  games.forEach(game => {
    const ts = Array.isArray(game?.teams) ? game.teams : [];
    const sc = Array.isArray(game?.scores) ? game.scores : [];
    ts.forEach((t, i) => {
      if (!t?.id) return;
      const s = obtenerScore(sc[i]);
      if (s === null) return;
      if (globales[t.id] === undefined) globales[t.id] = 0;
      globales[t.id] += s;
    });
  });

  const hayGlobal = esSerie && games.some(g => Array.isArray(g?.scores) && g.scores.some(s => obtenerScore(s) !== null));

  return (
    <div style={{ ...S.bracketCard, ...(qualifiedId ? S.bracketCardWinner : {}) }}>
      {/* EQUIPOS */}
      <div>
        {participants.map((p, i) => {
          const clasif = qualifiedId === p.id;
          const global = globales[p.id];
          return (
            <div key={p.id || `${p.name}-${i}`} style={{ ...S.bracketTeamRow, ...(clasif ? S.bracketTeamQual : {}) }}>
              <span style={{ color: "#6b7280", fontSize: "10px", width: "12px" }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: clasif ? "bold" : "normal" }}>{p.short_name || p.name}</span>
              {esSerie && hayGlobal && <span style={{ fontWeight: "bold", color: clasif ? "#10B981" : "#111111", minWidth: "16px", textAlign: "right" }}>{global}</span>}
              {clasif && <span style={S.qualLabel}>CLASIF.</span>}
            </div>
          );
        })}
      </div>
      {/* PARTIDOS */}
      {games.map((game, i) => (
        <BracketGame key={game?.id || `p-${i}`} game={game} numeroPartido={i} esSerie={esSerie} />
      ))}
      {/* GLOBAL */}
      {esSerie && hayGlobal && (
        <div style={S.globalBox}>
          <strong>GLOBAL: </strong>
          {participants.map((p, i) => (
            <span key={p.id || i} style={{ marginRight: "8px", fontWeight: qualifiedId === p.id ? "bold" : "normal", color: qualifiedId === p.id ? "#10B981" : "#111111" }}>
              {p.short_name || p.name} {globales[p.id] ?? 0}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StageBracket({ stage }) {
  const groups = Array.isArray(stage?.groups) ? stage.groups : [];
  return (
    <div style={{ ...S.tableBox, marginBottom: "6px" }}>
      <div style={S.tableHead}>{stage.name}</div>
      <div style={{ ...S.bracketsGrid, padding: "4px" }}>
        {groups.map((g, i) => (
          <BracketGroup key={`${g?.participants?.map(p => p.id).join("-") || "llave"}-${i}`} group={g} />
        ))}
      </div>
    </div>
  );
}

function EstadisticasJugadores({ tabla }) {
  const rows = Array.isArray(tabla?.rows) ? tabla.rows : [];
  if (rows.length === 0) return null;
  const keys = [];
  rows.forEach(row => {
    if (!Array.isArray(row?.values)) return;
    row.values.forEach(v => { if (v?.key && !keys.includes(v.key)) keys.push(v.key); });
  });

  function obtenerEquipoJugador(row) {
    const j = row?.entity?.object;
    const opts = [j?.team?.name, j?.team?.short_name, j?.club?.name, j?.club?.short_name, row?.team?.name, row?.team?.short_name, row?.entity?.team?.name, j?.team_name, j?.club_name];
    for (const o of opts) { if (o && typeof o === "string") return o; }
    if (Array.isArray(row?.entities)) {
      const eq = row.entities.find(e => e?.type === 1 || e?.object?.type === "team");
      if (eq?.object?.name) return eq.object.name;
    }
    return "-";
  }

  return (
    <div style={S.tableBox}>
      <div style={S.tableHead}>{tabla.name || "Estadísticas"}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={S.thLeft}>Jugador</th>
              <th style={S.thLeft}>Equipo</th>
              {keys.map(k => <th key={k} style={S.th}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const j = row?.entity?.object;
              const nombre = j?.name || "Jugador";
              const equipo = obtenerEquipoJugador(row);
              return (
                <tr key={j?.id || j?.name || `j-${i}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FAFB" }}>
                  <td style={S.tdPos}>{row?.num ?? i + 1}</td>
                  <td style={{ ...S.tdLeft, fontWeight: "bold" }}>{nombre}</td>
                  <td style={{ ...S.tdLeft, color: "#6b7280" }}>{equipo}</td>
                  {keys.map(k => {
                    const v = row?.values?.find(vv => vv.key === k)?.value ?? "-";
                    return <td key={k} style={S.td}>{Array.isArray(v) ? v.join(" ") : v}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PosicionesContent() {
  const searchParams = useSearchParams();
  const competition = searchParams.get("competition") || "argentina";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const rid = ++requestIdRef.current;
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/standings?competition=${encodeURIComponent(competition)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudieron obtener los datos.");
        const json = await res.json();
        if (cancelado || rid !== requestIdRef.current) return;
        setData(json);
      } catch (err) {
        if (cancelado || rid !== requestIdRef.current) return;
        setError(err?.message || "Error al cargar los datos.");
      } finally {
        if (!cancelado && rid === requestIdRef.current) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [competition]);

  const compConfig = COMPETENCIAS[competition] || { nombre: data?.league?.name || "Competencia", corto: "Competencia" };

  function obtenerTablas() {
    if (!data) return [];
    const resultado = [];
    if (Array.isArray(data.tables)) {
      data.tables.forEach(torneo => {
        if (!Array.isArray(torneo?.tables)) return;
        torneo.tables.forEach(grupo => {
          if (!grupo?.table || !Array.isArray(grupo.table.rows)) return;
          resultado.push({ torneo: torneo.name || "", grupo: grupo.name || "", table: grupo.table });
        });
      });
    }
    if (Array.isArray(data.tables_groups)) {
      data.tables_groups.forEach(gc => {
        if (!Array.isArray(gc?.tables)) return;
        gc.tables.forEach(tg => {
          if (!tg?.table || !Array.isArray(tg.table.rows)) return;
          const yaExiste = resultado.some(it => it.torneo === (gc.name || "") && it.grupo === (tg.name || "") && it.table === tg.table);
          if (yaExiste) return;
          resultado.push({ torneo: gc.name || "", grupo: tg.name || "", table: tg.table });
        });
      });
    }
    return resultado;
  }

  function obtenerBrackets() {
    if (!data?.brackets || !Array.isArray(data.brackets.stages)) return [];
    return data.brackets.stages.filter(s => Array.isArray(s?.groups) && s.groups.length > 0);
  }

  function obtenerEstadisticas() {
    if (!data?.players_statistics || !Array.isArray(data.players_statistics.tables)) return [];
    return data.players_statistics.tables;
  }

  const Navbar = () => (
    <div style={S.navbar}>
      <div style={S.navInner}>
        <a href="/" style={S.navLogo}>⚽ ChiquiFútbol</a>
        <a href="/" style={S.navLink}>Inicio</a>
        <a href="/posiciones?competition=argentina" style={S.navLink}>Posiciones</a>
        <a href="/posiciones?competition=libertadores" style={S.navLink}>Libertadores</a>
        <a href="/posiciones?competition=champions" style={S.navLink}>Champions</a>
      </div>
    </div>
  );

  if (loading) return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}><div style={S.loading}>Cargando posiciones...</div></div>
    </div>
  );

  const tablas = obtenerTablas();
  const brackets = obtenerBrackets();
  const estadisticas = obtenerEstadisticas();

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>

        {/* BREADCRUMB */}
        <div style={S.breadcrumb}>
          <Link href="/" style={S.breadLink}>Inicio</Link>
          {" > "}
          <span>Posiciones</span>
          {" > "}
          <strong>{compConfig.corto}</strong>
        </div>

        {/* TÍTULO */}
        <div style={S.pageTitle}>
          POSICIONES Y ESTADÍSTICAS — {(data?.league?.name || compConfig.nombre).toUpperCase()}
        </div>

        {/* NAV COMPETENCIAS */}
        <div style={S.compNav}>
          {NAV_ITEMS.map(([key, label]) => (
            <Link key={key} href={`/posiciones?competition=${key}`} style={competition === key ? S.compBtnActive : S.compBtn}>
              {label}
            </Link>
          ))}
        </div>

        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {/* TABLAS */}
        {tablas.length > 0 && (
          <>
            <div style={S.sectionTitle}>▶ TABLAS DE POSICIONES</div>
            <div style={S.grid}>
              {tablas.map((item, i) => (
                <TablaPosiciones key={`${item.torneo}-${item.grupo}-${i}`} item={item} />
              ))}
            </div>
          </>
        )}

        {/* ELIMINATORIAS */}
        {brackets.length > 0 && (
          <>
            <div style={S.sectionTitle}>▶ ELIMINATORIAS</div>
            {brackets.map((stage, i) => (
              <StageBracket key={`${stage.name}-${i}`} stage={stage} />
            ))}
          </>
        )}

        {/* ESTADÍSTICAS */}
        {estadisticas.length > 0 && (
          <>
            <div style={S.sectionTitle}>▶ ESTADÍSTICAS DE JUGADORES</div>
            <div style={S.playerGrid}>
              {estadisticas.map((tabla, i) => (
                <EstadisticasJugadores key={`${tabla.name || "t"}-${i}`} tabla={tabla} />
              ))}
            </div>
          </>
        )}

        {tablas.length === 0 && brackets.length === 0 && estadisticas.length === 0 && !error && (
          <div style={S.empty}>No hay información disponible para esta competencia.</div>
        )}

        <div style={S.footer}>
          ChiquiFútbol &copy; {new Date().getFullYear()} &mdash; Resultados en tiempo real
        </div>
      </div>
    </div>
  );
}

export default function PosicionesPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Arial, sans-serif", fontSize: "11px" }}>
        <div style={{ background: "#1E3A8A", padding: "6px 10px", color: "#ffffff", fontWeight: "bold" }}>⚽ ChiquiFútbol</div>
        <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Cargando...</div>
      </div>
    }>
      <PosicionesContent />
    </Suspense>
  );
}
