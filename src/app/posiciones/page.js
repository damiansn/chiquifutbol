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

  // ------------------------------------------
  // OBTENER VALOR DE UN CAMPO
  // ------------------------------------------
  function obtenerValor(valores, clave, defecto = "-") {
    if (!Array.isArray(valores)) return defecto;

    const encontrado = valores.find(
      (item) => item?.key === clave
    );

    return encontrado?.value ?? defecto;
  }

  // ------------------------------------------
  // NORMALIZAR UNA TABLA
  // ------------------------------------------
  function normalizarTabla(grupo) {
    if (!grupo) return [];

    /*
      La estructura real de Promiedos es:

      grupo
        values: [
          {
            num: 1,
            values: [...],
            entity: {
              object: {
                name: "River Plate"
              }
            }
          }
        ]
    */

    const filas = Array.isArray(grupo.values)
      ? grupo.values
      : [];

    return filas.map((fila) => {
      const equipo = fila?.entity?.object || {};
      const valores = fila?.values || [];

      return {
        posicion: fila?.num ?? "-",

        equipo:
          equipo.name ||
          equipo.short_name ||
          "Equipo",

        escudo: equipo.logo || equipo.image || null,

        puntos: obtenerValor(valores, "Points", 0),

        pj: obtenerValor(valores, "GamePlayed", 0),

        ganados: obtenerValor(valores, "GamesWon", 0),

        empatados: obtenerValor(valores, "GamesEven", 0),

        perdidos: obtenerValor(valores, "GamesLost", 0),

        goles: obtenerValor(valores, "Goals", "0:0"),

        diferencia: obtenerValor(valores, "Ratio", 0),

        tendencia: obtenerValor(
          valores,
          "{trend}",
          []
        ),
      };
    });
  }

  // ------------------------------------------
  // OBTENER TODAS LAS TABLAS
  // ------------------------------------------
  function obtenerTablas() {
    if (!data) return [];

    if (
      Array.isArray(data.tables_groups) &&
      data.tables_groups.length > 0
    ) {
      return data.tables_groups;
    }

    if (
      Array.isArray(data.tables) &&
      data.tables.length > 0
    ) {
      return data.tables;
    }

    return [];
  }

  const tablas = obtenerTablas();

  // ------------------------------------------
  // LOADING
  // ------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">
        <div className="max-w-6xl mx-auto">
          <p>Cargando tablas...</p>
        </div>
      </main>
    );
  }

  // ------------------------------------------
  // ERROR
  // ------------------------------------------
  if (error) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">
            Posiciones
          </h1>

          <div className="bg-[#121821] border border-[#263244] rounded-lg p-5">
            <p className="text-red-400">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------
  // SIN TABLAS
  // ------------------------------------------
  if (tablas.length === 0) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              Posiciones
            </h1>

            <Link
              href="/"
              className="text-sm text-[#9ca3af] hover:text-white"
            >
              ← Volver
            </Link>
          </div>

          <div className="bg-[#121821] border border-[#263244] rounded-lg p-6">
            <p className="text-[#9ca3af]">
              No hay tablas disponibles.
            </p>
          </div>

        </div>
      </main>
    );
  }

  // ------------------------------------------
  // TABLAS
  // ------------------------------------------
  return (
    <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-4 md:p-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Posiciones
            </h1>

            <p className="text-[#8b949e] mt-1">
              Liga Profesional Argentina
            </p>
          </div>

          <Link
            href="/"
            className="text-sm text-[#9ca3af] hover:text-white"
          >
            ← Partidos
          </Link>

        </div>

        {/* TABLAS */}
        <div className="space-y-8">

          {tablas.map((grupo, indice) => {

            const filas = normalizarTabla(grupo);

            if (filas.length === 0) {
              return null;
            }

            return (
              <section
                key={grupo?.id || grupo?.name || indice}
                className="bg-[#121821] border border-[#263244] rounded-lg overflow-hidden"
              >

                {/* TITULO */}
                <div className="px-4 py-3 border-b border-[#263244]">

                  <h2 className="font-semibold text-lg">
                    {grupo?.name ||
                      grupo?.title ||
                      `Tabla ${indice + 1}`}
                  </h2>

                </div>

                {/* TABLA */}
                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead className="bg-[#0d131a] text-[#8b949e]">

                      <tr>

                        <th className="px-3 py-3 text-center w-12">
                          #
                        </th>

                        <th className="px-3 py-3 text-left">
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

                      {filas.map((fila, index) => (

                        <tr
                          key={`${fila.equipo}-${index}`}
                          className="border-t border-[#263244] hover:bg-[#18212c]"
                        >

                          <td className="px-3 py-3 text-center text-[#9ca3af] font-medium">
                            {fila.posicion}
                          </td>

                          <td className="px-3 py-3">

                            <div className="font-medium">
                              {fila.equipo}
                            </div>

                          </td>

                          <td className="px-3 py-3 text-center font-bold">
                            {fila.puntos}
                          </td>

                          <td className="px-3 py-3 text-center">
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
                            className={`px-3 py-3 text-center ${
                              Number(fila.diferencia) > 0
                                ? "text-green-400"
                                : Number(fila.diferencia) < 0
                                ? "text-red-400"
                                : "text-[#9ca3af]"
                            }`}
                          >
                            {fila.diferencia}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </section>
            );
          })}

        </div>

      </div>

    </main>
  );
}