import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("leagueId");

    console.log(`Buscando posiciones para leagueId: ${leagueId}`);

    // Probamos primero con la clave específica de la liga
    let redisKey = leagueId ? `chiquifutbol_standings_${leagueId}` : "chiquifutbol_standings";
    let data = await redis.get(redisKey);

    // Si no existe, probamos con la clave genérica o buscamos claves disponibles
    if (!data) {
      console.log(`No se encontró con la clave: ${redisKey}, probando clave genérica...`);
      data = await redis.get("chiquifutbol_standings");
    }

    if (!data) {
      // Opcional: listar las keys que hay en redis para debuguear en la terminal
      const keys = await redis.keys("*");
      console.log("Claves disponibles en Redis:", keys);

      return NextResponse.json(
        { error: `No hay datos en Redis para la clave ${redisKey}` }, 
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error en API /api/standings:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}