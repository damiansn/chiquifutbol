"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

// ─── PALETA (misma que posiciones) ───────────────────────────────────────────
const C = {
  bg:         "#0f1923",
  surface:    "#1a2535",
  surfaceAlt: "#141e2b",
  border:     "#263244",
  borderSub:  "#1e2d3d",
  text:       "#e2e8f0",
  textMuted:  "#64748b",
  textDim:    "#94a3b8",
  blue:       "#3b82f6",
  blueNav:    "#1d4ed8",
  green:      "#10b981",
  greenBg:    "rgba(16,185,129,0.08)",
  red:        "#ef4444",
  amber:      "#f59e0b",
  white:      "#f8fafc",
};

const S = {
  page:          { background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: "11px" },
  navbar:        { background: C.blueNav, padding: "0", borderBottom: "2px solid #1e3a8a" },
  navInner:      { maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center" },
  navLogo:       { color: C.white, fontWeight: "bold", fontSize: "14px", padding: "7px 12px", textDecoration: "none", borderRight: "1px solid #2563eb", whiteSpace: "nowrap" },
  navLink:       { color: "#bfdbfe", fontSize: "11px", padding: "7px 10px", textDecoration: "none", borderRight: "1px solid #2563eb", display: "inline-block" },
  navLinkActive: { color: C.white, background: "#1e3a8a", fontWeight: "bold" },
  wrap:          { maxWidth: "1000px", margin: "0 auto", padding: "4px", background: C.bg },
  topBar:        { background: C.surface, color: C.text, fontSize: "10px", padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` },
  dateBar:       { display: "flex", gap: "3px", alignItems: "center", padding: "4px 6px", borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt },
  dateBtn:       { background: C.surface, border: `1px solid ${C.border}`, color: C.textDim, padding: "2px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  dateBtnActive: { background: C.blueNav, border: `1px solid ${C.blue}`, color: C.white, padding: "2px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  grid:          { display: "flex", flexDirection: "column" },
  leagueBox:     { border: `1px solid ${C.border}`, borderTop: "none", background: C.surface },
  leagueHead:    { background: C.blueNav, color: C.white, padding: "4px 8px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  leagueHeadLink:{ color: C.white, textDecoration: "none", fontWeight: "bold", fontSize: "11px" },
  statusLive:    { color: C.green, fontWeight: "bold", fontSize: "10px" },
  statusFinal:   { color: C.red, fontSize: "10px" },
  statusPending: { color: C.amber, fontSize: "10px" },
  golesRow:      { display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "10px", color: C.textMuted, marginTop: "2px" },
  globalBadge:   { fontSize: "10px", color: C.textMuted, textAlign: "center", borderTop: `1px solid ${C.borderSub}`, padding: "2px 0" },
  redCard:       { display: "inline-block", width: "6px", height: "9px", background: C.red, marginLeft: "2px", verticalAlign: "middle" },
  searchWrap:    { position: "relative", display: "inline-block" },
  searchInput:   { background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, padding: "3px 7px", fontSize: "11px", width: "190px", outline: "none" },
  dropdown:      { position: "absolute", top: "100%", left: 0, zIndex: 100, background: C.surface, border: `1px solid ${C.border}`, width: "220px", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" },
  dropdownItem:  { padding: "5px 8px", cursor: "pointer", borderBottom: `1px solid ${C.borderSub}`, fontSize: "11px", color: C.text, background: "none", border: "none", width: "100%", textAlign: "left", display: "block" },
  fixtureBox:    { border: `1px solid ${C.border}`, borderTop: "none", background: C.surface },
  fixtureHead:   { background: C.amber, color: "#111111", padding: "3px 8px", fontSize: "11px", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn:      { background: C.red, border: "none", color: C.white, padding: "1px 6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" },
  errorBox:      { background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "4px 8px", fontSize: "11px", marginBottom: "4px" },
  loading:       { padding: "16px", textAlign: "center", color: C.textMuted, fontSize: "11px" },
  noMatches:     { padding: "16px", textAlign: "center", color: C.textMuted, border: `1px solid ${C.border}`, fontSize: "11px" },
  footer:        { borderTop: `1px solid ${C.border}`, padding: "6px", textAlign: "center", color: C.textMuted, fontSize: "10px" },
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

function escudoLocal(team) {
  const remoto = logoEquipo(team);
  if (remoto) return remoto;
  const nombre = nombreEquipo(team);
  if (!nombre || nombre === "Equipo") return null;
  const slug = nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/escudos/${slug}.png`;
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
  // start_time viene como "DD-MM-YYYY HH:MM" con 2hs menos que Argentina
  if (game?.start_time) {
    const txt = String(game.start_time).trim();
    const m = txt.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) {
      const dia = m[1], mes = m[2], anio = m[3], min = m[5];
      let hora = parseInt(m[4], 10) + 2;
      let diaFinal = dia, mesFinal = mes, anioFinal = anio;
      if (hora >= 24) {
        hora -= 24;
        // avanzar un día
        const d = new Date(`${anio}-${mes}-${dia}`);
        d.setDate(d.getDate() + 1);
        diaFinal = String(d.getDate()).padStart(2, "0");
        mesFinal = String(d.getMonth() + 1).padStart(2, "0");
        anioFinal = String(d.getFullYear());
      }
      const horaStr = String(hora).padStart(2, "0");
      // comparar con hoy en Argentina
      const hoy = {};
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(new Date()).forEach(p => { hoy[p.type] = p.value; });
      const esHoy = diaFinal === hoy.day && mesFinal === hoy.month && anioFinal === hoy.year;
      if (!esHoy) return `${diaFinal}/${mesFinal} ${horaStr}:${min}`;
      return `${horaStr}:${min}`;
    }
  }
  const hora = formatearHoraArgentina(game);
  if (hora && hora !== "--:--") return hora;
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
  const hora = formatearHora(game);
  if (hora && hora !== "--:--") return { texto: hora, tipo: "pending" };
  const d = obtenerFechaObjeto(game);
  if (d) {
    try {
      const txt = d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
      if (txt) return { texto: txt, tipo: "pending" };
    } catch {}
  }
  return { texto: "Prog.", tipo: "pending" };
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

function EscudoImg({ team }) {
  const src = escudoLocal(team);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width="16"
      height="16"
      style={{ objectFit: "contain", verticalAlign: "middle", flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  );
}

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
                  <tr style={{ background: C.surfaceAlt }}>
                    <th style={{ padding: "3px 5px", textAlign: "left", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "50px" }}>Fecha</th>
                    <th style={{ padding: "3px 5px", textAlign: "center", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "20px" }}>L/V</th>
                    <th style={{ padding: "3px 5px", textAlign: "right", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Local</th>
                    <th style={{ padding: "3px 5px", textAlign: "center", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10, width: "50px" }}>Hora</th>
                    <th style={{ padding: "3px 5px", textAlign: "left", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Visitante</th>
                    <th style={{ padding: "3px 5px", textAlign: "right", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontSize: 10 }}>Competencia</th>
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
                      <tr key={f?.id || `${i}`} style={{ background: i % 2 === 0 ? C.surface : C.surfaceAlt, borderBottom: `1px solid ${C.borderSub}` }}>
                        <td style={{ padding: "3px 5px", color: C.textMuted }}>{obtenerFechaFixture(f)}</td>
                        <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: "bold", color: cond === "L" ? C.green : cond === "V" ? C.blue : C.textMuted }}>{cond}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", fontWeight: esLocal ? "bold" : "normal", color: esLocal ? C.white : C.textDim }}>{local}</td>
                        <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: "bold", color: C.amber }}>{obtenerHoraFixture(f)}</td>
                        <td style={{ padding: "3px 5px", fontWeight: !esLocal ? "bold" : "normal", color: !esLocal ? C.white : C.textDim }}>{visita}</td>
                        <td style={{ padding: "3px 5px", textAlign: "right", color: C.textMuted, fontSize: "10px" }}>{obtenerCompetenciaFixture(f)}</td>
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
          <span style={{ fontWeight: "bold", marginRight: "4px", color: C.textMuted, fontSize: "10px" }}>VER:</span>
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
            <div style={{ borderTop: `1px solid ${C.border}` }} />
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
                        const rowBg = gi % 2 === 0 ? C.surface : C.surfaceAlt;
                        return (
                          <tr key={game?.id || gi} style={{ background: rowBg, borderBottom: "1px solid #e5e7eb" }}>
                            {/* ESTADO */}
                            <td style={{ width: "72px", minWidth: "72px", maxWidth: "72px", padding: "4px 3px", textAlign: "center", borderRight: `1px solid ${C.borderSub}`, verticalAlign: "middle" }}>
                              {isLive && <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: C.green, marginRight: "2px", verticalAlign: "middle" }} />}
                              <span style={isLive ? S.statusLive : isFinal ? S.statusFinal : S.statusPending}>
                                {isLive ? `⚽ ${estado.texto}` : estado.texto}
                              </span>
                            </td>
                            {/* PARTIDO */}
                            <td style={{ padding: "4px 6px", verticalAlign: "middle" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", alignItems: "center", gap: "2px" }}>
                                {/* LOCAL */}
                                <div style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "3px" }}>
                                  {rojasA > 0 && Array.from({ length: rojasA }).map((_, k) => <span key={k} style={S.redCard} title="Tarjeta roja" />)}
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text }}>{nombreEquipo(teamA)}</span>
                                  <EscudoImg team={teamA} />
                                </div>
                                {/* MARCADOR */}
                                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", color: isLive ? C.green : isFinal ? C.textMuted : C.white, whiteSpace: "nowrap" }}>
                                  {scoreA} - {scoreB}
                                </div>
                                {/* VISITANTE */}
                                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                  <EscudoImg team={teamB} />
                                  <span style={{ fontWeight: "bold", fontSize: "11px", color: isLive ? C.green : C.text }}>{nombreEquipo(teamB)}</span>
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
                            <td style={{ width: "90px", minWidth: "90px", maxWidth: "90px", padding: "4px 5px", textAlign: "right", verticalAlign: "middle", borderLeft: `1px solid ${C.borderSub}`, color: C.textMuted, fontSize: "10px", lineHeight: "1.4" }}>
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
