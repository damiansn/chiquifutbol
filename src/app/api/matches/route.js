import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
    try {
        const response = await axios.get('https://www.tycsports.com/datos/api/resultados/hoy');
        
        console.log("RESPUESTA TYC:", JSON.stringify(response.data).substring(0, 300));
        
        return NextResponse.json([]);
    } catch (error) {
        console.error("ERROR EN RUTA:", error.response?.status, error.message);
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}