import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const REDIS_TEAM_FIXTURES = "chiquifutbol_team_fixtures";

// ==========================================
// EQUIPOS DE PRIMERA ARGENTINA
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
// LISTA PARA EL BUSCADOR
// ==========================================

function obtenerListaEquipos() {
  return Object.entries(EQUIPOS).map(([id, nombre]) => ({
    id,
    name: nombre,
    nombre,
  }));
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================

function buscarEquipo(parametro) {
  const valor = normalizarTexto(parametro);

  if (!valor) {
    return null;
  }

  // ------------------------------------------
  // ID EXACTO
  // ------------------------------------------

  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    if (normalizarTexto(id) === valor) {
      return {
        id,
        name: nombre,
        nombre,
      };
    }
  }

  // ------------------------------------------
  // NOMBRE EXACTO
  // ------------------------------------------

  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    if (normalizarTexto(nombre) === valor) {
      return {
        id,
        name: nombre,
        nombre,
      };
    }
  }

  // ------------------------------------------
  // ALIAS
  // ------------------------------------------

  const alias = {
    river: "igi",
    riverplate: "igi",

    boca: "igg",
    bocajuniors: "igg",

    independiente: "ihe",

    racing: "ihg",
    racingclub: "ihg",

    sanlorenzo: "igf",

    lanus: "igj",

    estudiantes: "igh",
    estudiantesdelaplata: "igh",

    platense: "hcah",

    huracan: "iie",

    banfield: "ihi",

    tigre: "iid",

    belgrano: "fhid",

    argentinos: "ihb",
    argentinosjuniors: "ihb",

    talleres: "jche",
    tallerescordoba: "jche",

    union: "hcag",
    unionsantaafe: "hcag",

    sarmiento: "hbbh",
    sarmientodejunin: "hbbh",

    gimnasia: "iia",
    gimnasialaplata: "iia",

    rosariocentral: "ihf",

    aldosivi: "hccd",

    defensayjusticia: "hcbh",

    velez: "ihc",
    velezsarsfield: "ihc",

    instituto: "hchc",
    instituto: "hchc",

    newells: "ihh",
    newellsoldboys: "ihh",

    riestra: "bbjea",
    deportivoriestra: "bbjea",

    centralcordoba: "beafh",
    centralcordobasantiago: "beafh",

    independientemendoza: "hcch",
    independienterivadavia: "hcch",

    atletico: "gbfc",
    atleticotucuman: "gbfc",

    gimnasiamendoza: "bbjbf",
    gimnasiamendoza: "bbjbf",

    estudiantesriocuarto: "bheaf",
    barracas: "jafb",
    barracascentral: "jafb",
  };

  if (alias[valor]) {
    const id = alias[valor];

    return {
      id,
      name: EQUIPOS[id],
      nombre: EQUIPOS[id],
    };
  }

  // ------------------------------------------
  // COINCIDENCIA PARCIAL
  // ------------------------------------------

  for (const [id, nombre] of Object.entries(EQUIPOS)) {
    const idNormalizado = normalizarTexto(id);
    const nombreNormalizado = normalizarTexto(nombre);

    if (
      nombreNormalizado.includes(valor) ||
      valor.includes(nombreNormalizado) ||
      idNormalizado.includes(valor) ||
      valor.includes(idNormalizado)
    ) {
      return {
        id,
        name: nombre,
        nombre,
      };
    }
  }

  return null;
}

// ==========================================
// OBTENER FIXTURES DESDE REDIS
// ==========================================

function obtenerFixtures(data, equipoId) {
  // Formato:
  // {
  //   "igi": [...]
  // }

  if (data && Array.isArray(data[equipoId])) {
    return data[equipoId];
  }

  // Formato:
  // {
  //   "teams": {
  //      "igi": [...]
  //   }
  // }

  if (
    data?.teams &&
    Array.isArray(data.teams[equipoId])
  ) {
    return data.teams[equipoId];
  }

  // Formato:
  // {
  //   "fixtures": {
  //      "igi": [...]
  //   }
  // }

  if (
    data?.fixtures &&
    Array.isArray(data.fixtures[equipoId])
  ) {
    return data.fixtures[equipoId];
  }

  return [];
}

// ==========================================
// GET
// ==========================================

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const teamParam = searchParams.get("team");
    const listParam = searchParams.get("list");

    // ==========================================
    // LISTA DE EQUIPOS
    // ==========================================

    if (listParam === "true") {
      return NextResponse.json(obtenerListaEquipos(), {
        status: 200,
      });
    }

    // ==========================================
    // SI NO VIENE EQUIPO
    // ==========================================

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
    // BUSCAR EQUIPO
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
      });
    }

    // ==========================================
    // PARSEAR REDIS
    // ==========================================

    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error(
        "ERROR PARSEANDO chiquifutbol_team_fixtures:",
        error
      );

      return NextResponse.json(
        {
          error: "Los datos de fixtures de Redis no son válidos",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // OBTENER FIXTURES
    // ==========================================

    const fixtures = obtenerFixtures(
      data,
      equipo.id
    );

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
    console.error(
      "ERROR API TEAM FIXTURE:",
      error
    );

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