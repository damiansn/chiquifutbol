'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournaments, setSelectedTournaments] = useState([]);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        // Seleccionamos todos los torneos por defecto automáticamente al recibir los datos
        const uniqueTournaments = [...new Set(data.map((m) => m.tournament))];
        setSelectedTournaments(uniqueTournaments);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando partidos:', err);
        setLoading(false);
      });
  }, []);

  const allTournaments = [...new Set(matches.map((m) => m.tournament))];

  const handleCheckboxChange = (tournament) => {
    if (selectedTournaments.includes(tournament)) {
      setSelectedTournaments(selectedTournaments.filter((t) => t !== tournament));
    } else {
      setSelectedTournaments([...selectedTournaments, tournament]);
    }
  };

  const filteredMatches = matches.filter((m) => selectedTournaments.includes(m.tournament));

  if (loading) {
    return (
      <main style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>Cargando partidos en vivo...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Encabezado */}
        <header style={{ backgroundColor: '#1b4d3e', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>⚽ ChiquiFútbol</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>Resultados en vivo</p>
        </header>

        {/* Panel de Filtros por Torneo */}
        {allTournaments.length > 0 && (
          <div style={{ backgroundColor: 'white', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>Filtrar torneos:</span>
              <button 
                onClick={() => setSelectedTournaments(selectedTournaments.length === allTournaments.length ? [] : allTournaments)}
                style={{ background: 'none', border: 'none', color: '#1b4d3e', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {selectedTournaments.length === allTournaments.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {allTournaments.map((tourney) => (
                <label key={tourney} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer', gap: '6px', color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={selectedTournaments.includes(tourney)}
                    onChange={() => handleCheckboxChange(tourney)}
                    style={{ cursor: 'pointer', accentColor: '#1b4d3e' }}
                  />
                  {tourney}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Listado de Partidos */}
        {filteredMatches.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No hay partidos seleccionados o disponibles para mostrar.</p>
        ) : (
          filteredMatches.map((match) => (
            <div key={match.match_id} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              
              <div style={{ backgroundColor: '#e9ecef', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between' }}>
                <span>{match.tournament}</span>
                <span style={{ color: match.status === 'LIVE' ? '#d9534f' : '#666' }}>
                  {match.status === 'LIVE' ? `🔴 ${match.minute}` : match.minute}
                </span>
              </div>

              <div style={{ padding: '12px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '16px' }}>
                  <span style={{ fontWeight: match.home_team.goals > match.away_team.goals ? 'bold' : 'normal', color: '#222' }}>
                    {match.home_team.name}
                  </span>
                  <span style={{ backgroundColor: '#f1f3f5', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#222' }}>
                    {match.home_team.goals}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px' }}>
                  <span style={{ fontWeight: match.away_team.goals > match.home_team.goals ? 'bold' : 'normal', color: '#222' }}>
                    {match.away_team.name}
                  </span>
                  <span style={{ backgroundColor: '#f1f3f5', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#222' }}>
                    {match.away_team.goals}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8f9fa', padding: '6px 15px', fontSize: '12px', color: '#666', borderTop: '1px solid #eee' }}>
                Estadio: {match.stadium}
              </div>

            </div>
          ))
        )}

      </div>
    </main>
  );
}