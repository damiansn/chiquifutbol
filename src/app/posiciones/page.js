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

  // Obtenemos las tablas agrupadas o armamos una estructura de respaldo si viene plano
  const tablesList = standings?.tables || (standings?.teams ? [{ title: leagueName, teams: standings.teams }] : (Array.isArray(standings) ? [{ title: leagueName, teams: standings }] : []));

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
        tablesList.map((section, sIndex) => (
          <div key={sIndex} style={{ marginBottom: "30px" }}>
            {/* Título de la sección / grupo (ej: Grupo A, Grupo B, Clausura, etc.) */}
            <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#10b981", marginBottom: "10px", textTransform: "uppercase" }}>
              {section.title}
            </h2>

            <div style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "rgba(16, 185, 129, 0.15)", textAlign: "left", color: "#10b981" }}>
                    <th style={{ padding: "10px", width: "40px", textAlign: "center" }}>#</th>
                    <th style={{ padding: "10px" }}>Equipo</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Pts</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>PJ</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>DG</th>
                  </tr>
                </thead>
                <tbody>
                  {section.teams && section.teams.length > 0 ? (
                    section.teams.map((team, index) => (
                      <tr key={team.id || team.team_id || index} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                        <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>{team.position || index + 1}</td>
                        <td style={{ padding: "10px", fontWeight: "500" }}>{team.name || team.team_name}</td>
                        <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#10b981" }}>
                          {team.points ?? team.pts ?? 0}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                          {team.played ?? team.pj ?? 0}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", opacity: 0.8 }}>
                          {team.goal_difference ?? team.dg ?? 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>
                        No hay equipos en esta tabla.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", padding: "30px", textAlign: "center", opacity: 0.6 }}>
          {error ? `Error: ${error}` : "No hay datos estructurados todavía."}
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