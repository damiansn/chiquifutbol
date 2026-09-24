import { NextResponse } from "next/server";
import Redis from "ioredis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  primera_nacional: {
    nombre: "Primera Nacional",
    redis: "chiquifutbol_primera_nacional",
  },

  primera_b_metro: {
    nombre: "Primera B Metropolitana",
    redis: "chiquifutbol_primera_b_metro",
  },

  primera_c: {
    nombre: "Primera C",
    redis: "chiquifutbol_primera_c",
  },

  reserva: {
    nombre: "Torneo de Reserva",
    redis: "chiquifutbol_reserva",
  },

  colombia: {
    nombre: "Liga BetPlay",
    redis: "chiquifutbol_colombia",
  },

  mls: {
    nombre: "MLS",
    redis: "chiquifutbol_mls",
  },

  nations_league: {
    nombre: "UEFA Nations League",
    redis: "chiquifutbol_nations_league",
  },

  paraguay: {
    nombre: "Copa de Primera",
    redis: "chiquifutbol_paraguay",
  },

  mexico: {
    nombre: "Liga MX",
    redis: "chiquifutbol_mexico",
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
    console.log("Competition:", competition);
    console.log("Nombre:", config.nombre);
    console.log("Redis:", config.redis);

    let raw = await redis.get(config.redis);

    // Compatibilidad con la clave anterior de Argentina
    if (!raw && competition === "argentina") {
      raw = await redis.get("chiquifutbol_standings_1");
    }

    if (!raw) {
      console.log("NO HAY DATOS EN REDIS");

      return NextResponse.json(
        {
          error: "No hay datos para esta competencia",
          competition,
          redis: config.redis,
        },
        {
          status: 404,
        }
      );
    }

    const data = JSON.parse(raw);

    console.log("Datos encontrados correctamente");
    console.log("Claves:", Object.keys(data));

    console.log(
      "tables:",
      Array.isArray(data.tables)
        ? data.tables.length
        : "NO ARRAY"
    );

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
      data.players_statistics
        ? "OK"
        : "NO"
    );

    console.log("==========================================");

    /*
     * IMPORTANTE
     *
     * Algunos datos de Promiedos vienen como:
     *
     * tables
     *
     * y otros pueden venir como:
     *
     * tables_groups
     *
     * Para que el frontend pueda trabajar con ambos,
     * creamos tables_groups solamente cuando no existe.
     */

    const tablesGroups =
      Array.isArray(data.tables_groups)
        ? data.tables_groups
        : Array.isArray(data.tables)
          ? data.tables
          : [];

    return NextResponse.json(
      {
        ...data,

        // Compatibilidad para el frontend
        tables_groups: tablesGroups,

        competition: {
          key: competition,
          name: config.nombre,
          redis: config.redis,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "ERROR API STANDINGS:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno",
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
