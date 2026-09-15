"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

// Función auxiliar pura y segura para formatear la fecha sin efectos colaterales raros
const formatFullDateTime = (dateStr, timeStr) => {
  if (!dateStr) return timeStr ? `Hora: ${timeStr}` : "";
  
  const cleanDate = dateStr.trim();
  
  try {
    const parsedDate = new Date(cleanDate.includes("T") ? cleanDate : `${cleanDate}T00:00:00`);
    if (!isNaN(parsedDate)) {
      const options = { weekday: 'long', day: 'numeric', month: 'short' };
      const formattedDate = parsedDate.toLocaleDateString('es-AR', options);
      const capitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      return timeStr ? `${capitalized} - ${timeStr} hs` : capitalized;
    }
  } catch (e) {
    // Si es solo texto plano
  }
  
  return timeStr ? `${cleanDate} - ${timeStr} hs` : cleanDate;
};

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState("today"); // 'ayer', 'today', 'manana'
  const [hiddenLeagues, setHiddenLeagues] = useState([]);

  // Estados para búsqueda de equipos y fixture progresivo
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null);
  const [showFullFixture, setShowFullFixture] = useState(false);
  const [teamFixtureData, setTeamFixtureData] = useState([]);
  const [nextFetchDate, setNextFetchDate] = useState(null);
  const [loadingFixture, setLoadingFixture] = useState(false);

  // Referencia para cerrar el buscador al hacer clic fuera
  const searchContainerRef = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchMatches = async (date = selectedDate) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/matches?date=${date}`);
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

    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedTeamFilter(null);
    setShowFullFixture(false);
    setTeamSearchQuery("");
    fetchMatches(newDate);
  };

  const allTeamsWithMatches = useMemo(() => {
    if (!data?.leagues) return [];
    const list = [];
    data.leagues.forEach((league) => {
      league.games.forEach((game) => {
        if (game.teams && game.teams.length >= 2) {
          game.teams.forEach((team) => {
            if (team.name) {
              list.push({
                teamName: team.name,
                leagueName: league.name,
                leagueId: league.id,
                game: game
              });
            }
          });
        }
      });
    });
    return list;
  }, [data]);

  const filteredSuggestions = useMemo(() => {
    if (!teamSearchQuery.trim()) return [];
    const query = teamSearchQuery.toLowerCase();
    return allTeamsWithMatches.filter(item => 
      item.teamName.toLowerCase().includes(query)
    );
  }, [teamSearchQuery, allTeamsWithMatches]);

  const handleSelectTeam = (item) => {
    setSelectedTeamFilter(item);
    setTeamSearchQuery(item.teamName);
    setShowFullFixture(true);
    setIsSearchFocused(false);
    loadTeamFixture(item.teamName);
  };

  const handleClearTeamFilter = () => {
    setSelectedTeamFilter(null);
    setTeamSearchQuery("");
    setShowFullFixture(false);
    setTeamFixtureData([]);
    setNextFetchDate(null);
  };

  const loadTeamFixture = async (teamName, dateStr = null, append = false) => {
    setLoadingFixture(true);
    try {
      let url = `/api/team-fixture?team=${encodeURIComponent(teamName)}`;
      if (dateStr) url += `&date=${dateStr}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener el fixture");
      const json = await res.json();

      const newMatches = json.matches || [];

      if (append) {
        setTeamFixtureData(prev => {
          const existingIds = new Set(prev.map(m => m.id || `${m.date}-${m.rawText}`));
          const filteredNew = newMatches.filter(m => !existingIds.has(m.id || `${m.date}-${m.rawText}`));
          return [...prev, ...filteredNew];
        });
      } else {
        setTeamFixtureData(newMatches);
      }
      
      setNextFetchDate(json.nextDateParam);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFixture(false);
    }
  };

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
    fetchMatches(selectedDate);
    const interval = setInterval(() => fetchMatches(selectedDate), 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  if (error) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#ef4444" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  const leagues = data?.leagues || [];
  const filteredLeagues = selectedTeamFilter && selectedTeamFilter.leagueId
    ? leagues.filter(l => l.id === selectedTeamFilter.leagueId)
    : leagues.filter((league) => !hiddenLeagues.includes(league.id));

  return (
    <main style={{ maxWidth: "950px", width: "100%", margin: "0 auto", padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "16px", marginBottom: "20px" }}>
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
          onClick={() => fetchMatches(selectedDate)} 
          style={{ background: "transparent", border: "1px solid currentColor", padding: "6px 14px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
        >
          Actualizar
        </button>
      </header>

      {/* Selector de Fecha */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
        {[
          { id: "ayer", label: "Ayer" },
          { id: "today", label: "Hoy" },
          { id: "manana", label: "Mañana" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleDateChange(tab.id)}
            style={{
              background: selectedDate === tab.id ? "#10b981" : "rgba(128,128,128,0.08)",
              color: selectedDate === tab.id ? "#fff" : "inherit",
              border: "1px solid rgba(128,128,128,0.2)",
              padding: "8px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buscador Universal de Equipos */}
      <div ref={searchContainerRef} style={{ position: "relative", marginBottom: "16px", maxWidth: "450px", margin: "0 auto 16px auto" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="🔍 Buscar cualquier equipo (ej. River, Boca...)"
            value={teamSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setTeamSearchQuery(e.target.value);
              setIsSearchFocused(true);
              if (!e.target.value) handleClearTeamFilter();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && teamSearchQuery.trim()) {
                const teamName = teamSearchQuery.trim();
                handleSelectTeam({ teamName, leagueName: "Búsqueda Global", leagueId: null });
              }
            }}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(128,128,128,0.3)",
              background: "rgba(128,128,128,0.04)",
              color: "inherit",
              fontSize: "0.9rem",
              outline: "none"
            }}
          />
          {selectedTeamFilter && (
            <button
              onClick={handleClearTeamFilter}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "0 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.8rem"
              }}
              title="Limpiar filtro"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sugerencias desplegables del Buscador Universal */}
        {isSearchFocused && teamSearchQuery.trim() && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--background, #18181b)",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: "8px",
            marginTop: "4px",
            maxHeight: "220px",
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}>
            {/* Opción para buscar globalmente cualquier equipo escrito */}
            <div
              onClick={() => {
                const teamName = teamSearchQuery.trim();
                handleSelectTeam({ teamName, leagueName: "Búsqueda Global", leagueId: null });
              }}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                borderBottom: filteredSuggestions.length > 0 ? "1px solid rgba(128,128,128,0.15)" : "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#3b82f6",
                background: "rgba(59, 130, 246, 0.08)"
              }}
            >
              🔍 Buscar fixture completo de "{teamSearchQuery.trim()}"
            </div>

            {/* Sugerencias de equipos que jugaron en la fecha actual */}
            {filteredSuggestions.map((item, idx) => (
              <div
                key={`${item.teamName}-${item.leagueId}-${idx}`}
                onClick={() => handleSelectTeam(item)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(128,128,128,0.1)",
                  fontSize: "0.85rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontWeight: "600" }}>{item.teamName}</span>
                <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{item.leagueName} (Hoy)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón para abrir el fixture del equipo seleccionado */}
      {selectedTeamFilter && !showFullFixture && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button
            onClick={() => {
              setShowFullFixture(true);
              if (teamFixtureData.length === 0) {
                loadTeamFixture(selectedTeamFilter.teamName);
              }
            }}
            style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            📅 Ver calendario de {selectedTeamFilter.teamName}
          </button>
        </div>
      )}

      {/* Contenedor del Fixture Progresivo (MODAL) */}
      {showFullFixture && (
        <div style={{ border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", padding: "16px", marginBottom: "24px", background: "rgba(128,128,128,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Calendario: {selectedTeamFilter?.teamName}</h3>
            <button onClick={() => setShowFullFixture(false)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: "inherit" }}>Cerrar [X]</button>
          </div>
          
          {teamFixtureData.length === 0 && loadingFixture ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "20px" }}>Buscando partidos...</p>
          ) : teamFixtureData.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "10px" }}>No se encontraron partidos próximos para este equipo.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
              {teamFixtureData.map((match, i) => {
  const fullDateTimeDisplay = formatFullDateTime(match.date, match.time);
  
  // Omitimos filas basura o encabezados que vengan en crudo de la API
  if (match.rawText && match.rawText.includes("Día L/V")) return null;

  return (
    <div key={match.id || `fixture-${i}`} style={{ 
      display: "flex", 
      flexDirection: "column", 
      padding: "10px 14px", 
      marginBottom: "8px",
      background: "rgba(128,128,128,0.04)", 
      border: "1px solid rgba(128,128,128,0.1)",
      borderRadius: "8px",
      gap: "6px"
    }}>
      {/* Liga y Fecha del partido */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
        <span style={{ color: "#3b82f6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          🏆 {match.league || selectedTeamFilter?.leagueName || "Torneo"}
        </span>
        {fullDateTimeDisplay && (
          <span style={{ color: "#34d399", fontWeight: "600" }}>
            📅 {fullDateTimeDisplay}
          </span>
        )}
      </div>
      
      {/* Detalle del partido (Equipos y Resultado/Hora) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: "500", color: "#fff" }}>
          <span>{match.homeTeam || match.local || "Local"}</span>
          <span style={{ opacity: 0.4 }}>vs</span>
          <span>{match.awayTeam || match.visiting || "Visita"}</span>
        </div>

        {/* Si ya hay resultado o está programado */}
        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
          {match.score || match.time ? (
            <span style={{ 
              background: match.score ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
              color: match.score ? "#34d399" : "#3b82f6",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.85rem"
            }}>
              {match.score || `${match.time} hs`}
            </span>
          ) : (
            <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>Programado</span>
          )}
        </div>
      </div>
    </div>
  );
})}

            </div>
          )}

          {nextFetchDate && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
              <button
                onClick={() => loadTeamFixture(selectedTeamFilter.teamName, nextFetchDate, true)}
                disabled={loadingFixture}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                {loadingFixture ? "Cargando..." : "➕ Cargar próxima semana"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Barra de Filtros de Ligas */}
      {!selectedTeamFilter && leagues.length > 0 && (
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

      {loading ? (
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <p style={{ opacity: 0.7 }}>Cargando partidos...</p>
        </div>
      ) : filteredLeagues.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.6, padding: "40px" }}>No hay torneos seleccionados o partidos para mostrar en esta fecha.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filteredLeagues.map((league) => (
            <section key={league.id} style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.15)", borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
                <Link 
                  href={`/posiciones?leagueId=${league.id}&name=${encodeURIComponent(league.name)}`}
                  style={{ color: "#10b981", padding: "10px 16px", fontWeight: "bold", fontSize: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}
                  title="Ver tabla de posiciones"
                >
                  <span>🏆 {league.name} ({league.country_name})</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: "normal", opacity: 0.8 }}>Ver posiciones ↗</span>
                </Link>
              </div>

              <div>
                {league.games
                  .filter(game => {
                    if (!selectedTeamFilter || !selectedTeamFilter.leagueId) return true;
                    return game.teams.some(t => t.name.toLowerCase() === selectedTeamFilter.teamName.toLowerCase());
                  })
                  .map((game) => {
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

                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", justifyContent: "space-between" }}>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", textAlign: "right" }}>
                              <span style={{ fontWeight: 500 }}>{teamA.name}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", fontWeight: "bold", fontSize: "1.1rem", gap: "8px", minWidth: "120px", textAlign: "center" }}>
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