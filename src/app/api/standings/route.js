import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");

    // Si guardas las posiciones por cada liga en Redis (ej: chiquifutbol_standings_123)
    const redisKey = leagueId ? `chiquifutbol_standings_${leagueId}` : "chiquifutbol_standings";
    
    const data = await redis.get(redisKey);
    
    if (!data) {
      // Intentamos buscar la genérica por si acaso
      const fallbackData = await redis.get("chiquifutbol_standings");
      if (!fallbackData) {
        return NextResponse.json({ error: "No hay datos de posiciones disponibles" }, { status: 404 });
      }
      return NextResponse.json(JSON.parse(fallbackData));
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}