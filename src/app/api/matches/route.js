import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const cachedData = await redis.get('tyc_live_v1');
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }

        // Endpoint móvil de TyC Sports para resultados en vivo
        const response = await axios.get('https://www.tycsports.com/datos/api/resultados/hoy', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.tycsports.com/'
            }
        });

        const rawData = response.data;
        let formattedMatches = [];

        // Verificamos si responde con un array o un objeto estructurado
        if (Array.isArray(rawData)) {
            formattedMatches = rawData.map((m) => ({
                match_id: (m.id || Math.random()).toString(),
                tournament: m.torneo || m.competition || "Fútbol Argentino",
                status: m.estado === 'En juego' || m.status === 'LIVE' ? 'LIVE' : 'FINISHED',
                minute: m.minuto || 'En juego',
                home_team: { 
                    name: m.local || m.equipoLocal || 'Local', 
                    goals: m.golesLocal ?? 0 
                },
                away_team: { 
                    name: m.visita || m.equipoVisita || 'Visitante', 
                    goals: m.golesVisita ?? 0 
                },
                stadium: m.estadio || "Estadio Oficial"
            }));
        }

        await redis.set('tyc_live_v1', JSON.stringify(formattedMatches), 'EX', 30);

        return NextResponse.json(formattedMatches);

    } catch (error) {
        console.error("Error al consultar TyC:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}