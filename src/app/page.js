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
    <main style={{ maxWidth: "950px", width: "100%", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "16px", marginBottom: "20px" }}>
        
        {/* Header con el logo cargado desde public/logo.svg */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img 
            src="/logo.svg" 
            alt="Chiquifútbol Logo" 
            style={{ height: "58px", width: "auto", display: "block" }} 
          />
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Chiquifútbol
          </h1>
        </div>

        <button 
          onClick={() => { setLoading(true); fetchMatches(); }} 
          style={{ background: "transparent", border: "1px solid currentColor", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
        >
          Actualizar
        </button>
      </header>

      {/* Barra de Filtros */}
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
            <section key={league.id} style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
              
              {/* Cabecera de la Liga */}
              <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "10px 16px", fontWeight: "bold", borderBottom: "1px solid rgba(128,128,128,0.2)", fontSize: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🏆 {league.name} ({league.country_name})</span>
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

                  const formatGoals = (goalsList) => {
                    return goalsList.map((g) => {
                      const time = g.time_to_display || `${g.time}'`;
                      const name = g.player_name || g.player_sname;
                      const pen = g.goal_type === "Pen" ? " (Pen)" : "";
                      return `${time} ${name}${pen}`;
                    }).join("; ");
                  };

                  const strGoalsA = formatGoals(goalsA);
                  const strGoalsB = formatGoals(goalsB);
                  const hasGoals = strGoalsA !== "" || strGoalsB !== "";
                  const tvList = game.tv_networks ? game.tv_networks.map((tv) => tv.name).join(", ") : "";

                  return (
                    <div key={game.id} style={{ display: "flex", borderBottom: "1px solid rgba(128,128,128,0.15)", fontSize: "0.9rem" }}>
                      
                      {/* 1. Columna Estado (Izquierda) */}
                      <div style={{ width: "95px", background: "rgba(128,128,128,0.06)", borderRight: "1px solid rgba(128,128,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", textAlign: "center", fontWeight: "600", fontSize: "0.75rem", flexShrink: 0 }}>
                        {isLive && (
                          <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                            {game.game_time_status_to_display || "EN VIVO"}
                          </span>
                        )}
                        {isFinished && (
                          <span style={{ opacity: 0.7 }}>Finalizado</span>
                        )}
                        {isProgrammed && (
                          <span style={{ color: "#3b82f6" }}>{game.start_time}</span>
                        )}
                      </div>

                      {/* 2. Columna Central (Equipos, Marcador y Goleadores) */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        
                        {/* Fila principal: Local / Marcador / Visitante */}
                        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", justifyContent: "space-between" }}>
                          
                          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", textAlign: "right" }}>
                            <span style={{ fontWeight: 500 }}>{teamA.name}</span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", fontWeight: "bold", fontSize: "1.1rem", gap: "8px", minWidth: "120px", textAlign: "center" }}>
                            
                            {/* Tarjetas Rojas Local */}
                            {teamA.red_cards > 0 && (
                              <div style={{ display: "flex", gap: "2px" }}>
                                {Array.from({ length: teamA.red_cards }).map((_, i) => (
                                  <span key={`red-a-${i}`} style={{ background: "#ef4444", width: "7px", height: "11px", display: "inline-block", borderRadius: "1px", flexShrink: 0 }} title="Expulsado"></span>
                                ))}
                              </div>
                            )}

                            <span style={{ color: isLive ? "#ef4444" : "inherit" }}>{scoreA}</span>
                            <span style={{ opacity: 0.4 }}>–</span>
                            <span style={{ color: isLive ? "#ef4444" : "inherit" }}>{scoreB}</span>

                            {/* Tarjetas Rojas Visitante */}
                            {teamB.red_cards > 0 && (
                              <div style={{ display: "flex", gap: "2px" }}>
                                {Array.from({ length: teamB.red_cards }).map((_, i) => (
                                  <span key={`red-b-${i}`} style={{ background: "#ef4444", width: "7px", height: "11px", display: "inline-block", borderRadius: "1px", flexShrink: 0 }} title="Expulsado"></span>
                                ))}
                              </div>
                            )}

                          </div>

                          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "10px", textAlign: "left" }}>
                            <span style={{ fontWeight: 500 }}>{teamB.name}</span>
                          </div>

                        </div>

                        {/* Goleadores en 2 columnas */}
                        {hasGoals && (
                          <div style={{ display: "flex", borderTop: "1px dashed rgba(128,128,128,0.15)", fontSize: "0.75rem", opacity: 0.75, background: "rgba(128,128,128,0.02)" }}>
                            <div style={{ flex: 1, padding: "6px 16px", textAlign: "right", borderRight: "1px dashed rgba(128,128,128,0.15)" }}>
                              {strGoalsA}
                            </div>
                            <div style={{ flex: 1, padding: "6px 16px", textAlign: "left" }}>
                              {strGoalsB}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* 3. Columna Derecha (Televisación) */}
                      <div style={{ width: "160px", background: "rgba(128,128,128,0.04)", borderLeft: "1px solid rgba(128,128,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", textAlign: "center", fontSize: "0.75rem", opacity: 0.7, flexShrink: 0 }}>
                        {tvList ? (
                          <span>📺 {tvList}</span>
                        ) : (
                          <span style={{ opacity: 0.4 }}>-</span>
                        )}
                      </div>

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