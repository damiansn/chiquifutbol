"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PosicionesPage() {
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
async function cargarTablas() {
try {
setLoading(true);


    const res = await fetch("/api/standings", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("No se pudieron obtener las tablas");
    }

    const json = await res.json();

    console.log("DATOS DE TABLAS RECIBIDOS:", json);
    console.log(
      "DEBUG PLAYERS_STATISTICS:",
      json?.players_statistics
    );

    setData(json);
    setError(null);
  } catch (err) {
    console.error("Error cargando tablas:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

cargarTablas();


}, []);

// =========================================================
// OBTENER VALOR
// =========================================================

function obtenerValor(valores, clave, defecto = "-") {
if (!Array.isArray(valores)) {
return defecto;
}


const encontrado = valores.find(
  (item) => item?.key === clave
);

return encontrado?.value ?? defecto;


}

// =========================================================
// NORMALIZAR POSICIONES
// =========================================================

function normalizarFilas(rows) {
if (!Array.isArray(rows)) {
return [];
}


return rows.map((fila) => {
  const equipo = fila?.entity?.object || {};

  const valores = Array.isArray(fila?.values)
    ? fila.values
    : [];

  return {
    posicion: fila?.num ?? "-",

    equipo:
      equipo.name ||
      equipo.short_name ||
      "Equipo",

    puntos: obtenerValor(
      valores,
      "Points",
      0
    ),

    pj: obtenerValor(
      valores,
      "GamePlayed",
      0
    ),

    ganados: obtenerValor(
      valores,
      "GamesWon",
      0
    ),

    empatados: obtenerValor(
      valores,
      "GamesEven",
      0
    ),

    perdidos: obtenerValor(
      valores,
      "GamesLost",
      0
    ),

    goles: obtenerValor(
      valores,
      "Goals",
      "0:0"
    ),

    diferencia: obtenerValor(
      valores,
      "Ratio",
      0
    ),
  };
});


}

// =========================================================
// EXTRAER TABLAS DE POSICIONES
// =========================================================

function obtenerTablas() {
if (!data) {
return [];
}


const resultado = [];

if (!Array.isArray(data.tables)) {
  return [];
}

data.tables.forEach((torneo) => {
  if (!Array.isArray(torneo?.tables)) {
    return;
  }

  torneo.tables.forEach((grupo) => {
    if (!grupo?.table) {
      return;
    }

    const rows = Array.isArray(
      grupo.table.rows
    )
      ? grupo.table.rows
      : [];

    if (rows.length === 0) {
      return;
    }

    resultado.push({
      torneo:
        torneo.name ||
        "Torneo",

      grupo:
        grupo.name ||
        "Tabla",

      rows,
    });
  });
});

return resultado;


}

// =========================================================
// ESTADÍSTICAS DE JUGADORES
// =========================================================

function obtenerEstadisticasJugadores() {
if (!data?.players_statistics) {
return [];
}


const tables =
  data.players_statistics.tables;

if (!Array.isArray(tables)) {
  return [];
}

const resultado = [];

tables.forEach((tabla, indice) => {
  if (!tabla) {
    return;
  }

  const nombre =
    tabla.name ||
    tabla.title ||
    tabla.label ||
    `Estadísticas ${indice + 1}`;

  let rows = [];

  if (Array.isArray(tabla.rows)) {
    rows = tabla.rows;
  } else if (
    Array.isArray(tabla.table?.rows)
  ) {
    rows = tabla.table.rows;
  } else if (Array.isArray(tabla.data)) {
    rows = tabla.data;
  }

  if (!rows.length) {
    return;
  }

  resultado.push({
    nombre,
    rows,
  });
});

return resultado;


}

// =========================================================
// BUSCADOR RECURSIVO DE NOMBRE
//
// Busca dentro de objetos anidados.
// Esto nos permite encontrar el equipo aunque
// Promiedos no lo entregue directamente como
// entity.team_name.
// =========================================================

function buscarNombreEnObjeto(
objeto,
clavesBuscadas,
profundidad = 0
) {
if (
objeto === null ||
objeto === undefined ||
profundidad > 5
) {
return null;
}


if (
  typeof objeto !== "object"
) {
  return null;
}

for (const clave of clavesBuscadas) {
  const valor = objeto[clave];

  if (
    typeof valor === "string" &&
    valor.trim() !== ""
  ) {
    return valor;
  }

  if (
    valor &&
    typeof valor === "object"
  ) {
    const encontrado =
      buscarNombreEnObjeto(
        valor,
        ["name", "short_name", "team_name", "club_name"],
        profundidad + 1
      );

    if (encontrado) {
      return encontrado;
    }
  }
}

for (const clave in objeto) {
  if (!Object.prototype.hasOwnProperty.call(
    objeto,
    clave
  )) {
    continue;
  }

  const valor = objeto[clave];

  if (
    valor &&
    typeof valor === "object"
  ) {
    const encontrado =
      buscarNombreEnObjeto(
        valor,
        clavesBuscadas,
        profundidad + 1
      );

    if (encontrado) {
      return encontrado;
    }
  }
}

return null;


}

// =========================================================
// NOMBRE DEL JUGADOR
// =========================================================

function obtenerNombreJugador(fila) {
const entity =
fila?.entity?.object || {};


return (
  entity.name ||
  entity.full_name ||
  entity.player_name ||
  fila?.name ||
  fila?.player ||
  fila?.player_name ||
  "Jugador"
);


}

// =========================================================
// EQUIPO DEL JUGADOR
// =========================================================

function obtenerEquipoJugador(fila) {
/*
Primero buscamos los campos más habituales.
*/


const entity =
  fila?.entity?.object || {};

const directo =
  entity?.team?.name ||
  entity?.team?.short_name ||
  entity?.club?.name ||
  entity?.club?.short_name ||
  entity?.team_name ||
  entity?.club_name ||
  fila?.team_name ||
  fila?.club_name ||
  fila?.team?.name ||
  fila?.club?.name;

if (
  directo &&
  typeof directo === "string"
) {
  return directo;
}

/*
  Después buscamos recursivamente dentro
  del objeto completo.
*/

const encontrado =
  buscarNombreEnObjeto(
    fila,
    [
      "team",
      "club",
      "squad",
      "team_name",
      "club_name",
    ]
  );

return encontrado || "-";


}

// =========================================================
// VALORES DE ESTADISTICA
// =========================================================

function obtenerValoresEstadistica(fila) {
if (Array.isArray(fila?.values)) {
return fila.values;
}


if (Array.isArray(fila?.stats)) {
  return fila.stats;
}

return [];


}

// =========================================================
// VALOR COMO TEXTO
// =========================================================

function valorComoTexto(valor) {
if (
valor === null ||
valor === undefined
) {
return "-";
}


if (typeof valor === "object") {
  if (Array.isArray(valor)) {
    return valor.join(", ");
  }

  return (
    valor.value ??
    valor.name ??
    JSON.stringify(valor)
  );
}

return String(valor);

}

// =========================================================
// COLUMNAS DE ESTADISTICA
// =========================================================

function obtenerColumnasEstadistica(rows) {
const columnas = [];


if (!Array.isArray(rows)) {
  return columnas;
}

rows.forEach((fila) => {
  const valores =
    obtenerValoresEstadistica(fila);

  valores.forEach((valor) => {
    if (!valor) {
      return;
    }

    const key =
      valor.key ||
      valor.name ||
      valor.label;

    if (
      key &&
      !columnas.includes(key)
    ) {
      columnas.push(key);
    }
  });
});

return columnas;


}

// =========================================================
// VALOR DE ESTADISTICA
// =========================================================

function obtenerValorEstadistica(
fila,
clave
) {
const valores =
obtenerValoresEstadistica(fila);


const encontrado = valores.find(
  (item) =>
    item?.key === clave ||
    item?.name === clave ||
    item?.label === clave
);

if (!encontrado) {
  return "-";
}

return valorComoTexto(
  encontrado.value
);


}

// =========================================================
// TITULO DE COLUMNA
// =========================================================

function tituloColumna(clave) {
if (!clave) {
return "";
}


const traducciones = {
  Goals: "Goles",
  Goal: "Goles",
  Assists: "Asistencias",
  Assist: "Asist.",
  YellowCards: "Amarillas",
  RedCards: "Rojas",
  Cards: "Tarjetas",
  MinutesPlayed: "Minutos",
  GamePlayed: "PJ",
  GamesPlayed: "PJ",
  Points: "Pts",
};

if (traducciones[clave]) {
  return traducciones[clave];
}

return clave
  .replace(/_/g, " ")
  .replace(
    /([a-z])([A-Z])/g,
    "$1 $2"
  );


}

// =========================================================
// DATOS
// =========================================================

const tablas = obtenerTablas();

const estadisticas =
obtenerEstadisticasJugadores();

// =========================================================
// LOADING
// =========================================================

if (loading) {
return ( <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">


    <div className="max-w-6xl mx-auto">

      <p className="text-[#9ca3af]">
        Cargando tablas...
      </p>

    </div>

  </main>
);


}

// =========================================================
// ERROR
// =========================================================

if (error) {
return ( <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">


    <div className="max-w-6xl mx-auto">

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-2xl font-bold">
          Posiciones
        </h1>

        <Link
          href="/"
          className="text-sm text-[#9ca3af] hover:text-white"
        >
          ← Partidos
        </Link>

      </div>

      <div className="bg-[#121821] border border-[#263244] rounded-xl p-6">

        <p className="text-red-400">
          {error}
        </p>

      </div>

    </div>

  </main>
);


}

// =========================================================
// PAGINA
// =========================================================

return ( <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-4 md:p-6">


  <div className="max-w-7xl mx-auto">

    {/* =================================================
        HEADER
    ================================================= */}

    <div className="flex items-center justify-between mb-8">

      <div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Posiciones
        </h1>

        <p className="text-[#8b949e] mt-1">
          Liga Profesional Argentina
        </p>

      </div>

      <Link
        href="/"
        className="px-3 py-2 rounded-lg border border-[#263244] text-sm text-[#9ca3af] hover:text-white hover:bg-[#18212c] transition"
      >
        ← Partidos
      </Link>

    </div>

    {/* =================================================
        POSICIONES
    ================================================= */}

    {tablas.length > 0 && (
      <section>

        <div className="flex items-center gap-3 mb-5">

          <div className="w-1 h-6 bg-[#22c55e] rounded-full" />

          <h2 className="text-xl font-bold">
            Tablas
          </h2>

        </div>

        <div className="space-y-6">

          {tablas.map(
            (tabla, indice) => {

              const filas =
                normalizarFilas(
                  tabla.rows
                );

              return (
                <section
                  key={`${tabla.torneo}-${tabla.grupo}-${indice}`}
                  className="bg-[#121821] border border-[#263244] rounded-xl overflow-hidden shadow-sm"
                >

                  {/* ENCABEZADO */}

                  <div className="px-4 md:px-5 py-4 border-b border-[#263244]">

                    <h3 className="font-semibold text-lg">
                      {tabla.grupo}
                    </h3>

                    <p className="text-xs text-[#8b949e] mt-1">
                      {tabla.torneo}
                    </p>

                  </div>

                  {/* TABLA */}

                  <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                      <thead className="bg-[#0d131a]">

                        <tr>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium w-12">
                            #
                          </th>

                          <th className="px-3 py-3 text-left text-[#64748b] font-medium">
                            Equipo
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            Pts
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            PJ
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            G
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            E
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            P
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            GF:GC
                          </th>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium">
                            DG
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {filas.map(
                          (fila, index) => {

                            const diferencia =
                              Number(
                                fila.diferencia
                              );

                            return (
                              <tr
                                key={`${fila.equipo}-${index}`}
                                className="border-t border-[#263244] hover:bg-[#18212c] transition"
                              >

                                <td className="px-3 py-3 text-center text-[#64748b] font-medium">
                                  {fila.posicion}
                                </td>

                                <td className="px-3 py-3">

                                  <span className="font-medium whitespace-nowrap">
                                    {fila.equipo}
                                  </span>

                                </td>

                                <td className="px-3 py-3 text-center font-bold">
                                  {fila.puntos}
                                </td>

                                <td className="px-3 py-3 text-center text-[#c9d1d9]">
                                  {fila.pj}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {fila.ganados}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {fila.empatados}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {fila.perdidos}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {fila.goles}
                                </td>

                                <td
                                  className={`px-3 py-3 text-center font-medium ${
                                    diferencia > 0
                                      ? "text-green-400"
                                      : diferencia < 0
                                      ? "text-red-400"
                                      : "text-[#9ca3af]"
                                  }`}
                                >
                                  {fila.diferencia}
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                </section>
              );
            }
          )}

        </div>

      </section>
    )}

    {/* =================================================
        ESTADISTICAS
    ================================================= */}

    {estadisticas.length > 0 && (
      <section className="mt-12">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-1 h-6 bg-[#22c55e] rounded-full" />

          <div>

            <h2 className="text-xl font-bold">
              Estadísticas
            </h2>

            <p className="text-sm text-[#8b949e] mt-1">
              Estadísticas individuales de los jugadores
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {estadisticas.map(
            (estadistica, indice) => {

              const filas =
                Array.isArray(
                  estadistica.rows
                )
                  ? estadistica.rows
                  : [];

              const columnas =
                obtenerColumnasEstadistica(
                  filas
                );

              return (
                <section
                  key={`${estadistica.nombre}-${indice}`}
                  className="bg-[#121821] border border-[#263244] rounded-xl overflow-hidden shadow-sm"
                >

                  {/* TITULO */}

                  <div className="px-4 py-4 border-b border-[#263244] flex items-center justify-between">

                    <h3 className="font-semibold text-lg">
                      {estadistica.nombre}
                    </h3>

                    <span className="text-xs text-[#64748b]">
                      {filas.length} jugadores
                    </span>

                  </div>

                  {/* TABLA */}

                  <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                      <thead className="bg-[#0d131a]">

                        <tr>

                          <th className="px-3 py-3 text-center text-[#64748b] font-medium w-10">
                            #
                          </th>

                          <th className="px-3 py-3 text-left text-[#64748b] font-medium">
                            Jugador
                          </th>

                          <th className="px-3 py-3 text-left text-[#64748b] font-medium">
                            Equipo
                          </th>

                          {columnas.map(
                            (columna) => (
                              <th
                                key={columna}
                                className="px-3 py-3 text-center text-[#64748b] font-medium whitespace-nowrap"
                              >
                                {tituloColumna(
                                  columna
                                )}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>

                      <tbody>

                        {filas.map(
                          (fila, index) => {

                            const nombre =
                              obtenerNombreJugador(
                                fila
                              );

                            const equipo =
                              obtenerEquipoJugador(
                                fila
                              );

                            return (
                              <tr
                                key={`${nombre}-${index}`}
                                className="border-t border-[#263244] hover:bg-[#18212c] transition"
                              >

                                {/* POSICION */}

                                <td className="px-3 py-3 text-center text-[#64748b] font-medium">
                                  {fila?.num ??
                                    index + 1}
                                </td>

                                {/* JUGADOR */}

                                <td className="px-3 py-3">

                                  <div className="font-medium text-[#e6edf3] whitespace-nowrap">
                                    {nombre}
                                  </div>

                                </td>

                                {/* EQUIPO */}

                                <td className="px-3 py-3 text-[#9ca3af] whitespace-nowrap">
                                  {equipo}
                                </td>

                                {/* VALORES */}

                                {columnas.map(
                                  (
                                    columna
                                  ) => {

                                    const valor =
                                      obtenerValorEstadistica(
                                        fila,
                                        columna
                                      );

                                    return (
                                      <td
                                        key={
                                          columna
                                        }
                                        className="px-3 py-3 text-center whitespace-nowrap font-semibold"
                                      >
                                        {valor}
                                      </td>
                                    );
                                  }
                                )}

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                </section>
              );
            }
          )}

        </div>

      </section>
    )}

    {/* =================================================
        SIN DATOS
    ================================================= */}

    {tablas.length === 0 &&
      estadisticas.length === 0 && (
        <div className="bg-[#121821] border border-[#263244] rounded-xl p-6">

          <p className="text-[#9ca3af]">
            No hay tablas ni estadísticas disponibles.
          </p>

        </div>
      )}

  </div>

</main>


);
}
