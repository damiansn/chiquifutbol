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
  brasil: {
    nombre: "Brasileirao",
    redis: "chiquifutbol_brasil",
  },

  chile: {
    nombre: "Liga de Primera",
    redis: "chiquifutbol_chile",
  },

  uruguay: {
    nombre: "Liga AUF Uruguaya",
    redis: "chiquifutbol_uruguay",
  },

  premier_league: {
    nombre: "Premier League",
    redis: "chiquifutbol_premier_league",
  },

  efl_cup: {
    nombre: "EFL Cup",
    redis: "chiquifutbol_efl_cup",
  },

  fa_cup: {
    nombre: "FA Cup",
    redis: "chiquifutbol_fa_cup",
  },

  laliga: {
    nombre: "LaLiga",
    redis: "chiquifutbol_laliga",
  },

  copa_del_rey: {
    nombre: "Copa del Rey",
    redis: "chiquifutbol_copa_del_rey",
  },

  supercopa_espana: {
    nombre: "Supercopa de España",
    redis: "chiquifutbol_supercopa_espana",
  },

  serie_a: {
    nombre: "Serie A",
    redis: "chiquifutbol_serie_a",
  },

  coppa_italia: {
    nombre: "Coppa Italia",
    redis: "chiquifutbol_coppa_italia",
  },

  supercoppa_italiana: {
    nombre: "Supercoppa Italiana",
    redis: "chiquifutbol_supercoppa_italiana",
  },

  bundesliga: {
    nombre: "Bundesliga",
    redis: "chiquifutbol_bundesliga",
  },

  dfb_pokal: {
    nombre: "DFB Pokal",
    redis: "chiquifutbol_dfb_pokal",
  },

  liga_portugal: {
    nombre: "Liga Portugal",
    redis: "chiquifutbol_liga_portugal",
  },

  ligue_1: {
    nombre: "Ligue 1",
    redis: "chiquifutbol_ligue_1",
  },

  coupe_de_france: {
    nombre: "Coupe de France",
    redis: "chiquifutbol_coupe_de_france",
  },

  u20_world_cup: {
    nombre: "Mundial Sub-20",
    redis: "chiquifutbol_u20_world_cup",
  },

  copa_america: {
    nombre: "Copa América",
    redis: "chiquifutbol_copa_america",
  },

  eliminatorias_conmebol: {
    nombre: "Eliminatorias CONMEBOL",
    redis: "chiquifutbol_eliminatorias_conmebol",
  },

  eliminatorias_uefa: {
    nombre: "Eliminatorias UEFA",
    redis: "chiquifutbol_eliminatorias_uefa",
  },

  eliminatorias_concacaf: {
    nombre: "Eliminatorias CONCACAF",
    redis: "chiquifutbol_eliminatorias_concacaf",
  },

  euro: {
    nombre: "Eurocopa",
    redis: "chiquifutbol_euro",
  },

  repechaje_mundial: {
    nombre: "Repechaje Mundial",
    redis: "chiquifutbol_repechaje_mundial",
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
