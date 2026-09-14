import { NextResponse } from "next/server";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    // Consultamos los partidos en vivo/hoy cacheados en Redis por tu sincronizador
    const rawMatches = await redis.get('chiquifutbol_matches_v2');
    
    if (!rawMatches) {
      return NextResponse.json({ matches: [], error: "No hay partidos sincronizados en este momento." });
    }

    const data = JSON.parse(rawMatches);
    const searchNormalized = teamName.toLowerCase().trim();
    const matchesFound = [];

    // Recorremos la estructura JSON que devuelve la API de Promiedos desde Redis
    // (Asume la estructura habitual de Ligas y Partidos de Promiedos)
    const leagues = data.leagues || data.torneos || [];

    leagues.forEach(league => {
      const games = league.games || league.partidos || [];
      games.forEach(game => {
        // Extraemos nombres de local y visitante con seguridad
        const localName = (game.local?.name || game.local || "").toString().toLowerCase();
        const visitanteName = (game.visitante?.name || game.visitante || "").toString().toLowerCase();

        if (localName.includes(searchNormalized) || visitanteName.includes(searchNormalized)) {
          matchesFound.push({
            id: game.id || Math.random().toString(36).substring(2, 9),
            rawText: `${game.local?.name || game.local} vs ${game.visitante?.name || game.visitante}`,
            league: league.name || league.torneo || "Liga Profesional",
            date: "Hoy",
            time: game.time || game.status || "En juego",
            scoreLocal: game.local?.score ?? "",
            scoreVisitante: game.visitante?.score ?? "",
            status: game.status || ""
          });
        }
      });
    });

    return NextResponse.json({
      matches: matchesFound.slice(0, 2),
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error al consultar Redis en route.js:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    // Cerramos la conexión de Redis para evitar fugas de memoria en cada request
    await redis.quit();
  }
}