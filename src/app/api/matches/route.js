import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date') || 'today';

        let redisKey = 'chiquifutbol_matches_v2'; // por defecto hoy
        if (dateParam === 'ayer') {
            redisKey = 'chiquifutbol_matches_ayer';
        } else if (dateParam === 'manana') {
            redisKey = 'chiquifutbol_matches_manana';
        }

        const cachedData = await redis.get(redisKey);
        if (!cachedData) {
            return NextResponse.json({ error: "No hay partidos sincronizados todavía para esta fecha." }, { status: 404 });
        }

        return NextResponse.json(JSON.parse(cachedData));
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}