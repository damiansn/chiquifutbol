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

        const response = await axios.get('https://api.football-data.org/v4/matches', {
            headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY }
        });

        const now = new Date();

        const matches = response.data.matches.map((m) => {
            let statusText = 'Próximamente';
            let minuteStr = '';

            if (m.status === 'IN_PLAY') {
                // Calculamos los minutos transcurridos desde que empezó el partido
                const startDate = new Date(m.utcDate);
                const diffMinutes = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60));
                
                // Ajuste básico por si arranca el segundo tiempo (sumando 15 min de entretiempo aprox o usando el tiempo corrido)
                let calculatedMinute = diffMinutes;
                if (calculatedMinute > 45 && calculatedMinute < 60) {
                    calculatedMinute = 45; // Entretiempo o descuento del 1ero
                } else if (calculatedMinute >= 60) {
                    calculatedMinute = diffMinutes - 15; // Descontando el entretiempo para el segundo tiempo
                }
                
                if (calculatedMinute < 1) calculatedMinute = 1;
                if (calculatedMinute > 90) calculatedMinute = 90;

                minuteStr = `${calculatedMinute}'`;
                statusText = minuteStr;
            } else if (m.status === 'PAUSED') {
                minuteStr = 'ET';
                statusText = 'Entretiempo';
            } else if (m.status === 'FINISHED') {
                minuteStr = 'Finalizado';
                statusText = 'Finalizado';
            } else {
                // Si es un partido futuro, mostramos la hora local de inicio
                const startDate = new Date(m.utcDate);
                minuteStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                statusText = minuteStr;
            }

            return {
                match_id: m.id.toString(),
                tournament: m.competition.name,
                status: m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'LIVE' : m.status,
                minute: minuteStr,
                home_team: { name: m.homeTeam.name, goals: m.score.fullTime.home ?? 0 },
                away_team: { name: m.awayTeam.name, goals: m.score.fullTime.away ?? 0 },
                stadium: m.venue || "Estadio Oficial"
            };
        });

        await redis.set('live_matches_v2', JSON.stringify(matches), 'EX', 60);

        return NextResponse.json(matches);

    } catch (error) {
        console.error("Error al obtener partidos:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}