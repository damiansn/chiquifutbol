"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <main style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "16px", marginBottom: "24px" }}>
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

      {leagues.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.6, padding: "40px" }}>No hay ligas disponibles en este momento.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {leagues.map((league) => (
            <section key={league.id} style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ background: "rgba(128,128,128,0.1)", padding: "12px 16px", fontWeight: "bold", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
                <span>{league.name} ({league.country_name})</span>
              </div>

              <div>
                {league.games.map((game) => {
                  const isLive = game.status.enum === 2;
                  const isFinished = game.status.enum === 3;
                  const isProgrammed = game.status.enum === 1;

                  return (
                    <div key={game.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px", borderBottom: "1px solid rgba(128,128,128,0.1)", gap: "16px" }}>
                      
                      {/* Equipos, Goles y Autores */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                        {game.teams.map((team, idx) => {
                          const score = game.scores ? game.scores[idx] : "-";
                          const goals = team.goals || [];

                          return (
                            <div key={team.id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 500 }}>{team.name}</span>
                                <span style={{ fontWeight: "bold", background: "rgba(128,128,128,0.15)", padding: "2px 10px", borderRadius: "4px", minWidth: "1.5rem", textAlign: "center" }}>
                                  {score}
                                </span>
                              </div>

                              {/* Lista de goleadores del equipo */}
                              {goals.length > 0 && (
                                <div style={{ fontSize: "0.8rem", opacity: 0.7, display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                                  {goals.map((goal, gIdx) => (
                                    <span key={gIdx} style={{ background: "rgba(128,128,128,0.08)", padding: "1px 6px", borderRadius: "4px" }}>
                                      ⚽ {goal.player_name || goal.player_sname} ({goal.time_to_display || `${goal.time}'`})
                                      {goal.goal_type === "Pen" && " (P)"}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Estado y TV */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", textAlign: "right" }}>
                        <div>
                          {isLive && (
                            <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "9999px", fontWeight: "bold" }}>
                              {game.game_time_status_to_display || "EN VIVO"}
                            </span>
                          )}
                          {isFinished && (
                            <span style={{ background: "rgba(128, 128, 128, 0.15)", opacity: 0.7, fontSize: "0.75rem", padding: "4px 10px", borderRadius: "9999px", fontWeight: "600" }}>
                              Finalizado
                            </span>
                          )}
                          {isProgrammed && (
                            <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontSize: "0.75rem", padding: "4px 10px", borderRadius: "9999px", fontWeight: "600" }}>
                              {game.start_time}
                            </span>
                          )}
                        </div>

                        {game.tv_networks && game.tv_networks.length > 0 && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                            📺 {game.tv_networks.map(tv => tv.name).join(", ")}
                          </div>
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