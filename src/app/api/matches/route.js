import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const response = await axios.get('https://api.promiedos.com.ar/games/today', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
                'Referer': 'http://www.promiedos.com.ar/'
            }
        });

        // Imprimimos la estructura real en la consola para analizarla
        console.log("ESTRUCTURA DE PROMIEDOS:", JSON.stringify(response.data).substring(0, 500));

        // Por ahora devolvemos un array vacío para ver el log primero
        return NextResponse.json([]);

    } catch (error) {
        console.error("Error:", error.message);
        return NextResponse.json([], { status: 200 });
    }
}