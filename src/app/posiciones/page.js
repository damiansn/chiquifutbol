"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StandingsPage() {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((res) => res.json())
      .then((data) => {
        setStandings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando posiciones...</div>;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: "bold" }}>📊 Tabla de Posiciones</h1>
        <Link href="/" style={{ color: "#10b981", textDecoration: "none", fontWeight: "600" }}>
          ← Volver a partidos
        </Link>
      </header>

      {/* Acá mapeás tu tabla con los datos que te devuelve tu API propia */}
      <div style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(16, 185, 129, 0.15)", textAlign: "left", color: "#10b981" }}>
              <th style={{ padding: "10px" }}>#</th>
              <th style={{ padding: "10px" }}>Equipo</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Pts</th>
              <th style={{ padding: "10px", textAlign: "center" }}>PJ</th>
              <th style={{ padding: "10px", textAlign: "center" }}>DG</th>
            </tr>
          </thead>
          <tbody>
            {/* Ejemplo de estructura iterada */}
            {standings?.teams?.map((team, index) => (
              <tr key={team.id || index} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                <td style={{ padding: "10px" }}>{index + 1}</td>
                <td style={{ padding: "10px", fontWeight: "500" }}>{team.name}</td>
                <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>{team.points}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{team.played}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{team.goal_difference}</td>
              </tr>
            )) || (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>
                  No hay datos estructurados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}