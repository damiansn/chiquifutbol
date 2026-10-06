"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CompetitionsMenu from "../components/CompetitionsMenu.js";

// ─── PALETA OSCURA ────────────────────────────────────────────────────────────
const C = {
  bg:        "#0f1923",
  surface:   "#1a2535",
  surfaceAlt:"#141e2b",
  border:    "#263244",
  borderSub: "#1e2d3d",
  text:      "#e2e8f0",
  textMuted: "#64748b",
  textDim:   "#94a3b8",
  blue:      "#3b82f6",
  blueNav:   "#1d4ed8",
  green:     "#10b981",
  greenBg:   "rgba(16,185,129,0.08)",
  red:       "#ef4444",
  amber:     "#f59e0b",
  white:     "#f8fafc",
};

const COMPETENCIAS = {
  argentina:        { nombre: "Liga Profesional Argentina",   corto: "Liga Argentina" },
  copa_argentina:   { nombre: "Copa Argentina",               corto: "Copa Argentina" },
  libertadores:     { nombre: "CONMEBOL Copa Libertadores",   corto: "Copa Libertadores" },
  sudamericana:     { nombre: "CONMEBOL Copa Sudamericana",   corto: "Copa Sudamericana" },
  champions:        { nombre: "Champions League",             corto: "Champions League" },
  europa_league:    { nombre: "UEFA Europa League",           corto: "Europa League" },
  conference_league: { nombre: "UEFA Conference League",      corto: "Conference League" },
  primera_nacional: { nombre: "Primera Nacional",             corto: "Primera Nacional" },
  primera_b_metro:  { nombre: "Primera B Metropolitana",      corto: "Primera B Metro" },
  primera_c:        { nombre: "Primera C",                    corto: "Primera C" },
  reserva:          { nombre: "Torneo de Reserva",            corto: "Reserva" },
  colombia:         { nombre: "Liga BetPlay",                 corto: "Colombia" },
  mls:              { nombre: "Major League Soccer",          corto: "MLS" },
  nations_league:   { nombre: "UEFA Nations League",          corto: "Nations League" },
  paraguay:         { nombre: "Copa de Primera",              corto: "Paraguay" },
  mexico:           { nombre: "Liga MX",                      corto: "Liga MX" },
  brasil:           { nombre: "Brasileirao",                  corto: "Brasileirao" },
  chile:            { nombre: "Liga de Primera",          corto: "Chile" },
  uruguay:           { nombre: "Liga AUF Uruguaya",         corto: "Uruguay" },
  premier_league:    { nombre: "Premier League",            corto: "Premier League" },
  efl_cup:           { nombre: "EFL Cup",                   corto: "EFL Cup" },
  fa_cup:            { nombre: "FA Cup",                    corto: "FA Cup" },
  laliga:            { nombre: "LaLiga",                    corto: "LaLiga" },
  copa_del_rey:      { nombre: "Copa del Rey",              corto: "Copa del Rey" },
  supercopa_espana:  { nombre: "Supercopa de España",       corto: "Supercopa ESP" },
  serie_a:           { nombre: "Serie A",                   corto: "Serie A" },
  coppa_italia:      { nombre: "Coppa Italia",              corto: "Coppa Italia" },
  supercoppa_italiana: { nombre: "Supercoppa Italiana",      corto: "Supercoppa ITA" },
  bundesliga:        { nombre: "Bundesliga",                corto: "Bundesliga" },
  dfb_pokal:         { nombre: "DFB Pokal",                 corto: "DFB Pokal" },
  liga_portugal:     { nombre: "Liga Portugal",             corto: "Liga Portugal" },
  ligue_1:           { nombre: "Ligue 1",                   corto: "Ligue 1" },
  coupe_de_france:   { nombre: "Coupe de France",           corto: "Coupe de France" },
  u20_world_cup:     { nombre: "Mundial Sub-20",             corto: "Mundial Sub-20" },
  copa_america:      { nombre: "Copa América",               corto: "Copa América" },
  eliminatorias_conmebol: { nombre: "Eliminatorias CONMEBOL", corto: "Elim. CONMEBOL" },
  eliminatorias_uefa:     { nombre: "Eliminatorias UEFA",     corto: "Elim. UEFA" },
  eliminatorias_concacaf: { nombre: "Eliminatorias CONCACAF", corto: "Elim. CONCACAF" },
  euro:              { nombre: "Eurocopa",                   corto: "Eurocopa" },
  repechaje_mundial: { nombre: "Repechaje Mundial",          corto: "Repechaje" }
};

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function obtenerValor(fila, key) {
  if (!fila || !Array.isArray(fila.values)) return "";
  return fila.values.find(v => v.key === key)?.value ?? "";
}

function obtenerNombreEquipo(fila) {
  return fila?.entity?.object?.name || fila?.entity?.object?.short_name || "Equipo";
}

function obtenerColorEquipo(fila) {
  return fila?.entity?.object?.colors?.color || C.border;
}

function obtenerScore(score) {
  if (score === null || score === undefined) return null;
  const n = Number(score);
  return Number.isFinite(n) ? n : null;
}

function formatearFechaHora(raw) {
  if (!raw) return "";
  const m = String(raw).match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return raw;
  let h = parseInt(m[4], 10) + 2;
  let d = m[1], mo = m[2];
  if (h >= 24) { h -= 24; }
  return `${d}/${mo} ${String(h).padStart(2,"0")}:${m[5]}`;
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function Navbar({ competition }) {
  return (
    <nav style={{ background: C.blueNav, borderBottom: "2px solid #1e3a8a" }}>
      <div className="standings-navbar-inner" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center" }}>
        <Link href="/" className="standings-home-link" aria-label="ChiquiFútbol, inicio" style={{ color: C.white, fontWeight: "bold", fontSize: 14, padding: "4px 12px", textDecoration: "none", borderRight: "1px solid #2563eb", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="Secanuca"
            style={{ height: "42px", width: "auto", objectFit: "contain", display: "block" }}
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        </Link>
        <CompetitionsMenu compact activeCompetition={competition} />
        <Link href="/arbitros" className="standings-referee-link" style={{ color: "#bfdbfe", fontSize: 11, padding: "7px 10px", textDecoration: "none", borderRight: "1px solid #2563eb", marginLeft: "auto" }}>
          ÁRBITROS
        </Link>
      </div>
    </nav>
  );
}

// ─── TABLA DE POSICIONES ──────────────────────────────────────────────────────

function TablaPosiciones({ item }) {
  const { torneo, grupo, table } = item;
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows    = Array.isArray(table.rows)    ? table.rows    : [];

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 4, overflow: "hidden" }}>
      {torneo && (
        <div style={{ background: C.surfaceAlt, color: C.textMuted, padding: "2px 8px", fontSize: 10, borderBottom: `1px solid ${C.border}` }}>
          {torneo}
        </div>
      )}
      <div style={{ background: C.blueNav, color: C.white, padding: "4px 8px", fontSize: 11, fontWeight: "bold" }}>
        {grupo || "Tabla de posiciones"}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 300 }}>
          <thead>
            <tr style={{ background: C.surfaceAlt }}>
              <th style={thS}>#</th>
              <th style={{ ...thS, textAlign: "left", minWidth: 120 }}>Equipo</th>
              {columns.map(c => (
                <th key={c.key} style={{ ...thS, fontWeight: c.is_bold ? 900 : 700 }}>{c.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((fila, i) => {
              const nombre = obtenerNombreEquipo(fila);
              const color  = obtenerColorEquipo(fila);
              const pos    = fila.num ?? i + 1;
              return (
                <tr key={`${nombre}-${i}`} style={{ background: i % 2 === 0 ? C.surface : C.surfaceAlt, borderBottom: `1px solid ${C.borderSub}` }}>
                  <td style={tdCenterS}>{pos}</td>
                  <td style={{ ...tdLeftS, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }} />
                    {nombre}
                  </td>
                  {columns.map(c => {
                    const v = obtenerValor(fila, c.key);
                    return (
                      <td key={c.key} style={{ ...tdCenterS, fontWeight: c.is_bold ? 800 : 400, color: c.is_bold ? C.white : C.textDim }}>
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

const thS = {
  padding: "4px 6px", fontSize: 10, fontWeight: 700, textAlign: "center",
  color: C.textMuted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
};
const tdCenterS = {
  padding: "4px 6px", fontSize: 11, textAlign: "center",
  color: C.textDim, whiteSpace: "nowrap", verticalAlign: "middle",
};
const tdLeftS = {
  padding: "4px 8px", fontSize: 11, textAlign: "left",
  color: C.text, whiteSpace: "nowrap", verticalAlign: "middle",
};

// ─── BRACKET HORIZONTAL POR FASES ────────────────────────────────────────────
//
// Estructura esperada de Promiedos:
//   stage.name  → "Octavos de Final", "Cuartos de Final", etc.
//   stage.groups[] → cada llave/serie
//     group.participants[] → los dos equipos
//     group.games[]        → partidos (ida + vuelta)
//     group.games[].scores → [golesLocal, golesVisitante]
//     group.games[].winner / to_qualify → clasificado

function calcularGlobales(participants, games) {
  const g = {};
  participants.forEach(p => { if (p?.id) g[p.id] = 0; });
  games.forEach(game => {
    const ts = Array.isArray(game?.teams)  ? game.teams  : [];
    const sc = Array.isArray(game?.scores) ? game.scores : [];
    ts.forEach((t, i) => {
      if (!t?.id) return;
      const s = obtenerScore(sc[i]);
      if (s === null) return;
      if (g[t.id] === undefined) g[t.id] = 0;
      g[t.id] += s;
    });
  });
  return g;
}

function detectarClasificado(participants, games) {
  for (const game of games) {
    if (game?.to_qualify && Array.isArray(game.teams)) {
      const idx = Number(game.to_qualify) - 1;
      if (idx >= 0 && game.teams[idx]) return game.teams[idx].id;
    }
  }
  if (games.length === 1) {
    const game = games[0];
    if (game?.winner && Array.isArray(game.teams)) {
      const idx = Number(game.winner) - 1;
      if (idx >= 0 && game.teams[idx]) return game.teams[idx].id;
    }
  }
  return null;
}

function LlaveCard({ group }) {
  const participants = Array.isArray(group?.participants) ? group.participants : [];
  const games        = Array.isArray(group?.games)        ? group.games        : [];
  const esSerie      = games.length > 1;
  const qualifiedId  = detectarClasificado(participants, games);
  const globales     = calcularGlobales(participants, games);
  const hayGlobal    = esSerie && games.some(g =>
    Array.isArray(g?.scores) && g.scores.some(s => obtenerScore(s) !== null)
  );

  return (
    <div style={{
      background: C.surfaceAlt,
      border: `1px solid ${qualifiedId ? C.green : C.border}`,
      minWidth: 180, maxWidth: 240, flex: "0 0 auto",
    }}>
      {/* EQUIPOS + GLOBAL */}
      {participants.map((p, i) => {
        const clasif  = qualifiedId === p.id;
        const global  = globales[p.id] ?? 0;
        return (
          <div key={p.id || i} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 7px",
            background: clasif ? C.greenBg : "transparent",
            borderBottom: i === 0 ? `1px solid ${C.borderSub}` : "none",
          }}>
            <span style={{ color: C.textMuted, fontSize: 9, width: 10 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: clasif ? 700 : 400, color: clasif ? C.white : C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.short_name || p.name || "—"}
            </span>
            {esSerie && hayGlobal && (
              <span style={{ fontSize: 12, fontWeight: 800, color: clasif ? C.green : C.textMuted, minWidth: 16, textAlign: "right" }}>
                {global}
              </span>
            )}
            {clasif && (
              <span style={{ color: C.green, fontSize: 9, fontWeight: 900, marginLeft: 2 }}>✓</span>
            )}
          </div>
        );
      })}

      {/* PARTIDOS */}
      {games.map((game, gi) => {
        const teams  = Array.isArray(game?.teams)  ? game.teams  : [];
        const scores = Array.isArray(game?.scores) ? game.scores : [];
        const label  = esSerie ? (gi === 0 ? "IDA" : gi === 1 ? "VUELTA" : `P${gi+1}`) : "";
        return (
          <div key={game?.id || gi} style={{ borderTop: `1px solid ${C.border}`, margin: "0 4px 4px", background: C.surface }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 5px", background: C.surfaceAlt, borderBottom: `1px solid ${C.borderSub}` }}>
              {label && <span style={{ fontSize: 9, fontWeight: 900, color: C.blue, letterSpacing: 0.5 }}>{label}</span>}
              {game?.start_time && <span style={{ fontSize: 9, color: C.textMuted }}>{formatearFechaHora(game.start_time)}</span>}
            </div>
            {teams.map((team, ti) => {
              const score     = scores[ti] ?? "–";
              const esGanador = game?.winner === ti + 1;
              const clasifica = game?.to_qualify === ti + 1;
              return (
                <div key={team?.id || ti} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "2px 5px",
                  background: esGanador ? C.greenBg : "transparent",
                  borderBottom: ti === 0 ? `1px solid ${C.borderSub}` : "none",
                }}>
                  <span style={{ flex: 1, fontSize: 11, color: esGanador ? C.white : C.textDim, fontWeight: esGanador ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {team?.short_name || team?.name || "—"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: esGanador ? C.green : C.textMuted, minWidth: 14, textAlign: "right" }}>
                    {score}
                  </span>
                  {clasifica && <span style={{ color: C.green, fontSize: 9 }}>✓</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function StageBracket({ stage }) {
  const groups = Array.isArray(stage?.groups) ? stage.groups : [];
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 6, overflow: "hidden" }}>
      {/* CABECERA DE FASE */}
      <div style={{ background: C.blueNav, color: C.white, padding: "4px 8px", fontSize: 11, fontWeight: "bold" }}>
        {stage.name}
      </div>
      {/* LLAVES EN SCROLL HORIZONTAL */}
      <div style={{ overflowX: "auto", padding: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {groups.map((g, i) => (
            <LlaveCard
              key={`${g?.participants?.map(p => p.id).join("-") || "llave"}-${i}`}
              group={g}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ESTADÍSTICAS DE JUGADORES ────────────────────────────────────────────────

function EstadisticasJugadores({ tabla }) {
  const rows = Array.isArray(tabla?.rows) ? tabla.rows : [];
  if (rows.length === 0) return null;
  const mapaEquipos = tabla?._mapaEquipos || {};

  const keys = [];
  rows.forEach(row => {
    if (!Array.isArray(row?.values)) return;
    row.values.forEach(v => { if (v?.key && !keys.includes(v.key)) keys.push(v.key); });
  });

  function obtenerEquipoJugador(row) {
    const j = row?.entity?.object;
    // 1. team_name ya resuelto en el sync
    const opts = [
      row?.team_name,
      j?.team_name,
      j?.club_name,
      j?.team?.name,
      j?.team?.short_name,
      j?.club?.name,
      j?.club?.short_name,
      row?.team?.name,
      row?.team?.short_name,
    ];
    for (const o of opts) { if (o && typeof o === "string") return o; }
    // 2. Resolver por team_id usando el mapa construido en cliente
    const tid = j?.team_id || j?.teamId || row?.team_id || row?.teamId;
    if (tid && mapaEquipos[tid]) return mapaEquipos[tid];
    // 3. Buscar en entities secundarias
    if (Array.isArray(row?.entities)) {
      for (const e of row.entities) {
        const n = e?.object?.name || e?.object?.short_name || e?.name;
        if (n && e?.object?.id !== j?.id) return n;
      }
    }
    return "–";
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 4, overflow: "hidden" }}>
      <div style={{ background: C.blueNav, color: C.white, padding: "4px 8px", fontSize: 11, fontWeight: "bold" }}>
        {tabla.name || "Estadísticas"}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.surfaceAlt }}>
              <th style={thS}>#</th>
              <th style={{ ...thS, textAlign: "left" }}>Jugador</th>
              <th style={{ ...thS, textAlign: "left" }}>Equipo</th>
              {keys.map(k => <th key={k} style={thS}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const j      = row?.entity?.object;
              const nombre = j?.name || "Jugador";
              const equipo = obtenerEquipoJugador(row);
              return (
                <tr key={j?.id || j?.name || `j-${i}`} style={{ background: i % 2 === 0 ? C.surface : C.surfaceAlt, borderBottom: `1px solid ${C.borderSub}` }}>
                  <td style={tdCenterS}>{row?.num ?? i + 1}</td>
                  <td style={{ ...tdLeftS, fontWeight: 700, color: C.white }}>{nombre}</td>
                  <td style={{ ...tdLeftS, color: C.textMuted }}>{equipo}</td>
                  {keys.map(k => {
                    const v = row?.values?.find(vv => vv.key === k)?.value ?? "–";
                    return <td key={k} style={tdCenterS}>{Array.isArray(v) ? v.join(" ") : v}</td>;
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

// ─── CONTENIDO PRINCIPAL ──────────────────────────────────────────────────────

function PosicionesContent() {
  const searchParams = useSearchParams();
  const competition  = searchParams.get("competition") || "argentina";
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const reqRef = useRef(0);
  const [roundFilters, setRoundFilters] = useState([]);
  const [selectedRound, setSelectedRound] = useState("");
  const [roundGames, setRoundGames] = useState([]);
  const [roundLoading, setRoundLoading] = useState(true);
  const [roundError, setRoundError] = useState("");
  const roundRequestRef = useRef(0);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      const rid = ++reqRef.current;
      try {
        setLoading(true); setError("");
        const res  = await fetch(`/api/standings?competition=${encodeURIComponent(competition)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudieron obtener los datos.");
        const json = await res.json();
        if (cancelado || rid !== reqRef.current) return;
        setData(json);
      } catch (err) {
        if (cancelado || rid !== reqRef.current) return;
        setError(err?.message || "Error al cargar los datos.");
      } finally {
        if (!cancelado && rid === reqRef.current) setLoading(false);
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [competition]);

  useEffect(() => {
    if (competition !== "argentina") {
      roundRequestRef.current += 1;
      return undefined;
    }

    const controller = new AbortController();
    const requestId = ++roundRequestRef.current;
    async function cargarFecha(round) {
      setRoundLoading(true);
      setRoundError("");
      try {
        const query = round ? `?round=${encodeURIComponent(round)}` : "";
        const response = await fetch(`/api/league-fixtures${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudieron cargar los partidos.");
        if (controller.signal.aborted || requestId !== roundRequestRef.current) return;
        setRoundFilters(result.filters);
        setSelectedRound(result.selectedRound);
        setRoundGames(result.games);
      } catch (requestError) {
        if (!controller.signal.aborted && requestId === roundRequestRef.current) {
          setRoundError(requestError.message || "Error al cargar los partidos de la fecha.");
        }
      } finally {
        if (!controller.signal.aborted && requestId === roundRequestRef.current) setRoundLoading(false);
      }
    }

    cargarFecha("");
    return () => {
      controller.abort();
      if (requestId === roundRequestRef.current) roundRequestRef.current += 1;
    };
  }, [competition]);

  async function cambiarFecha(round) {
    if (round === selectedRound && roundFilters.length > 0) return;
    const requestId = ++roundRequestRef.current;
    setRoundLoading(true);
    setRoundError("");
    try {
      const query = round ? `?round=${encodeURIComponent(round)}` : "";
      const response = await fetch(`/api/league-fixtures${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los partidos.");
      if (requestId !== roundRequestRef.current) return;
      setRoundFilters(result.filters);
      setSelectedRound(result.selectedRound);
      setRoundGames(result.games);
    } catch (requestError) {
      if (requestId === roundRequestRef.current) {
        setRoundError(requestError.message || "Error al cargar los partidos de la fecha.");
      }
    } finally {
      if (requestId === roundRequestRef.current) setRoundLoading(false);
    }
  }

  const compConfig = COMPETENCIAS[competition] || { nombre: data?.league?.name || "Competencia", corto: "Competencia" };

  function obtenerTablas() {
    if (!data) return [];
    const res = [];
    if (Array.isArray(data.tables)) {
      data.tables.forEach(t => {
        if (!Array.isArray(t?.tables)) return;
        t.tables.forEach(g => {
          if (!g?.table || !Array.isArray(g.table.rows)) return;
          res.push({ torneo: t.name || "", grupo: g.name || "", table: g.table });
        });
      });
    }
    if (Array.isArray(data.tables_groups)) {
      data.tables_groups.forEach(gc => {
        if (!Array.isArray(gc?.tables)) return;
        gc.tables.forEach(tg => {
          if (!tg?.table || !Array.isArray(tg.table.rows)) return;
          if (res.some(it => it.torneo === (gc.name||"") && it.grupo === (tg.name||"") && it.table === tg.table)) return;
          res.push({ torneo: gc.name || "", grupo: tg.name || "", table: tg.table });
        });
      });
    }
    return res;
  }

  function obtenerBrackets() {
    if (!data?.brackets || !Array.isArray(data.brackets.stages)) return [];
    return data.brackets.stages.filter(s => Array.isArray(s?.groups) && s.groups.length > 0);
  }

  function obtenerMapaEquipos() {
    const mapa = {};
    function add(id, name) { if (id && name && !mapa[id]) mapa[id] = name; }
    for (const t of (data?.tables || [])) {
      for (const g of (t?.tables || [])) {
        for (const row of (g?.table?.rows || [])) {
          const obj = row?.entity?.object;
          if (obj?.id && obj?.name) add(obj.id, obj.name);
        }
      }
    }
    for (const gc of (data?.tables_groups || [])) {
      for (const tg of (gc?.tables || [])) {
        for (const row of (tg?.table?.rows || [])) {
          const obj = row?.entity?.object;
          if (obj?.id && obj?.name) add(obj.id, obj.name);
        }
      }
    }
    for (const game of (data?.games || [])) {
      for (const team of (game?.teams || [])) {
        if (team?.id && team?.name) add(team.id, team.name);
      }
    }
    for (const stage of (data?.brackets?.stages || [])) {
      for (const group of (stage?.groups || [])) {
        for (const p of (group?.participants || [])) {
          if (p?.id && p?.name) add(p.id, p.name);
        }
        for (const game of (group?.games || [])) {
          for (const team of (game?.teams || [])) {
            if (team?.id && team?.name) add(team.id, team.name);
          }
        }
      }
    }
    return mapa;
  }

  function obtenerEstadisticas() {
    if (!data?.players_statistics || !Array.isArray(data.players_statistics.tables)) return [];
    const mapaEquipos = obtenerMapaEquipos();
    return data.players_statistics.tables.map(t => ({ ...t, _mapaEquipos: mapaEquipos }));
  }

  const wrapStyle = { maxWidth: 1000, margin: "0 auto", padding: "6px 4px", background: C.bg, minHeight: "100vh" };
  const sectionTitleStyle = { fontSize: 11, fontWeight: 800, color: C.blue, borderBottom: `1px solid ${C.border}`, paddingBottom: 3, marginBottom: 5, marginTop: 10, letterSpacing: 0.5 };
  const roundNavButtonStyle = { border: `1px solid ${C.border}`, background: C.surface, color: C.white, width: 30, height: 30, fontSize: 20, lineHeight: 1, cursor: "pointer" };
  const roundSelectStyle = { flex: 1, minWidth: 0, height: 30, border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: "0 8px", fontSize: 11 };

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Navbar competition={competition} />
      <div style={wrapStyle}>
        <div style={{ padding: 30, textAlign: "center", color: C.textMuted, fontSize: 12 }}>Cargando posiciones...</div>
      </div>
    </div>
  );

  const tablas       = obtenerTablas();
  const brackets     = obtenerBrackets();
  const estadisticas = obtenerEstadisticas();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: 11, color: C.text }}>
      <Navbar competition={competition} />
      <div style={wrapStyle}>

        {/* BREADCRUMB */}
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5 }}>
          <Link href="/" style={{ color: C.blue, textDecoration: "underline" }}>Inicio</Link>
          {" › "}
          <span>Posiciones</span>
          {" › "}
          <strong style={{ color: C.textDim }}>{compConfig.corto}</strong>
        </div>

        {/* TÍTULO */}
        <div style={{ fontSize: 13, fontWeight: 800, color: C.white, borderBottom: `2px solid ${C.blueNav}`, paddingBottom: 4, marginBottom: 6 }}>
          {(data?.league?.name || compConfig.nombre).toUpperCase()}
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.red}`, color: C.red, padding: "5px 8px", fontSize: 11, marginBottom: 6 }}>
            ⚠ {error}
          </div>
        )}

        {competition === "argentina" && (
          <section style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 8 }}>
            <div style={{ background: C.blueNav, color: C.white, padding: "5px 8px", fontSize: 11, fontWeight: "bold" }}>
              TEMPORADA
            </div>
            {roundFilters.length > 0 && (() => {
              const activeRoundIndex = roundFilters.findIndex(filter => filter.key === selectedRound);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px", background: C.surfaceAlt }}>
                  <button
                    type="button"
                    onClick={() => cambiarFecha(roundFilters[activeRoundIndex - 1]?.key)}
                    disabled={activeRoundIndex <= 0 || roundLoading}
                    aria-label="Fecha anterior"
                    style={{ ...roundNavButtonStyle, opacity: activeRoundIndex <= 0 ? 0.45 : 1 }}
                  >
                    ‹
                  </button>
                  <select
                    aria-label="Seleccionar fecha del torneo"
                    value={selectedRound}
                    onChange={event => cambiarFecha(event.target.value)}
                    disabled={roundLoading}
                    style={roundSelectStyle}
                  >
                    {roundFilters.map(filter => (
                      <option key={filter.key} value={filter.key}>{filter.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => cambiarFecha(roundFilters[activeRoundIndex + 1]?.key)}
                    disabled={activeRoundIndex < 0 || activeRoundIndex >= roundFilters.length - 1 || roundLoading}
                    aria-label="Fecha siguiente"
                    style={{ ...roundNavButtonStyle, opacity: activeRoundIndex >= roundFilters.length - 1 ? 0.45 : 1 }}
                  >
                    ›
                  </button>
                </div>
              );
            })()}
            {roundError ? (
              <div style={{ color: C.red, padding: "8px" }} role="alert">
                {roundError}{" "}
                <button type="button" onClick={() => cambiarFecha(selectedRound)} style={{ color: C.blue, background: "none", border: 0, cursor: "pointer", textDecoration: "underline" }}>
                  Reintentar
                </button>
              </div>
            ) : roundLoading ? (
              <div style={{ color: C.textMuted, padding: "12px", textAlign: "center" }}>Cargando partidos...</div>
            ) : roundFilters.length === 0 ? (
              <div style={{ color: C.textMuted, padding: "12px", textAlign: "center" }}>
                No hay fechas disponibles.{" "}
                <button type="button" onClick={() => cambiarFecha("")} style={{ color: C.blue, background: "none", border: 0, cursor: "pointer", textDecoration: "underline" }}>
                  Reintentar
                </button>
              </div>
            ) : roundGames.length === 0 ? (
              <div style={{ color: C.textMuted, padding: "12px", textAlign: "center" }}>No hay partidos para esta fecha.</div>
            ) : (
              <div>
                {roundGames.map((game, index) => {
                  const teams = Array.isArray(game?.teams) ? game.teams : [];
                  const scores = Array.isArray(game?.scores) ? game.scores : [];
                  const matchTime = formatearFechaHora(game?.start_time);
                  return (
                    <a
                      key={game?.id || index}
                      href={game?.id && game?.url_name ? `https://www.promiedos.com.ar/game/${game.url_name}/${game.id}` : undefined}
                      target={game?.id && game?.url_name ? "_blank" : undefined}
                      rel={game?.id && game?.url_name ? "noreferrer" : undefined}
                      style={{ display: "grid", gridTemplateColumns: "76px minmax(0, 1fr) auto", alignItems: "center", gap: 8, padding: "7px 9px", color: C.text, textDecoration: "none", background: index % 2 === 0 ? C.surface : C.surfaceAlt, borderTop: `1px solid ${C.borderSub}` }}
                    >
                      <span style={{ color: C.textMuted, fontSize: 10 }}>{matchTime || game?.game_time_to_display || ""}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teams[0]?.short_name || teams[0]?.name || "—"}</span>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teams[1]?.short_name || teams[1]?.name || "—"}</span>
                      </span>
                      <span style={{ textAlign: "right", fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap" }}>
                        {scores.length >= 2 ? `${scores[0]} - ${scores[1]}` : game?.status?.short_name || "—"}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TABLAS DE POSICIONES */}
        {tablas.length > 0 && (
          <>
            <div style={sectionTitleStyle}>▶ TABLAS DE POSICIONES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 6, alignItems: "start" }}>
              {tablas.map((item, i) => (
                <TablaPosiciones key={`${item.torneo}-${item.grupo}-${i}`} item={item} />
              ))}
            </div>
          </>
        )}

        {/* ELIMINATORIAS */}
        {brackets.length > 0 && (
          <>
            <div style={sectionTitleStyle}>▶ ELIMINATORIAS</div>
            {brackets.map((stage, i) => (
              <StageBracket key={`${stage.name}-${i}`} stage={stage} />
            ))}
          </>
        )}

        {/* ESTADÍSTICAS */}
        {estadisticas.length > 0 && (
          <>
            <div style={sectionTitleStyle}>▶ ESTADÍSTICAS DE JUGADORES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {estadisticas.map((tabla, i) => (
                <EstadisticasJugadores key={`${tabla.name || "t"}-${i}`} tabla={tabla} />
              ))}
            </div>
          </>
        )}

        {tablas.length === 0 && brackets.length === 0 && estadisticas.length === 0 && !error && (
          <div style={{ padding: 20, textAlign: "center", color: C.textMuted, border: `1px solid ${C.border}`, fontSize: 12 }}>
            No hay información disponible para esta competencia.
          </div>
        )}

        <div style={{ borderTop: `1px solid ${C.border}`, padding: "6px 0", textAlign: "center", color: C.textMuted, fontSize: 10, marginTop: 10 }}>
          ChiquiFútbol &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export default function PosicionesPage() {
  return (
    <Suspense fallback={
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
        <div style={{ background: C.blueNav, padding: "7px 12px", color: C.white, fontWeight: "bold", fontSize: 14 }}>⚽ ChiquiFútbol</div>
        <div style={{ padding: 30, textAlign: "center", color: C.textMuted, fontSize: 12 }}>Cargando...</div>
      </div>
    }>
      <PosicionesContent />
    </Suspense>
  );
}
