"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CompetitionsMenu from "../components/CompetitionsMenu.js";

const colors = {
  bg: "#0f1923",
  surface: "#1a2535",
  surfaceAlt: "#141e2b",
  border: "#263244",
  borderSub: "#1e2d3d",
  text: "#e2e8f0",
  muted: "#94a3b8",
  blue: "#3b82f6",
  blueDark: "#1d4ed8",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  white: "#f8fafc",
};

const controlStyle = {
  width: "100%",
  minHeight: "40px",
  padding: "8px 10px",
  color: colors.text,
  background: colors.surfaceAlt,
  border: `1px solid ${colors.border}`,
  borderRadius: "4px",
  fontSize: "14px",
};
const EMPTY_TEAMS = [];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default function RefereesPage() {
  const [options, setOptions] = useState({ referees: [], seasons: [], teamsByReferee: {}, matchCount: 0 });
  const [refereeText, setRefereeText] = useState("");
  const [teamText, setTeamText] = useState("");
  const [selectedReferee, setSelectedReferee] = useState("");
  const [showRefereeList, setShowRefereeList] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [season, setSeason] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/referees?action=options", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudieron cargar los árbitros.");
        setOptions(result);
      })
      .catch(requestError => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setLoadingOptions(false));
    return () => controller.abort();
  }, []);

  const refereeSuggestions = useMemo(() => {
    const query = normalize(refereeText);
    if (!query || selectedReferee) return [];
    return options.referees.filter(name => normalize(name).includes(query)).slice(0, 8);
  }, [options.referees, refereeText, selectedReferee]);

  const visibleReferees = useMemo(() => {
    const query = normalize(refereeText);
    return options.referees.filter(name => !query || normalize(name).includes(query));
  }, [options.referees, refereeText]);

  const teamsForReferee = options.teamsByReferee[selectedReferee] || EMPTY_TEAMS;
  const teamSuggestions = useMemo(() => {
    const query = normalize(teamText);
    if (!query || selectedTeam) return [];
    return teamsForReferee.filter(name => normalize(name).includes(query)).slice(0, 8);
  }, [teamsForReferee, teamText, selectedTeam]);

  useEffect(() => {
    if (!selectedReferee || !selectedTeam) {
      return undefined;
    }

    const controller = new AbortController();
    async function loadStats() {
      setLoadingStats(true);
      setError("");
      try {
        const params = new URLSearchParams({ referee: selectedReferee, team: selectedTeam });
        if (season) params.set("season", season);
        const response = await fetch(`/api/referees?${params}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudieron cargar los resultados.");
        setStats(result);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoadingStats(false);
      }
    }
    loadStats();
    return () => controller.abort();
  }, [selectedReferee, selectedTeam, season]);

  function elegirArbitro(name) {
    setSelectedReferee(name);
    setRefereeText(name);
    setShowRefereeList(false);
    setSelectedTeam("");
    setTeamText("");
    setStats(null);
  }

  function elegirEquipo(name) {
    setSelectedTeam(name);
    setTeamText(name);
  }

  function limpiarArbitro() {
    setSelectedReferee("");
    setRefereeText("");
    setSelectedTeam("");
    setTeamText("");
    setStats(null);
  }

  function limpiarEquipo() {
    setSelectedTeam("");
    setTeamText("");
    setStats(null);
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "Arial, Tahoma, Verdana, sans-serif", fontSize: "12px" }}>
      <header style={{ background: colors.blueDark, borderBottom: "2px solid #1e3a8a" }}>
        <div style={{ maxWidth: "1000px", minHeight: "48px", margin: "0 auto", padding: "6px 12px", display: "flex", alignItems: "center", gap: "14px" }}>
          <Link href="/" style={{ color: colors.white, fontWeight: "bold", textDecoration: "none" }}>← CHIQUIFÚTBOL</Link>
          <span style={{ color: colors.white, fontWeight: "bold" }}>HISTORIAL POR ÁRBITRO</span>
          <div style={{ marginLeft: "auto" }}><CompetitionsMenu compact /></div>
        </div>
      </header>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "12px" }}>
        <section style={{ padding: "14px", background: colors.surface, border: `1px solid ${colors.border}` }}>
          <h1 style={{ margin: "0 0 6px", color: colors.white, fontSize: "18px" }}>¿Cómo le va a tu equipo con este árbitro?</h1>
          <p style={{ margin: "0 0 14px", color: colors.muted, lineHeight: 1.5 }}>Elegí un árbitro y un equipo para consultar sus resultados cara a cara en los partidos dirigidos por ese árbitro.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              <label htmlFor="referee-search" style={{ display: "block", marginBottom: "5px", color: colors.text, fontWeight: "bold" }}>1. Buscá un árbitro</label>
              <div style={{ display: "flex", gap: "5px" }}>
                <input
                  id="referee-search"
                  value={refereeText}
                  onChange={event => {
                    setRefereeText(event.target.value);
                    setSelectedReferee("");
                    setSelectedTeam("");
                    setTeamText("");
                    setStats(null);
                  }}
                  placeholder={loadingOptions ? "Cargando árbitros..." : "Ej.: Nazareno Arasa"}
                  autoComplete="off"
                  style={{ ...controlStyle, flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowRefereeList(open => !open)}
                  disabled={loadingOptions || options.referees.length === 0}
                  aria-label={showRefereeList ? "Ocultar lista de árbitros" : "Mostrar todos los árbitros"}
                  aria-expanded={showRefereeList}
                  aria-controls="referee-list"
                  style={{
                    minHeight: "40px",
                    padding: "0 12px",
                    color: colors.text,
                    background: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "4px",
                    cursor: loadingOptions || options.referees.length === 0 ? "not-allowed" : "pointer",
                    opacity: loadingOptions || options.referees.length === 0 ? 0.55 : 1,
                    fontSize: "16px",
                  }}
                >
                  {showRefereeList ? "▲" : "▼"}
                </button>
              </div>
              {showRefereeList && (
                <div id="referee-list" role="group" aria-label="Todos los árbitros" style={{ position: "absolute", zIndex: 2, top: "100%", left: 0, right: 0, maxHeight: "260px", overflowY: "auto", background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 6px 16px #0008" }}>
                  <div style={{ position: "sticky", top: 0, padding: "7px 10px", color: colors.muted, background: colors.surfaceAlt, borderBottom: `1px solid ${colors.borderSub}`, fontSize: "11px" }}>
                    {refereeText.trim()
                      ? `${visibleReferees.length} árbitro${visibleReferees.length === 1 ? "" : "s"} encontrado${visibleReferees.length === 1 ? "" : "s"}`
                      : `${visibleReferees.length} árbitros disponibles`}
                  </div>
                  {visibleReferees.length > 0 ? visibleReferees.map(name => (
                    <button key={name} type="button" onClick={() => elegirArbitro(name)} style={{ display: "block", width: "100%", padding: "9px 10px", color: colors.text, textAlign: "left", background: "transparent", border: 0, borderBottom: `1px solid ${colors.borderSub}`, cursor: "pointer" }}>{name}</button>
                  )) : (
                    <div style={{ padding: "10px", color: colors.muted }}>No hay árbitros que coincidan con la búsqueda.</div>
                  )}
                </div>
              )}
              {!showRefereeList && refereeSuggestions.length > 0 && (
                <div role="group" aria-label="Árbitros encontrados" style={{ position: "absolute", zIndex: 2, top: "100%", left: 0, right: 0, maxHeight: "220px", overflowY: "auto", background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 6px 16px #0008" }}>
                  {refereeSuggestions.map(name => (
                    <button key={name} type="button" onClick={() => elegirArbitro(name)} style={{ display: "block", width: "100%", padding: "9px 10px", color: colors.text, textAlign: "left", background: "transparent", border: 0, borderBottom: `1px solid ${colors.borderSub}`, cursor: "pointer" }}>{name}</button>
                  ))}
                </div>
              )}
              {selectedReferee && <button type="button" onClick={limpiarArbitro} style={{ marginTop: "5px", padding: 0, color: colors.blue, background: "none", border: 0 }}>Cambiar árbitro</button>}
            </div>
            <div style={{ position: "relative" }}>
              <label htmlFor="team-search" style={{ display: "block", marginBottom: "5px", color: colors.text, fontWeight: "bold" }}>2. Elegí el equipo</label>
              <input
                id="team-search"
                value={teamText}
                disabled={!selectedReferee}
                onChange={event => {
                  setTeamText(event.target.value);
                  setSelectedTeam("");
                  setStats(null);
                }}
                placeholder={selectedReferee ? "Ej.: Boca Juniors" : "Primero seleccioná un árbitro"}
                autoComplete="off"
                style={{ ...controlStyle, opacity: selectedReferee ? 1 : 0.55 }}
              />
              {teamSuggestions.length > 0 && (
                <div role="group" aria-label="Equipos encontrados" style={{ position: "absolute", zIndex: 2, top: "100%", left: 0, right: 0, maxHeight: "220px", overflowY: "auto", background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 6px 16px #0008" }}>
                  {teamSuggestions.map(name => (
                    <button key={name} type="button" onClick={() => elegirEquipo(name)} style={{ display: "block", width: "100%", padding: "9px 10px", color: colors.text, textAlign: "left", background: "transparent", border: 0, borderBottom: `1px solid ${colors.borderSub}`, cursor: "pointer" }}>{name}</button>
                  ))}
                </div>
              )}
              {selectedTeam && <button type="button" onClick={limpiarEquipo} style={{ marginTop: "5px", padding: 0, color: colors.blue, background: "none", border: 0 }}>Cambiar equipo</button>}
            </div>
            <div>
              <label htmlFor="season-filter" style={{ display: "block", marginBottom: "5px", color: colors.text, fontWeight: "bold" }}>Temporada</label>
              <select id="season-filter" value={season} onChange={event => setSeason(event.target.value)} style={controlStyle}>
                <option value="">Todas las temporadas disponibles</option>
                {options.seasons.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
          </div>
          {error && <div role="alert" style={{ marginTop: "12px", padding: "8px", color: colors.red, border: `1px solid ${colors.red}`, background: "#ef44441a" }}>{error}</div>}
        </section>

        {loadingStats && <div style={{ padding: "24px", textAlign: "center", color: colors.muted }}>Calculando historial...</div>}
        {!loadingStats && stats && (
          <section style={{ marginTop: "12px" }}>
            <div style={{ padding: "10px 12px", color: colors.white, background: colors.blueDark, fontWeight: "bold" }}>
              {stats.team} con {stats.referee} · {stats.season || "todas las temporadas"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "6px", marginTop: "8px" }}>
              {[
                ["PARTIDOS", stats.total, colors.blue],
                ["GANADOS", stats.wins, colors.green],
                ["EMPATADOS", stats.draws, colors.amber],
                ["PERDIDOS", stats.losses, colors.red],
              ].map(([label, value, color]) => (
                <div key={label} style={{ padding: "10px 6px", textAlign: "center", background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <div style={{ color, fontSize: "20px", fontWeight: "bold" }}>{value}</div>
                  <div style={{ marginTop: "2px", color: colors.muted, fontSize: "9px", fontWeight: "bold" }}>{label}</div>
                </div>
              ))}
            </div>
            {stats.matches.length === 0 ? (
              <div style={{ marginTop: "8px", padding: "16px", textAlign: "center", color: colors.muted, background: colors.surface, border: `1px solid ${colors.border}` }}>No hay partidos en esta combinación para el período seleccionado.</div>
            ) : (
              <div style={{ marginTop: "8px", overflowX: "auto", background: colors.surface, border: `1px solid ${colors.border}` }}>
                <table style={{ minWidth: "590px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: colors.muted, background: colors.surfaceAlt, textAlign: "left" }}>
                      {["Fecha", "Partido", "Resultado", "Liga", "Temporada"].map(label => <th key={label} style={{ padding: "8px", borderBottom: `1px solid ${colors.border}` }}>{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.matches.map(match => (
                      <tr key={match.id} style={{ borderBottom: `1px solid ${colors.borderSub}` }}>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{match.date}</td>
                        <td style={{ padding: "8px" }}>
                          <span style={{ color: match.venue === "Local" ? colors.blue : colors.muted, fontWeight: match.venue === "Local" ? "bold" : "normal" }}>{match.homeTeam}</span>
                          {" "}{match.homeGoals} - {match.awayGoals}{" "}
                          <span style={{ color: match.venue === "Visitante" ? colors.blue : colors.muted, fontWeight: match.venue === "Visitante" ? "bold" : "normal" }}>{match.awayTeam}</span>
                        </td>
                        <td style={{ padding: "8px", color: match.result === "G" ? colors.green : match.result === "E" ? colors.amber : colors.red, fontWeight: "bold" }}>
                          {match.result === "G" ? "Ganó" : match.result === "E" ? "Empató" : "Perdió"}
                        </td>
                        <td style={{ padding: "8px" }}>{match.competition}</td>
                        <td style={{ padding: "8px" }}>{match.season}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <aside style={{ marginTop: "12px", padding: "10px 12px", color: colors.muted, background: colors.surfaceAlt, border: `1px solid ${colors.border}`, lineHeight: 1.5 }}>
          <strong style={{ color: colors.text }}>Cobertura actual:</strong> Liga Profesional, temporadas históricas disponibles en el archivo (2016–2025). Copa Argentina todavía no está incluida.
          <div style={{ marginTop: "4px" }}>Partidos disponibles en la base: {options.matchCount.toLocaleString("es-AR")}.</div>
        </aside>
      </div>
    </main>
  );
}
