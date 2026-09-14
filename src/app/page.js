"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState("today"); 
  const [hiddenLeagues, setHiddenLeagues] = useState([]);

  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null);
  const [showFullFixture, setShowFullFixture] = useState(false);
  const [teamFixtureData, setTeamFixtureData] = useState([]);
  const [nextFetchDate, setNextFetchDate] = useState(null);
  const [loadingFixture, setLoadingFixture] = useState(false);

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
    setShowFullFixture(false);
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

      if (append) {
        setTeamFixtureData(prev => [...prev, ...(json.matches || [])]);
      } else {
        setTeamFixtureData(json.matches || []);
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
  const filteredLeagues = selectedTeamFilter 
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
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: "16px", maxWidth: "450px", margin: "0 auto 16px auto" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="🔍 Buscar equipo..."
            value={teamSearchQuery}
            onChange={(e) => {
              setTeamSearchQuery(e.target.value);
              if (!e.target.value) handleClearTeamFilter();
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
              style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          )}
        </div>

        {filteredSuggestions.length > 0 && !selectedTeamFilter && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#18181b", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", overflowY: "auto", zIndex: 50 }}>
            {filteredSuggestions.map((item, idx) => (
              <div
                key={`${item.teamName}-${idx}`}
                onClick={() => handleSelectTeam(item)}
                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(128,128,128,0.1)", display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ fontWeight: "600" }}>{item.teamName}</span>
                <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{item.leagueName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeamFilter && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <button
            onClick={() => {
              setShowFullFixture(true);
              if (teamFixtureData.length === 0) {
                loadTeamFixture(selectedTeamFilter.teamName);
              }
            }}
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
          >
            📅 Ver más fechas de {selectedTeamFilter.teamName} hacia adelante
          </button>
        </div>
      )}

      {showFullFixture && (
        <div style={{ border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", padding: "16px", marginBottom: "24px", background: "rgba(128,128,128,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Calendario: {selectedTeamFilter?.teamName}</h3>
            <button onClick={() => setShowFullFixture(false)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Cerrar [X]</button>
          </div>
          
          {teamFixtureData.length === 0 && loadingFixture ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "20px" }}>Buscando partidos...</p>
          ) : teamFixtureData.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "10px" }}>No se encontraron partidos próximos en este rango.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {teamFixtureData.map((match, i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "10px 14px", 
                  borderBottom: "1px dashed rgba(128,128,128,0.15)", 
                  background: "rgba(128,128,128,0.04)", 
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  gap: "10px"
                }}>
                  <span style={{ fontWeight: "500", flex: 1 }}>{match.rawText}</span>
                  
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                      📅 {match.date}
                    </span>
                    {match.time && (
                      <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                        ⏰ {match.time}
                      </span>
                    )}
                  </div>
                </div>
              ))}
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

      {!selectedTeamFilter && leagues.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          {leagues.map((league) => {
            const isHidden = hiddenLeagues.includes(league.id);
            return (
              <button
                key={league.id}
                onClick={() => toggleLeagueFilter(league.id)}
                style={{
                  background: isHidden ? "rgba(128,128,128,0.08)" : "rgba(16, 185, 129, 0.12)",
                  color: isHidden ? "inherit" : "#10b981",
                  border: "1px solid rgba(128,128,128,0.2)",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  textDecoration: isHidden ? "line-through" : "none"
                }}
              >
                {league.name}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px" }}>Cargando partidos...</p>
      ) : filteredLeagues.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px" }}>No hay partidos para mostrar.</p>
      ) : (
        filteredLeagues.map((league) => (
          <div key={league.id} style={{ border: "1px solid rgba(128,128,128,0.2)", borderRadius: "8px", marginBottom: "16px", overflow: "hidden" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px 16px" }}>
              <Link href={`/posiciones?leagueId=${league.id}`} style={{ color: "#10b981", fontWeight: "bold", textDecoration: "none" }}>
                🏆 {league.name}
              </Link>
            </div>
            {league.games.map((game) => (
              <div key={game.id} style={{ display: "flex", padding: "10px 16px", borderBottom: "1px solid rgba(128,128,128,0.1)", justifyContent: "space-between" }}>
                <span>{game.teams[0]?.name} vs {game.teams[1]?.name}</span>
                <span>{game.scores ? `${game.scores[0]} - ${game.scores[1]}` : game.start_time}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </main>
  );
}