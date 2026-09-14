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

    // Leemos directo de Redis (los partidos de hoy sincronizados cada 1 min)
    const cachedData = await redis.get('chiquifutbol_matches_v2');

    if (!cachedData) {
      return NextResponse.json({ matches: [], error: "No hay partidos en vivo sincronizados." });
    }

    const data = JSON.parse(cachedData);
    const searchNormalized = teamName.toLowerCase().trim();
    const matchesFound = [];

    // Estructura segura para recorrer los partidos que trae tu API de Promiedos desde Redis
    const leagues = data.leagues || data.torneos || data.jugos || [];

    leagues.forEach(league => {
      const games = league.games || league.partidos || [];
      games.forEach(game => {
        const local = (game.local?.name || game.local || "").toString().toLowerCase();
        const visitante = (game.visitante?.name || game.visitante || "").toString().toLowerCase();

        if (local.includes(searchNormalized) || visitante.includes(searchNormalized)) {
          matchesFound.push({
            id: game.id || Math.random().toString(36).substring(2, 9),
            team: game.local?.name || game.local,
            rival: game.visitante?.name || game.visitante,
            scoreLocal: game.local?.score ?? "",
            scoreVisitante: game.visitante?.score ?? "",
            status: game.status || game.time || "En juego"
          });
        }
      });
    });

    return NextResponse.json({
      matches: matchesFound.slice(0, 2),
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error en la búsqueda por equipo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    await redis.quit();
  }
}