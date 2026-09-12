"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [hiddenLeagues, setHiddenLeagues] = useState([]);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Error al obtener los partidos");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedHidden = localStorage.getItem("chiquifutbol_hidden_leagues");
    if (savedHidden) {
      try {
        setHiddenLeagues(JSON.parse(savedHidden));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleLeagueFilter = (leagueId) => {
    const updated = hiddenLeagues.includes(leagueId)
      ? hiddenLeagues.filter((id) => id !== leagueId)
      : [...hiddenLeagues, leagueId];
    
    setHiddenLeagues(updated);
    localStorage.setItem("chiquifutbol_hidden_leagues", JSON.stringify(updated));
  };

  // Acciones rápidas para los filtros
  const hideAllLeagues = () => {
    const allIds = data?.leagues ? data.leagues.map((l) => l.id) : [];
    setHiddenLeagues(allIds);
    localStorage.setItem("chiquifutbol_hidden_leagues", JSON.stringify(allIds));
  };

  const showAllLeagues = () => {
    setHiddenLeagues([]);
    localStorage.setItem("chiquifutbol_hidden_leagues", JSON.stringify([]));
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Cargando partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#ef4444" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  const leagues = data?.leagues || [];
  const filteredLeagues = leagues.filter((league) => !hiddenLeagues.includes(league.id));

  return (
    <main style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "16px", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
          Chiquifútbol Live
        </h1>
        <button 
          onClick={() => { setLoading(true); fetchMatches(); }} 
          style={{ background: "transparent", border: "1px solid currentColor", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
        >
          Actualizar
        </button>
      </header>

      {/* Barra de Filtros con botones Masivos */}
      {leagues.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", opacity: 0.6, letterSpacing: "0.5px" }}>
              Filtrar Ligas
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={hideAllLeagues}
                style={{ background: "none", border: "none", fontSize: "0.75rem", color: "#ef4444", cursor: "pointer", fontWeight: "600" }}
              >
                Ocultar todas
              </button>
              <span style={{ opacity: 0.3 }}>|</span>
              <button 
                onClick={showAllLeagues}
                style={{ background: "none", border: "none", fontSize: "0.75rem", color: "#10b981", cursor: "pointer", fontWeight: "600" }}
              >
                Mostrar todas
              </button>
            </div>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {leagues.map((league) => {
              const isHidden = hiddenLeagues.includes(league.id);
              return (
                <button
                  key={league.id}
                  onClick={() => toggleLeagueFilter(league.id)}
                  style={{
                    background: isHidden ? "rgba(128,128,128,0.08)" : "rgba(16, 185, 129, 0.12)",
                    color: isHidden ? "inherit" : "#10b981",
                    border: isHidden ? "1px solid rgba(128,128,128,0.2)" : "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    opacity: isHidden ? 0.5 : 1,
                    textDecoration: isHidden ? "line-through" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {league.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredLeagues.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.6, padding: "40px" }}>No hay torneos seleccionados para mostrar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filteredLeagues.map((league) => (
            <section key={league.id} style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "rgba(128,128,128,0.1)", padding: "10px 16px", fontWeight: "bold", borderBottom: "1px solid rgba(128,128,128,0.2)", fontSize: "0.9rem" }}>
                <span>{league.name} ({league.country_name})</span>
              </div>

              <div>
                {league.games.map((game) => {
                  const isLive = game.status.enum === 2;
                  const isFinished = game.status.enum === 3;
                  const isProgrammed = game.status.enum === 1;

                  const teamA = game.teams[0] || {};
                  const teamB = game.teams[1] || {};
                  const scoreA = game.scores ? game.scores[0] : "-";
                  const scoreB = game.scores ? game.scores[1] : "-";
                  const goalsA = teamA.goals || [];
                  const goalsB = teamB.goals || [];

                  return (
                    <div key={game.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                      
                      {/* Marcador Compacto en una sola estructura visual */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        
                        {/* Equipos y Goles en formato horizontal compacto */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{teamA.name}</span>
                            <span style={{ fontWeight: "bold", background: "rgba(128,128,128,0.15)", padding: "1px 8px", borderRadius: "4px", minWidth: "1.5rem", textAlign: "center" }}>
                              {scoreA}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{teamB.name}</span>
                            <span style={{ fontWeight: "bold", background: "rgba(128,128,128,0.15)", padding: "1px 8px", borderRadius: "4px", minWidth: "1.5rem", textAlign: "center" }}>
                              {scoreB}
                            </span>
                          </div>
                        </div>

                        {/* Estado y TV a la derecha */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", textAlign: "right", borderLeft: "1px solid rgba(128,128,128,0.15)", paddingLeft: "12px", minWidth: "90px" }}>
                          <div>
                            {isLive && (
                              <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", fontWeight: "bold" }}>
                                {game.game_time_status_to_display || "EN VIVO"}
                              </span>
                            )}
                            {isFinished && (
                              <span style={{ background: "rgba(128, 128, 128, 0.15)", opacity: 0.7, fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", fontWeight: "600" }}>
                                Finalizado
                              </span>
                            )}
                            {isProgrammed && (
                              <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", fontWeight: "600" }}>
                                {game.start_time}
                              </span>
                            )}
                          </div>

                          {game.tv_networks && game.tv_networks.length > 0 && (
                            <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                              📺 {game.tv_networks.map((tv) => tv.name).join(", ")}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Goleadores compactos en una sola línea discreta si los hay */}
                      {(goalsA.length > 0 || goalsB.length > 0) && (
                        <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed rgba(128,128,128,0.15)", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {goalsA.map((g, idx) => (
                            <span key={`a-${idx}`}>⚽ {g.player_name || g.player_sname} ({g.time_to_display || `${g.time}'`}{g.goal_type === "Pen" ? "P" : ""}) <span style={{ opacity: 0.5 }}>[{teamA.name}]</span></span>
                          ))}
                          {goalsB.map((g, idx) => (
                            <span key={`b-${idx}`}>⚽ {g.player_name || g.player_sname} ({g.time_to_display || `${g.time}'`}{g.goal_type === "Pen" ? "P" : ""}) <span style={{ opacity: 0.5 }}>[{teamB.name}]</span></span>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}