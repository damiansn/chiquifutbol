
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
      } else if (
        Array.isArray(tabla.data)
      ) {
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
    return (
      fila?.team_name ||
      fila?.entity?.object?.team_name ||
      "-"
    );
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
      Assists: "Asist.",
      Assist: "Asist.",
      YellowCards: "Amar.",
      RedCards: "Rojas",
      Cards: "Tarj.",
      MinutesPlayed: "Min.",
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
  // COLOR DE POSICION
  // =========================================================

  function clasePosicion(posicion) {
    const numero = Number(posicion);

    if (numero === 1) {
      return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
    }

    if (numero === 2) {
      return "bg-slate-400/15 text-slate-300 border border-slate-400/20";
    }

    if (numero === 3) {
      return "bg-orange-500/15 text-orange-400 border border-orange-500/20";
    }

    return "text-[#718096]";
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
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">

        <div className="max-w-7xl mx-auto">

          <div className="animate-pulse space-y-5">

            <div className="h-8 w-52 bg-[#18212c] rounded-lg" />

            <div className="h-4 w-72 bg-[#18212c] rounded" />

            <div className="h-64 bg-[#121821] border border-[#263244] rounded-xl" />

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">

        <div className="max-w-7xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <div>

              <h1 className="text-2xl font-bold">
                Posiciones
              </h1>

              <p className="text-[#8b949e] mt-1">
                Liga Profesional Argentina
              </p>

            </div>

            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-[#263244] text-sm text-[#9ca3af] hover:text-white hover:bg-[#18212c] transition"
            >
              ← Partidos
            </Link>

          </div>

          <div className="bg-[#121821] border border-red-900/40 rounded-xl p-6">

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

  return (
    <main className="min-h-screen bg-[#0d131a] text-[#e6edf3]">

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-5 md:py-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">

          <div>

            <div className="flex items-center gap-3">

              <div className="w-1 h-9 bg-[#22c55e] rounded-full" />

              <div>

                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Posiciones
                </h1>

                <p className="text-[#8b949e] text-sm mt-1">
                  Liga Profesional Argentina
                </p>

              </div>

            </div>

          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-[#263244] bg-[#121821] text-sm text-[#b1bac4] hover:bg-[#18212c] hover:text-white transition"
          >
            ← Partidos
          </Link>

        </header>


        {/* =================================================
            TABLAS DE POSICIONES
        ================================================= */}

        {tablas.length > 0 && (

          <section>

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">

                <div className="w-1 h-7 bg-[#22c55e] rounded-full" />

                <div>

                  <h2 className="text-xl font-bold">
                    Tablas de posiciones
                  </h2>

                  <p className="text-xs text-[#718096] mt-1">
                    Clasificación actual
                  </p>

                </div>

              </div>

              <span className="hidden sm:block text-xs text-[#64748b]">
                {tablas.length} tablas
              </span>

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
                      className="bg-[#121821] border border-[#263244] rounded-xl overflow-hidden shadow-lg shadow-black/10"
                    >

                      {/* ENCABEZADO */}

                      <div className="px-4 md:px-5 py-4 bg-[#141c26] border-b border-[#263244]">

                        <div className="flex items-center justify-between gap-4">

                          <div>

                            <h3 className="font-bold text-base md:text-lg">
                              {tabla.grupo}
                            </h3>

                            <p className="text-xs text-[#718096] mt-1">
                              {tabla.torneo}
                            </p>

                          </div>

                          <span className="text-xs text-[#64748b]">
                            {filas.length} equipos
                          </span>

                        </div>

                      </div>


                      {/* TABLA */}

                      <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                          <thead>

                            <tr className="bg-[#0f161e] text-[#64748b] text-xs uppercase tracking-wide">

                              <th className="px-3 py-3 text-center w-12">
                                #
                              </th>

                              <th className="px-3 py-3 text-left min-w-[180px]">
                                Equipo
                              </th>

                              <th className="px-3 py-3 text-center">
                                Pts
                              </th>

                              <th className="px-3 py-3 text-center">
                                PJ
                              </th>

                              <th className="px-3 py-3 text-center">
                                G
                              </th>

                              <th className="px-3 py-3 text-center">
                                E
                              </th>

                              <th className="px-3 py-3 text-center">
                                P
                              </th>

                              <th className="px-3 py-3 text-center">
                                GF:GC
                              </th>

                              <th className="px-3 py-3 text-center">
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
                                    className="border-t border-[#263244] hover:bg-[#18212c] transition-colors"
                                  >

                                    {/* POSICION */}

                                    <td className="px-3 py-3 text-center">

                                      <span
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${clasePosicion(
                                          fila.posicion
                                        )}`}
                                      >
                                        {fila.posicion}
                                      </span>

                                    </td>


                                    {/* EQUIPO */}

                                    <td className="px-3 py-3">

                                      <span className="font-semibold text-[#e6edf3] whitespace-nowrap">
                                        {fila.equipo}
                                      </span>

                                    </td>


                                    {/* PUNTOS */}

                                    <td className="px-3 py-3 text-center">

                                      <span className="font-bold text-white">
                                        {fila.puntos}
                                      </span>

                                    </td>


                                    {/* PJ */}

                                    <td className="px-3 py-3 text-center text-[#b1bac4]">
                                      {fila.pj}
                                    </td>


                                    {/* G */}

                                    <td className="px-3 py-3 text-center text-[#b1bac4]">
                                      {fila.ganados}
                                    </td>


                                    {/* E */}

                                    <td className="px-3 py-3 text-center text-[#b1bac4]">
                                      {fila.empatados}
                                    </td>


                                    {/* P */}

                                    <td className="px-3 py-3 text-center text-[#b1bac4]">
                                      {fila.perdidos}
                                    </td>


                                    {/* GOLES */}

                                    <td className="px-3 py-3 text-center text-[#b1bac4]">
                                      {fila.goles}
                                    </td>


                                    {/* DIFERENCIA */}

                                    <td
                                      className={`px-3 py-3 text-center font-bold ${
                                        diferencia > 0
                                          ? "text-green-400"
                                          : diferencia < 0
                                          ? "text-red-400"
                                          : "text-[#718096]"
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

            {/* TITULO */}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

              <div className="flex items-center gap-3">

                <div className="w-1 h-7 bg-[#22c55e] rounded-full" />

                <div>

                  <h2 className="text-xl md:text-2xl font-bold">
                    Estadísticas
                  </h2>

                  <p className="text-sm text-[#8b949e] mt-1">
                    Rendimiento individual de los jugadores
                  </p>

                </div>

              </div>

              <span className="text-xs text-[#64748b]">
                {estadisticas.reduce(
                  (total, tabla) =>
                    total + tabla.rows.length,
                  0
                )} jugadores
              </span>

            </div>


            {/* TARJETAS */}

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
                      className="bg-[#121821] border border-[#263244] rounded-xl overflow-hidden shadow-lg shadow-black/10"
                    >

                      {/* CABECERA */}

                      <div className="px-4 md:px-5 py-4 bg-[#141c26] border-b border-[#263244]">

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <h3 className="font-bold text-base md:text-lg">
                              {estadistica.nombre}
                            </h3>

                            <p className="text-xs text-[#718096] mt-1">
                              Ranking de jugadores
                            </p>

                          </div>

                          <span className="text-xs text-[#64748b]">
                            {filas.length}
                          </span>

                        </div>

                      </div>


                      {/* TABLA */}

                      <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                          <thead>

                            <tr className="bg-[#0f161e] text-[#64748b] text-xs uppercase tracking-wide">

                              <th className="px-3 py-3 text-center w-10">
                                #
                              </th>

                              <th className="px-3 py-3 text-left min-w-[145px]">
                                Jugador
                              </th>

                              <th className="px-3 py-3 text-left min-w-[145px]">
                                Equipo
                              </th>

                              {columnas.map(
                                (columna) => (

                                  <th
                                    key={columna}
                                    className="px-3 py-3 text-center whitespace-nowrap"
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
                                    className="border-t border-[#263244] hover:bg-[#18212c] transition-colors"
                                  >

                                    {/* POSICION */}

                                    <td className="px-3 py-3 text-center">

                                      <span
                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${clasePosicion(
                                          fila?.num ??
                                            index + 1
                                        )}`}
                                      >
                                        {fila?.num ??
                                          index + 1}
                                      </span>

                                    </td>


                                    {/* JUGADOR */}

                                    <td className="px-3 py-3">

                                      <div className="font-semibold text-[#e6edf3] whitespace-nowrap">
                                        {nombre}
                                      </div>

                                    </td>


                                    {/* EQUIPO */}

                                    <td className="px-3 py-3">

                                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#1a2430] border border-[#263244] text-xs text-[#b1bac4] whitespace-nowrap">
                                        {equipo}
                                      </span>

                                    </td>


                                    {/* ESTADISTICAS */}

                                    {columnas.map(
                                      (columna, columnaIndex) => {

                                        const valor =
                                          obtenerValorEstadistica(
                                            fila,
                                            columna
                                          );

                                        return (

                                          <td
                                            key={columna}
                                            className={`px-3 py-3 text-center whitespace-nowrap ${
                                              columnaIndex === 0
                                                ? "font-bold text-white"
                                                : "font-medium text-[#b1bac4]"
                                            }`}
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

            <div className="bg-[#121821] border border-[#263244] rounded-xl p-8 text-center">

              <p className="text-[#9ca3af]">
                No hay tablas ni estadísticas disponibles.
              </p>

            </div>

          )}

      </div>

    </main>
  );
}

