import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const cachedData = await redis.get('chiquifutbol_matches_v2');
        if (!cachedData) {
            return NextResponse.json({ error: "No hay partidos sincronizados todavía." }, { status: 404 });
        }

        return NextResponse.json(JSON.parse(cachedData));
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}