import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const REDIS_TEAM_FIXTURES = "chiquifutbol_team_fixtures";

// ==========================================
// EQUIPOS DE PRIMERA
// ==========================================

const EQUIPOS = {
  ihc: "Vélez Sarsfield",
  hcbh: "Defensa y Justicia",
  bbjbf: "Gimnasia Mendoza",
  hchc: "Instituto",
  igg: "Boca Juniors",
  ihe: "Independiente",
  igj: "Lanús",
  hcag: "Unión",
  ihh: "Newell's Old Boys",
  igf: "San Lorenzo",
  igh: "Estudiantes de La Plata",
  bbjea: "Deportivo Riestra",
  hcah: "Platense",
  jche: "Talleres",
  beafh: "Central Córdoba",
  ihb: "Argentinos Juniors",
  hbbh: "Sarmiento",
  iia: "Gimnasia La Plata",
  ihf: "Rosario Central",
  hcch: "Independiente Rivadavia",
  fhid: "Belgrano",
  igi: "River Plate",
  gbfc: "Atlético Tucumán",
  iie: "Huracán",
  iid: "Tigre",
  jafb: "Barracas Central",
  ihi: "Banfield",
  bheaf: "Estudiantes Río Cuarto",
  hccd: "Aldosivi",
  ihg: "Racing Club",
};

// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================

function buscarEquipo(parametro) {
  const valor = normalizarTexto(parametro);

  if (!valor) {
    return null;
  }

  // Buscar primero por ID
  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    if (normalizarTexto(id) === valor) {
      return {
        id,
        name: nombre,
      };
    }
  }

  // Buscar por nombre exacto
  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    if (normalizarTexto(nombre) === valor) {
      return {
        id,
        name: nombre,
      };
    }
  }

  // Buscar coincidencia parcial
  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    const idNormalizado = normalizarTexto(id);
    const nombreNormalizado = normalizarTexto(nombre);

    if (
      idNormalizado.includes(valor) ||
      valor.includes(idNormalizado) ||
      nombreNormalizado.includes(valor) ||
      valor.includes(nombreNormalizado)
    ) {
      return {
        id,
        name: nombre,
      };
    }
  }

  // Alias frecuentes
  const alias = {
    river: "igi",
    "riverplate": "igi",
    boca: "igg",
    "bocajuniors": "igg",
    independiente: "ihe",
    racing: "ihg",
    "racingclub": "ihg",
    sanlorenzo: "igf",
    lanus: "igj",
    estudiantes: "igh",
    platense: "hcah",
    huracan: "iie",
    banfield: "ihi",
    tigre: "iid",
    belgrano: "fhid",
    argentinos: "ihb",
    "argentinosjuniors": "ihb",
    talleres: "jche",
    union: "hcag",
    sarmiento: "hbbh",
    gimnasia: "iia",
    rosariocentral: "ihf",
    aldosivi: "hccd",
    "defensayjusticia": "hcbh",
  };

  if (alias[valor]) {
    const id = alias[valor];

    return {
      id,
      name: EQUIPOS[id],
    };
  }

  return null;
}

// ==========================================
// GET
// ==========================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const teamParam = searchParams.get("team");

    if (!teamParam) {
      return NextResponse.json(
        {
          error: "Falta el parámetro team",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // RESOLVER EQUIPO
    // ==========================================

    const equipo = buscarEquipo(teamParam);

    if (!equipo) {
      return NextResponse.json(
        {
          error: "Equipo no encontrado",
          query: teamParam,
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // LEER REDIS
    // ==========================================

    const raw = await redis.get(REDIS_TEAM_FIXTURES);

    if (!raw) {
      return NextResponse.json({
        team: equipo,
        matches: [],
        fixtures: [],
        nextDateParam: null,
        source: "redis",
        message: "Todavía no hay fixtures sincronizados",
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error("Error parseando Redis:", error);

      return NextResponse.json(
        {
          error: "Los datos de fixtures almacenados en Redis no son válidos",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // OBTENER FIXTURES DEL EQUIPO
    // ==========================================

    let fixtures = [];

    // Formato esperado:
    // {
    //   "igi": [...]
    // }

    if (Array.isArray(data?.[equipo.id])) {
      fixtures = data[equipo.id];
    }

    // Por si el sincronizador guarda:
    // {
    //   "teams": {
    //      "igi": [...]
    //   }
    // }

    if (
      fixtures.length === 0 &&
      data?.teams &&
      Array.isArray(data.teams[equipo.id])
    ) {
      fixtures = data.teams[equipo.id];
    }

    // Por si guarda:
    // {
    //   "fixtures": {
    //      "igi": [...]
    //   }
    // }

    if (
      fixtures.length === 0 &&
      data?.fixtures &&
      Array.isArray(data.fixtures[equipo.id])
    ) {
      fixtures = data.fixtures[equipo.id];
    }

    // ==========================================
    // RESPUESTA
    // ==========================================

    return NextResponse.json({
      team: equipo,
      matches: fixtures,
      fixtures,
      nextDateParam: null,
      source: "redis",
    });
  } catch (error) {
    console.error("ERROR API TEAM FIXTURE:", error);

    return NextResponse.json(
      {
        error: error.message || "Error interno",
      },
      {
        status: 500,
      }
    );
  }
}