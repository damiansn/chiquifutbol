import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        // Usamos una nueva clave en Redis para los datos de Promiedos
        const cachedData = await redis.get('promiedos_live_v1');
        if (cachedData) {
            return NextResponse.json(JSON.parse(cachedData));
        }

        // Llamada directa a la API interna de Promiedos
        const response = await axios.get('https://api.promiedos.com.ar/games/today', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
                'Referer': 'http://www.promiedos.com.ar/'
            }
        });

        // Parseamos la respuesta según la estructura que devuelve Promiedos
        // (Nota: acá procesamos el JSON que te devuelve la API adaptándolo a tu formato)
        const rawData = response.data;
        let formattedMatches = [];

        // Dependiendo de cómo venga estructurado el JSON de Promiedos, recorremos las categorías/torneos
        // (Por lo general viene organizado por torneos o un listado global de partidos)
        if (Array.isArray(rawData)) {
            formattedMatches = rawData.flatMap((tournamentGroup) => {
                const tournamentName = tournamentGroup.name || tournamentGroup.torneo || "Liga Profesional";
                const matchesList = tournamentGroup.games || tournamentGroup.partidos || [];

                return matchesList.map((m) => ({
                    match_id: (m.id || m.game_id || Math.random()).toString(),
                    tournament: tournamentName,
                    status: m.estado === 1 || m.status === 'LIVE' ? 'LIVE' : (m.estado === 3 ? 'FINISHED' : 'NS'),
                    minute: m.minuto || m.minute || (m.estado === 1 ? 'En juego' : 'Próximamente'),
                    home_team: { 
                        name: m.local || m.home_team || 'Local', 
                        goals: m.goles_local ?? m.home_goals ?? 0 
                    },
                    away_team: { 
                        name: m.visita || m.away_team || 'Visitante', 
                        goals: m.goles_visita ?? m.away_goals ?? 0 
                    },
                    stadium: m.estadio || "Estadio Oficial"
                }));
            });
        } else if (rawData.games || rawData.partidos) {
            // Si viene en otro formato de objeto plano
            const list = rawData.games || rawData.partidos;
            formattedMatches = list.map((m) => ({
                match_id: (m.id || Math.random()).toString(),
                tournament: m.torneo || "Fútbol",
                status: m.estado === 1 ? 'LIVE' : 'FINISHED',
                minute: m.minuto || 'En juego',
                home_team: { name: m.local, goals: m.goles_local ?? 0 },
                away_team: { name: m.visita, goals: m.goles_visita ?? 0 },
                stadium: m.estadio || "Estadio Oficial"
            }));
        }

        // Guardamos en caché por 30 segundos para no saturar
        await redis.set('promiedos_live_v1', JSON.stringify(formattedMatches), 'EX', 30);

        return NextResponse.json(formattedMatches);

    } catch (error) {
        console.error("Error al consultar la API de Promiedos:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}