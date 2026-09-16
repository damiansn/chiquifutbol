import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const COMPETENCIAS = {
  argentina: {
    nombre: "Liga Argentina",
    redis: "chiquifutbol_standings",
  },

  libertadores: {
    nombre: "Copa Libertadores",
    redis: "chiquifutbol_libertadores",
  },

  sudamericana: {
    nombre: "Copa Sudamericana",
    redis: "chiquifutbol_sudamericana",
  },

  copa_argentina: {
    nombre: "Copa Argentina",
    redis: "chiquifutbol_copa_argentina",
  },

  champions: {
    nombre: "Champions League",
    redis: "chiquifutbol_champions",
  },

  europa_league: {
    nombre: "Europa League",
    redis: "chiquifutbol_europa_league",
  },

  conference_league: {
    nombre: "Conference League",
    redis: "chiquifutbol_conference_league",
  },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const competition =
      searchParams.get("competition") || "argentina";

    const config =
      COMPETENCIAS[competition] || COMPETENCIAS.argentina;

    console.log("==========================================");
    console.log("API STANDINGS");
    console.log("==========================================");
    console.log("Competencia:", competition);
    console.log("Nombre:", config.nombre);
    console.log("Redis:", config.redis);

    let raw = await redis.get(config.redis);

    // Compatibilidad con la clave anterior de Liga Argentina
    if (!raw && competition === "argentina") {
      raw = await redis.get("chiquifutbol_standings_1");
    }

    if (!raw) {
      return NextResponse.json(
        {
          error: "No hay datos para esta competencia",
          competition,
          redis: config.redis,
        },
        { status: 404 }
      );
    }

    const data = JSON.parse(raw);

    console.log("Datos encontrados correctamente");
    console.log("Claves:", Object.keys(data));

    console.log(
      "tables_groups:",
      Array.isArray(data.tables_groups)
        ? data.tables_groups.length
        : "NO ARRAY"
    );

    console.log(
      "brackets:",
      Array.isArray(data.brackets)
        ? data.brackets.length
        : data.brackets
          ? "EXISTE"
          : "NO"
    );

    console.log(
      "players_statistics:",
      data.players_statistics ? "OK" : "NO"
    );

    console.log("==========================================");

    return NextResponse.json({
      ...data,

      competition: {
        key: competition,
        name: config.nombre,
        redis: config.redis,
      },
    });

  } catch (error) {
    console.error("ERROR API STANDINGS:", error);

    return NextResponse.json(
      {
        error: "Error interno",
        message: error.message,
      },
      { status: 500 }
    );
  }
}