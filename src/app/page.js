"use client";

import React, { useState, useEffect } from "react";

export default function Page() {
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [teamFixtureData, setTeamFixtureData] = useState([]);

  // Simulación o función de ejemplo para fecha/hora si no viene formateada
  const formatFullDateTime = (date, time) => {
    if (!date) return time || "";
    return `${date} ${time || ""}`.trim();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#fff", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
        Fixture de Partidos
      </h1>

      <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "16px" }}>
        {teamFixtureData.length === 0 && loadingFixture ? (
          <p style={{ textAlign: "center", opacity: 0.6, padding: "20px" }}>Buscando partidos...</p>
        ) : teamFixtureData.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.6, padding: "10px" }}>No se encontraron partidos próximos para este equipo.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
            {teamFixtureData.map((match, i) => {
              const fullDateTimeDisplay = formatFullDateTime(match.date, match.time);

              return (
                <div key={match.id || `fixture-${i}`} style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  padding: "10px 14px", 
                  marginBottom: "6px",
                  background: "rgba(255, 255, 255, 0.03)", 
                  border: "1px solid rgba(128,128,128,0.15)",
                  borderRadius: "6px",
                  gap: "6px"
                }}>
                  {match.league && (
                     <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                       🏆 {match.league}
                     </span>
                  )}
                  
                  {/* Fila estructurada con Fecha, Badge L/V, Rival y Hora/Resultado */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    
                    {/* Fecha */}
                    <span style={{ opacity: 0.7, width: "65px", fontWeight: "500", fontSize: "0.85rem", flexShrink: 0 }}>
                      {match.fecha || fullDateTimeDisplay}
                    </span>

                    {/* Badge Condición (L / V) si existe */}
                    {match.condicion && (
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        backgroundColor: match.condicion === "L" ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                        color: match.condicion === "L" ? "#10b981" : "#3b82f6",
                        textAlign: "center",
                        width: "28px",
                        flexShrink: 0
                      }}>
                        {match.condicion}
                      </span>
                    )}

                    {/* Rival */}
                    <span style={{ flex: 1, fontWeight: "600", color: "#fff" }}>
                      {match.rival || match.rawText}
                    </span>

                    {/* Hora o Resultado */}
                    <span style={{ fontWeight: "bold", color: "#10b981", textAlign: "right", flexShrink: 0 }}>
                      {match.horaOResultado}
                    </span>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}