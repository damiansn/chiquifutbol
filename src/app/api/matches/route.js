import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const cachedData = await redis.get('live_matches');
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }

        // Consultamos los partidos de la fecha actual a nivel global
        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
        });

        const matches = response.data.matches.slice(0, 6).map((m) => ({
            match_id: m.id.toString(),
            tournament: m.competition.name,
            status: m.status === 'IN_PLAY' ? 'LIVE' : m.status,
            minute: m.status === 'IN_PLAY' ? "En juego" : (m.status === 'FINISHED' ? 'Finalizado' : 'Próximamente'),
            home_team: { name: m.homeTeam.name, goals: m.score.fullTime.home ?? 0 },
            away_team: { name: m.awayTeam.name, goals: m.score.fullTime.away ?? 0 },
            stadium: m.venue || "Estadio Oficial"
        }));

        await redis.set('live_matches', JSON.stringify(matches), 'EX', 300);

        return NextResponse.json(matches);

    } catch (error) {
        console.error("Error al obtener partidos:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}