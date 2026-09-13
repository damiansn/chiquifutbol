import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    // Forzamos siempre la lectura de la clave principal donde el scraper guarda todo junto ({ tables, stats })
    let data = await redis.get("chiquifutbol_standings");

    if (!data) {
      data = await redis.get("chiquifutbol_standings_1");
    }

    if (!data) {
      return NextResponse.json(
        { error: "No hay datos estructurados en Redis." }, 
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error en API /api/standings:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}