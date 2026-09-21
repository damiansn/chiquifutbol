"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

const S = {
  page: { background: "#ffffff", color: "#111111", minHeight: "100vh", fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: "11px" },
  navbar: { background: "#1E3A8A", padding: "0", borderBottom: "2px solid #162d6e" },
  navInner: { maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0" },
  navLogo: { color: "#ffffff", fontWeight: "bold", fontSize: "14px", padding: "6px 10px", textDecoration: "none", borderRight: "1px solid #2d4fa0", whiteSpace: "nowrap" },
  navLink: { color: "#d0d9f0", fontSize: "11px", padding: "6px 8px", textDecoration: "none", borderRight: "1px solid #2d4fa0", display: "inline-block" },
  navLinkActive: { color: "#ffffff", background: "#162d6e", fontWeight: "bold" },
  wrap: { maxWidth: "1400px", margin: "0 auto", padding: "4px" },
  topBar: { background: "#1E3A8A", color: "#ffffff", fontSize: "10px", padding: "2px 4px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  dateBar: { display: "flex", gap: "2px", marginBottom: "4px", alignItems: "center" },
  dateBtn: { background: "#e8eaf0", border: "1px solid #9ca3af", color: "#1E3A8A", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  dateBtnActive: { background: "#1E3A8A", border: "1px solid #162d6e", color: "#ffffff", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", alignItems: "start" },
  leagueBox: { border: "1px solid #D1D5DB", background: "#ffffff", marginBottom: "4px" },
  leagueHead: { background: "#1E3A8A", color: "#ffffff", padding: "2px 5px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  leagueHeadLink: { color: "#ffffff", textDecoration: "none", fontWeight: "bold", fontSize: "11px" },
  matchRow: { display: "grid", gridTemplateColumns: "72px 1fr 52px", borderBottom: "1px solid #e5e7eb", fontSize: "11px" },
  matchRowAlt: { display: "grid", gridTemplateColumns: "72px 1fr 52px", borderBottom: "1px solid #e5e7eb", fontSize: "11px", background: "#F9FAFB" },
  statusCell: { padding: "2px 3px", textAlign: "center", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" },
  matchCell: { padding: "2px 4px" },
  tvCell: { padding: "2px 3px", textAlign: "right", color: "#6b7280", fontSize: "10px", borderLeft: "1px solid #e5e7eb" },
  teamsRow: { display: "grid", gridTemplateColumns: "1fr 44px 1fr", alignItems: "center", gap: "2px" },
  teamName: { fontSize: "11px", fontWeight: "bold", color: "#111111" },
  teamNameRight: { fontSize: "11px", fontWeight: "bold", color: "#111111", textAlign: "right" },
  score: { textAlign: "center", fontWeight: "bold", fontSize: "13px", color: "#111111" },
  scoreLive: { textAlign: "center", fontWeight: "bold", fontSize: "13px", color: "#10B981" },
  scoreFinal: { textAlign: "center", fontWeight: "bold", fontSize: "13px", color: "#6b7280" },
  statusLive: { color: "#10B981", fontWeight: "bold", fontSize: "10px" },
  statusFinal: { color: "#EF4444", fontSize: "10px" },
  statusPending: { color: "#1E3A8A", fontSize: "10px" },
  golesRow: { display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "10px", color: "#6b7280", marginTop: "1px" },
  globalBadge: { fontSize: "10px", color: "#6b7280", textAlign: "center", borderTop: "1px solid #e5e7eb", padding: "1px 0" },
  redCard: { display: "inline-block", width: "6px", height: "9px", background: "#EF4444", marginLeft: "2px", verticalAlign: "middle" },
  searchWrap: { position: "relative", display: "inline-block" },
  searchInput: { border: "1px solid #9ca3af", padding: "2px 5px", fontSize: "11px", width: "180px", outline: "none" },
  dropdown: { position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#ffffff", border: "1px solid #9ca3af", width: "220px", boxShadow: "2px 2px 4px rgba(0,0,0,0.2)" },
  dropdownItem: { padding: "3px 6px", cursor: "pointer", borderBottom: "1px solid #e5e7eb", fontSize: "11px", color: "#1E3A8A", background: "none", border: "none", width: "100%", textAlign: "left", display: "block" },
  fixtureBox: { border: "1px solid #D1D5DB", marginBottom: "4px", background: "#ffffff" },
  fixtureHead: { background: "#F59E0B", color: "#111111", padding: "2px 5px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  fixtureRow: { display: "grid", gridTemplateColumns: "50px 20px 1fr 50px 1fr", borderBottom: "1px solid #e5e7eb", fontSize: "11px", padding: "2px 4px", alignItems: "center", gap: "4px" },
  fixtureRowAlt: { display: "grid", gridTemplateColumns: "50px 20px 1fr 50px 1fr", borderBottom: "1px solid #e5e7eb", fontSize: "11px", padding: "2px 4px", alignItems: "center", gap: "4px", background: "#F9FAFB" },
  closeBtn: { background: "#EF4444", border: "none", color: "#ffffff", padding: "1px 5px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" },
  errorBox: { background: "#fef2f2", border: "1px solid #EF4444", color: "#EF4444", padding: "4px 6px", fontSize: "11px", marginBottom: "4px" },
  loading: { padding: "10px", textAlign: "center", color: "#6b7280", fontSize: "11px" },
  noMatches: { padding: "8px", textAlign: "center", color: "#6b7280", border: "1px solid #D1D5DB", fontSize: "11px" },
  footer: { borderTop: "2px solid #1E3A8A", background: "#f3f4f6", padding: "4px 6px", textAlign: "center", color: "#6b7280", fontSize: "10px", marginTop: "6px" },
};

function normalizarNombre(league) {
  return league?.name || league?.nombre || league?.title || "Partidos";
}

function obtenerCompetition(league) {
  const n = (league?.name || league?.nombre || league?.title || "").toLowerCase();
  if (n.includes("libertadores")) return "libertadores";
  if (n.includes("sudamericana")) return "sudamericana";
  if (n.includes("copa argentina")) return "copa_argentina";
  if (n.includes("champions")) return "champions";
  if (n.includes("europa league")) return "europa_league";
  if (n.includes("conference")) return "conference_league";
  return "argentina";
}

function nombreEquipo(team) {
  if (typeof team === "string") return team;
  return team?.name || team?.short_name || team?.team_name || "Equipo";
}

function logoEquipo(team) {
  return team?.logo || team?.image || team?.icon || team?.symbol || null;
}

function obtenerScore(game, i) {
  if (Array.isArray(game?.scores)) return game.scores[i] ?? "-";
  return "-";
}

function obtenerEquipo(game, i) {
  return game?.teams?.[i] || {};
}

function obtenerTarjetasRojas(team) {
  const n = Number(team?.red_cards || 0);
  return Number.isNaN(n) || n <= 0 ? 0 : n;
}

function obtenerGoles(team) {
  return Array.isArray(team?.goals) ? team.goals : [];
}

function obtenerNombreGol(goal) {
  return goal?.player_sname || goal?.player_name || goal?.player || goal?.name || "Gol";
}

function obtenerMinutoGol(goal) {
  if (goal?.time_to_display != null && goal.time_to_display !== "") return String(goal.time_to_display);
  if (goal?.time != null && goal.time !== "") return `${goal.time}'`;
  if (goal?.minute != null && goal.minute !== "") return `${goal.minute}'`;
  if (goal?.min != null && goal.min !== "") return `${goal.min}'`;
  return "";
}

function obtenerTV(game) {
  return Array.isArray(game?.tv_networks) ? game.tv_networks : [];
}

function obtenerGlobal(game) {
  if (!game?.global) return null;
  const g = game.global;
  let a = g.score1 ?? g.team1?.score;
  let b = g.score2 ?? g.team2?.score;
  if (a == null || b == null) return null;
  return { scoreA: a, scoreB: b };
}

function obtenerMinutoLive(game) {
  const src = game?.game_time_to_display || game?.game_time_status_to_display || game?.game_time;
  if (src != null && src !== "") {
    const m = String(src).match(/(\d{1,3})/);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function obtenerFechaObjeto(game) {
  const v = game?.date || game?.datetime || game?.start_time || game?.startTime || game?.kickoff || game?.timestamp || game?.start;
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ts = v < 10000000000 ? v * 1000 : v;
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatearHoraArgentina(game) {
  const d = obtenerFechaObjeto(game);
  if (d) {
    try {
      return d.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {}
  }
  return game?.time || game?.hour || null;
}

function formatearHora(game) {
  const hora = formatearHoraArgentina(game);
  if (game?.start_time) {
    const txt = String(game.start_time).trim();
    const m = txt.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) {
      const ahora = new Date();
      const partes = {};
      new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(ahora).forEach(p => { partes[p.type] = p.value; });
      const hoy = `${partes.day}-${partes.month}-${partes.year}`;
      if (`${m[1]}-${m[2]}-${m[3]}` !== hoy) return `${m[1]}/${m[2]} ${m[4]}:${m[5]}`;
    }
  }
  if (hora && hora !== "--:--") return hora;
  if (game?.start_time) {
    const m = String(game.start_time).trim().match(/(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return "--:--";
}

function obtenerEstado(game) {
  const e = game?.status || {};
  const en = Number(e?.enum);
  if (en === 2) {
    const min = obtenerMinutoLive(game);
    return { texto: min !== null ? `${min}'` : "EN VIVO", tipo: "live" };
  }
  if (en === 3) return { texto: "FINAL", tipo: "final" };
  const d = obtenerFechaObjeto(game);
  let hora = null;
  if (d) {
    try { hora = d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }); } catch {}
  }
  return { texto: hora || e?.name || formatearHora(game), tipo: "pending" };
}

function obtenerRivalFixture(f) {
  return f?.opponent || f?.rival || f?.opponent_name || f?.rival_name || f?.vs || f?.team_opponent || f?.teamOpponent || "";
}

function obtenerCondicionFixture(f) {
  const c = String(f?.homeAway || f?.home_away || f?.condition || f?.local_visitante || f?.localVisitante || "").trim().toUpperCase();
  if (c === "L" || c.includes("LOCAL")) return "L";
  if (c === "V" || c.includes("VISIT")) return "V";
  return "";
}

function obtenerFechaFixture(f) { return f?.date || f?.fecha || f?.day || "--/--"; }
function obtenerHoraFixture(f) { return f?.time || f?.hour || f?.hora || f?.start_time || "--:--"; }
function obtenerCompetenciaFixture(f) { return f?.competition || f?.league || f?.tournament || f?.competencia || ""; }

export default function Home() {
  const [date, setDate] = useState("today");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [teamFixturesLoading, setTeamFixturesLoading] = useState(false);

  async function cargarPartidos() {
    try {
      setError("");
      const res = await fetch(`/api/matches?date=${date}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron cargar los partidos.");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err.message || "Error cargando partidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); cargarPartidos(); }, [date]);
  useEffect(() => { const t = setInterval(cargarPartidos, 30000); return () => clearInterval(t); }, [date]);

  useEffect(() => {
    fetch("/api/team-fixture?list=true", { cache: "no-store" })
      .then(r => r.json())
      .then(j => setTeams(Array.isArray(j) ? j : []))
      .catch(() => {});
  }, []);

  const equiposFiltrados = useMemo(() => {
    const txt = search.trim().toLowerCase();
    if (!txt) return [];
    return teams.filter(t => (t.name || t.nombre || "").toLowerCase().includes(txt)).slice(0, 10);
  }, [search, teams]);

  async function seleccionarEquipo(team) {
    setSelectedTeam(team);
    setSearch(team.name || team.nombre || "");
    setTeamFixtures([]);
    try {
      setTeamFixturesLoading(true);
      const id = team.id || team.team_id || team.teamId;
      const res = await fetch(`/api/team-fixture?team=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTeamFixtures(Array.isArray(json) ? json : Array.isArray(json.fixtures) ? json.fixtures : Array.isArray(json.matches) ? json.matches : []);
    } catch {
      setTeamFixtures([]);
    } finally {
      setTeamFixturesLoading(false);
    }
  }

  const hayPartidos = data.some(l => Array.isArray(l?.games) && l.games.length > 0);

  return (
    <div style={S.page}>

      {/* NAVBAR */}
      <div style={S.navbar}>
        <div style={S.navInner}>
          <a href="/" style={S.navLogo}>⚽ ChiquiFútbol</a>
          <a href="/" style={{ ...S.navLink, ...(true ? S.navLinkActive : {}) }}>Inicio</a>
          <a href="/posiciones?competition=argentina" style={S.navLink}>Posiciones</a>
          <a href="/posiciones?competition=libertadores" style={S.navLink}>Libertadores</a>
          <a href="/posiciones?competition=champions" style={S.navLink}>Champions</a>
        </div>
      </div>

      <div style={S.wrap}>

        {/* BARRA SUPERIOR */}
        <div style={S.topBar}>
          <span style={{ fontWeight: "bold" }}>RESULTADOS Y PARTIDOS EN VIVO</span>
          <div style={S.searchWrap}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (selectedTeam) { setSelectedTeam(null); setTeamFixtures([]); } }}
              placeholder="Buscar equipo..."
              style={S.searchInput}
            />
            {search.trim() && !selectedTeam && equiposFiltrados.length > 0 && (
              <div style={S.dropdown}>
                {equiposFiltrados.map(t => (
                  <button key={t.id || t.name} onClick={() => seleccionarEquipo(t)} style={S.dropdownItem}>
                    {t.name || t.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FIXTURE EQUIPO */}
        {selectedTeam && (
          <div style={S.fixtureBox}>
            <div style={S.fixtureHead}>
              <span>⚽ PRÓXIMOS PARTIDOS: {(selectedTeam.name || selectedTeam.nombre || "").toUpperCase()}</span>
              <button style={S.closeBtn} onClick={() => { setSelectedTeam(null); setTeamFixtures([]); setSearch(""); }}>X</button>
            </div>
            {teamFixturesLoading ? (
              <div style={S.loading}>Cargando fixture...</div>
            ) : teamFixtures.length === 0 ? (
              <div style={S.loading}>Sin próximos partidos.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #D1D5DB", width: "50px" }}>Fecha</th>
                    <th style={{ padding: "2px 4px", textAlign: "center", borderBottom: "1px solid #D1D5DB", width: "20px" }}>L/V</th>
                    <th style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #D1D5DB" }}>Local</th>
                    <th style={{ padding: "2px 4px", textAlign: "center", borderBottom: "1px solid #D1D5DB", width: "50px" }}>Hora</th>
                    <th style={{ padding: "2px 4px", textAlign: "left", borderBottom: "1px solid #D1D5DB" }}>Visitante</th>
                    <th style={{ padding: "2px 4px", textAlign: "right", borderBottom: "1px solid #D1D5DB", color: "#6b7280" }}>Competencia</th>
                  </tr>
                </thead>
                <tbody>
                  {teamFixtures.map((f, i) => {
                    const rival = obtenerRivalFixture(f);
                    const cond = obtenerCondicionFixture(f);
                    const local = cond === "V" ? rival : (selectedTeam.name || selectedTeam.nombre || "");
                    const visita = cond === "V" ? (selectedTeam.name || selectedTeam.nombre || "") : rival;
                    const esLocal = cond !== "V";
                    return (
                      <tr key={f?.id || `${i}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FAFB", borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "2px 4px", color: "#6b7280" }}>{obtenerFechaFixture(f)}</td>
                        <td style={{ padding: "2px 4px", textAlign: "center", fontWeight: "bold", color: cond === "L" ? "#10B981" : cond === "V" ? "#1E3A8A" : "#6b7280" }}>{cond}</td>
                        <td style={{ padding: "2px 4px", textAlign: "right", fontWeight: esLocal ? "bold" : "normal" }}>{local}</td>
                        <td style={{ padding: "2px 4px", textAlign: "center", fontWeight: "bold", color: "#1E3A8A" }}>{obtenerHoraFixture(f)}</td>
                        <td style={{ padding: "2px 4px", fontWeight: !esLocal ? "bold" : "normal" }}>{visita}</td>
                        <td style={{ padding: "2px 4px", textAlign: "right", color: "#6b7280", fontSize: "10px" }}>{obtenerCompetenciaFixture(f)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SELECTOR FECHA */}
        <div style={S.dateBar}>
          <span style={{ fontWeight: "bold", marginRight: "4px", color: "#1E3A8A" }}>VER:</span>
          {[["ayer", "◀ AYER"], ["today", "HOY"], ["manana", "MAÑANA ▶"]].map(([v, l]) => (
            <button key={v} onClick={() => setDate(v)} style={date === v ? S.dateBtnActive : S.dateBtn}>{l}</button>
          ))}
        </div>

        {error && <div style={S.errorBox}>⚠ {error}</div>}

        {loading ? (
          <div style={S.loading}>Cargando partidos...</div>
        ) : !hayPartidos ? (
          <div style={S.noMatches}>No hay partidos para esta fecha.</div>
        ) : (
          <div style={S.grid}>
            {data.map((league, li) => {
              const games = Array.isArray(league?.games) ? league.games : [];
              if (games.length === 0) return null;
              const comp = obtenerCompetition(league);
              const nombre = normalizarNombre(league);
              return (
                <div key={league?.key || league?.id || li} style={S.leagueBox}>
                  <div style={S.leagueHead}>
                    <Link href={`/posiciones?competition=${comp}`} style={S.leagueHeadLink}>
                      ▶ {nombre.toUpperCase()}
                    </Link>
                    <span style={{ fontSize: "10px", fontWeight: "normal" }}>{games.length} partidos</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {games.map((game, gi) => {
                        const estado = obtenerEstado(game);
                        const teamA = obtenerEquipo(game, 0);
                        const teamB = obtenerEquipo(game, 1);
                        const scoreA = obtenerScore(game, 0);
                        const scoreB = obtenerScore(game, 1);
                        const global = obtenerGlobal(game);
                        const golesA = obtenerGoles(teamA);
                        const golesB = obtenerGoles(teamB);
                        const rojasA = obtenerTarjetasRojas(teamA);
                        const rojasB = obtenerTarjetasRojas(teamB);
                        const tv = obtenerTV(game);
                        const isLive = estado.tipo === "live";
                        const isFinal = estado.tipo === "final";
                        const rowBg = gi % 2 === 0 ? "#ffffff" : "#F9FAFB";
                        return (
                          <tr key={game?.id || gi} style={{ background: rowBg, borderBottom: "1px solid #e5e7eb" }}>
                            {/* ESTADO */}
                            <td style={{ width: "62px", padding: "2px 3px", textAlign: "center", borderRight: "1px solid #e5e7eb", verticalAlign: "middle" }}>
                              {isLive && <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#10B981", marginRight: "2px", verticalAlign: "middle" }} />}
                              <span style={isLive ? S.statusLive : isFinal ? S.statusFinal : S.statusPending}>
                                {isLive ? `⚽ ${estado.texto}` : estado.texto}
                              </span>
                            </td>
                            {/* PARTIDO */}
                            <td style={{ padding: "2px 4px", verticalAlign: "middle" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", gap: "2px" }}>
                                {/* LOCAL */}
                                <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "2px" }}>
                                  {rojasA > 0 && Array.from({ length: rojasA }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                  {logoEquipo(teamA) && <img src={logoEquipo(teamA)} alt="" width="14" height="14" style={{ objectFit: "contain", verticalAlign: "middle" }} />}
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? "#10B981" : "#111111" }}>{nombreEquipo(teamA)}</span>
                                </div>
                                {/* MARCADOR */}
                                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", color: isLive ? "#10B981" : isFinal ? "#6b7280" : "#111111", whiteSpace: "nowrap" }}>
                                  {scoreA} - {scoreB}
                                </div>
                                {/* VISITANTE */}
                                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                  {logoEquipo(teamB) && <img src={logoEquipo(teamB)} alt="" width="14" height="14" style={{ objectFit: "contain", verticalAlign: "middle" }} />}
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? "#10B981" : "#111111" }}>{nombreEquipo(teamB)}</span>
                                  {rojasB > 0 && Array.from({ length: rojasB }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                </div>
                              </div>
                              {/* GLOBAL */}
                              {global && (
                                <div style={S.globalBadge}>
                                  Global: <strong>{global.scoreA} - {global.scoreB}</strong>
                                </div>
                              )}
                              {/* GOLES */}
                              {(golesA.length > 0 || golesB.length > 0) && (
                                <div style={S.golesRow}>
                                  <div style={{ textAlign: "right", paddingRight: "4px" }}>
                                    {golesA.map((g, k) => (
                                      <span key={k} style={{ marginLeft: "4px" }}>
                                        ⚽ {obtenerNombreGol(g)}{obtenerMinutoGol(g) ? ` ${obtenerMinutoGol(g)}` : ""}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ paddingLeft: "4px" }}>
                                    {golesB.map((g, k) => (
                                      <span key={k} style={{ marginRight: "4px" }}>
                                        ⚽ {obtenerNombreGol(g)}{obtenerMinutoGol(g) ? ` ${obtenerMinutoGol(g)}` : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                            {/* TV */}
                            <td style={{ width: "70px", padding: "2px 3px", textAlign: "right", verticalAlign: "middle", borderLeft: "1px solid #e5e7eb", color: "#6b7280", fontSize: "10px" }}>
                              {tv.map((n, k) => <div key={k}>{n?.name || n?.title || n}</div>)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        <div style={S.footer}>
          ChiquiFútbol &copy; {new Date().getFullYear()} &mdash; Resultados en tiempo real
        </div>
      </div>
    </div>
  );
}
