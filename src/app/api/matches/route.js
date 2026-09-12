import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const cachedData = await redis.get('live_matches_v2');
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }

        // Consultamos los partidos del día actual a nivel global
        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
        });

        // Mapeamos todos los partidos sin cortar con .slice(0, 6)
        const matches = response.data.matches.map((m) => {
            let statusText = 'Próximamente';
            if (m.status === 'IN_PLAY') {
                statusText = 'En juego';
            } else if (m.status === 'PAUSED') {
                statusText = 'Entretiempo';
            } else if (m.status === 'FINISHED') {
                statusText = 'Finalizado';
            }

            return {
                match_id: m.id.toString(),
                tournament: m.competition.name,
                status: m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'LIVE' : m.status,
                minute: statusText,
                home_team: { name: m.homeTeam.name, goals: m.score.fullTime.home ?? 0 },
                away_team: { name: m.awayTeam.name, goals: m.score.fullTime.away ?? 0 },
                stadium: m.venue || "Estadio Oficial"
            };
        });

        // Guardamos en caché por 60 segundos (para que refresque más rápido los goles en vivo)
        await redis.set('live_matches_v2', JSON.stringify(matches), 'EX', 60);

        return NextResponse.json(matches);

    } catch (error) {
        console.error("Error al obtener partidos:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}