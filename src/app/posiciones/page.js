"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function StandingsContent() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("leagueId");
  const leagueName = searchParams.get("name") || "Tabla de Posiciones";

  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const url = leagueId ? `/api/standings?leagueId=${leagueId}` : `/api/standings`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("No se pudieron cargar las posiciones");
        
        const data = await res.json();
        setStandings(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "inherit" }}>Cargando posiciones...</div>;
  }

  let tablesList = standings?.tables || [];
  const rawTeams = standings?.tables ? null : (standings?.teams || (Array.isArray(standings) ? standings : []));

  if (rawTeams && rawTeams.length > 0) {
    tablesList = [
      { title: "Clausura - Grupo A", teams: rawTeams.slice(0, 15) },
      { title: "Clausura - Grupo B", teams: rawTeams.slice(15, 30) },
      { title: "Apertura - Grupo A", teams: rawTeams.slice(30, 45) },
      { title: "Apertura - Grupo B", teams: rawTeams.slice(45, 60) },
      { title: "PROMEDIOS", teams: rawTeams.slice(60, 90) },
      { title: "Tabla Anual", teams: rawTeams.slice(90, 120) }
    ].filter(section => section.teams.length > 0);
  } else if (tablesList.length > 0) {
    tablesList = tablesList.map((table, index) => {
      let customTitle = table.title;
      const lowerTitle = (table.title || "").toLowerCase();

      if (lowerTitle.includes("promedio") || lowerTitle.includes("relegation") || index === 4) {
        customTitle = "PROMEDIOS";
      } else if (index === 0) {
        customTitle = "Clausura - Grupo A";
      } else if (index === 1) {
        customTitle = "Clausura - Grupo B";
      } else if (index === 2) {
        customTitle = "Apertura - Grupo A";
      } else if (index === 3) {
        customTitle = "Apertura - Grupo B";
      } else if (index === 5 || lowerTitle.includes("anual") || lowerTitle.includes("general")) {
        customTitle = "Tabla Anual";
      }

      return { ...table, title: customTitle };
    });
  }

  // Obtenemos las estadísticas personales scrapeadas desde Redis
  const playerStats = standings?.stats || [];

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "15px" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0 }}>
          📊 {decodeURIComponent(leagueName)}
        </h1>
        <Link href="/" style={{ color: "#10b981", textDecoration: "none", fontWeight: "600" }}>
          ← Volver a partidos
        </Link>
      </header>

      {tablesList.length > 0 ? (
        tablesList.map((section, sIndex) => {
          const isPromedios = section.title.toLowerCase().includes("promedio");

          return (
            <div key={sIndex} style={{ marginBottom: "30px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#10b981", marginBottom: "10px", textTransform: "uppercase" }}>
                {section.title}
              </h2>

              <div style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(16, 185, 129, 0.15)", textAlign: "left", color: "#10b981" }}>
                      <th style={{ padding: "10px", width: "40px", textAlign: "center" }}>#</th>
                      <th style={{ padding: "10px" }}>Equipo</th>
                      {isPromedios ? (
                        <>
                          <th style={{ padding: "10px", textAlign: "center" }}>Prom</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>Pts</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>PJ</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>'24</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>'25</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>'26</th>
                        </>
                      ) : (
                        <>
                          <th style={{ padding: "10px", textAlign: "center" }}>Pts</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>PJ</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>DG</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {section.teams.map((team, index) => (
                      <tr key={team.id || team.team_id || index} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                        <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>{team.position || index + 1}</td>
                        <td style={{ padding: "10px", fontWeight: "500" }}>{team.name || team.team_name}</td>
                        
                        {isPromedios ? (
                          <>
                            <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#10b981" }}>
                              {team.points ?? "0.000"}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                              {team.goal_difference ?? 0}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                              {team.played ?? team.pj ?? 0}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>{team.seasons?.[0] ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>{team.seasons?.[1] ?? 0}</td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>{team.seasons?.[2] ?? 0}</td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#10b981" }}>
                              {Math.round(Number(team.points ?? team.pts ?? 0))}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                              {team.played ?? team.pj ?? 0}
                            </td>
                            <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                              {team.goal_difference ?? team.dg ?? 0}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", padding: "30px", textAlign: "center", opacity: 0.6 }}>
          {error ? `Error: ${error}` : "No hay datos estructurados todavía."}
        </div>
      )}

      {/* Sección Dinámica de Estadísticas Personales (Scrapeadas) */}
      {playerStats.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#10b981", marginBottom: "20px", textTransform: "uppercase", textAlign: "center" }}>
            🏆 Estadísticas Personales
          </h2>

          {playerStats.map((statGroup, idx) => (
            <div key={idx} style={{ marginBottom: "25px", border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px 15px", fontWeight: "bold", color: "#10b981", textAlign: "center", textTransform: "uppercase", fontSize: "0.95rem" }}>
                {statGroup.category}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <tbody>
                  {statGroup.players.map((player, pIdx) => (
                    <tr key={pIdx} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                      <td style={{ padding: "10px 15px", fontWeight: "500" }}>{player.name}</td>
                      <td style={{ padding: "10px 15px", textAlign: "right", fontWeight: "bold", color: "#10b981", width: "60px" }}>
                        {player.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div>}>
      <StandingsContent />
    </Suspense>
  );
}