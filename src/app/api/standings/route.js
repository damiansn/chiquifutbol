import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// =========================================================
// EQUIPOS DE PROMIEDOS
// team_id -> nombre del equipo
// =========================================================

const EQUIPOS_PROMIEDOS = {
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


// =========================================================
// AGREGAR NOMBRE DEL EQUIPO A LAS ESTADÍSTICAS
// =========================================================

function agregarEquiposAEstadisticas(playersStatistics) {
  if (!playersStatistics) {
    return playersStatistics;
  }

  if (!Array.isArray(playersStatistics.tables)) {
    return playersStatistics;
  }

  return {
    ...playersStatistics,

    tables: playersStatistics.tables.map((tabla) => {

      let rows = [];
      let tipo = null;

      // -----------------------------------------------
      // Caso 1:
      // tabla.rows
      // -----------------------------------------------

      if (Array.isArray(tabla?.rows)) {
        rows = tabla.rows;
        tipo = "rows";
      }

      // -----------------------------------------------
      // Caso 2:
      // tabla.table.rows
      // -----------------------------------------------

      else if (Array.isArray(tabla?.table?.rows)) {
        rows = tabla.table.rows;
        tipo = "table";
      }

      // Si no encontramos filas, dejamos la tabla igual
      if (!rows.length) {
        return tabla;
      }

      // -----------------------------------------------
      // Agregamos team_name
      // -----------------------------------------------

      const nuevasRows = rows.map((fila) => {

        const teamId =
          fila?.entity?.object?.team_id ||
          fila?.team_id ||
          null;

        const teamName =
          teamId && EQUIPOS_PROMIEDOS[teamId]
            ? EQUIPOS_PROMIEDOS[teamId]
            : "-";

        return {
          ...fila,

          // También lo dejamos directamente en la fila
          team_id: teamId,
          team_name: teamName,

          // Y dentro de entity.object
          entity: {
            ...fila?.entity,

            object: {
              ...fila?.entity?.object,

              team_id: teamId,
              team_name: teamName,
            },
          },
        };
      });

      // -----------------------------------------------
      // Reconstruimos la tabla respetando su estructura
      // -----------------------------------------------

      if (tipo === "rows") {
        return {
          ...tabla,
          rows: nuevasRows,
        };
      }

      if (tipo === "table") {
        return {
          ...tabla,

          table: {
            ...tabla.table,
            rows: nuevasRows,
          },
        };
      }

      return tabla;
    }),
  };
}


// =========================================================
// API
// =========================================================

export async function GET(request) {
  try {

    // ---------------------------------------------------
    // Leer datos principales desde Redis
    // ---------------------------------------------------

    let data = await redis.get(
      "chiquifutbol_standings"
    );

    if (!data) {
      data = await redis.get(
        "chiquifutbol_standings_1"
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "No hay datos estructurados en Redis.",
        },
        {
          status: 404,
        }
      );
    }


    // ---------------------------------------------------
    // Convertir JSON
    // ---------------------------------------------------

    const json = JSON.parse(data);


    // ---------------------------------------------------
    // Agregar nombres de equipos a jugadores
    // ---------------------------------------------------

    if (json?.players_statistics) {

      json.players_statistics =
        agregarEquiposAEstadisticas(
          json.players_statistics
        );

    }


    // ---------------------------------------------------
    // DEBUG
    // ---------------------------------------------------

    console.log(
      "=========================================="
    );

    console.log(
      "ESTADISTICAS DE JUGADORES PROCESADAS"
    );

    const primeraTabla =
      json?.players_statistics?.tables?.[0];

    const primerasFilas =
      primeraTabla?.rows ||
      primeraTabla?.table?.rows ||
      [];

    if (primerasFilas.length > 0) {

      console.log(
        JSON.stringify(
          primerasFilas[0],
          null,
          2
        )
      );

    }

    console.log(
      "=========================================="
    );


    // ---------------------------------------------------
    // Devolver datos
    // ---------------------------------------------------

    return NextResponse.json(json);

  } catch (error) {

    console.error(
      "Error en API /api/standings:",
      error.message
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );

  }
}

