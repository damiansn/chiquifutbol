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

  // =========================================================
  // OBTENER VALOR DE UN CAMPO
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
  // NORMALIZAR LAS FILAS DE UNA TABLA
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

        tendencia: obtenerValor(
          valores,
          "{trend}",
          []
        ),
      };
    });
  }

  // =========================================================
  // EXTRAER LAS TABLAS REALES DE PROMIEDOS
  // =========================================================

  function obtenerTablas() {
    if (!data) {
      return [];
    }

    const resultado = [];

    /*
      ESTRUCTURA REAL:

      data
      └── tables
          └── Clausura
              └── tables
                  ├── Grupo A
                  │   └── table
                  │       └── rows
                  │
                  └── Grupo B
                      └── table
                          └── rows
    */

    if (!Array.isArray(data.tables)) {
      console.log(
        "No existe data.tables o no es un array:",
        data.tables
      );

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

          nombre:
            `${torneo.name || "Torneo"} - ${
              grupo.name || "Tabla"
            }`,

          rows,
        });
      });
    });

    console.log(
      "TABLAS NORMALIZADAS:",
      resultado
    );

    return resultado;
  }

  const tablas = obtenerTablas();

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">
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
              ← Partidos
            </Link>

          </div>

          <div className="bg-[#121821] border border-[#263244] rounded-lg p-6">

            <p className="text-red-400">
              {error}
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =========================================================
  // SIN TABLAS
  // =========================================================

  if (tablas.length === 0) {
    return (
      <main className="min-h-screen bg-[#0d131a] text-[#e6edf3] p-6">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-6">

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
              className="text-sm text-[#9ca3af] hover:text-white"
            >
              ← Partidos
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

  // =========================================================
  // TABLAS
  // =========================================================

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

          {tablas.map((tabla, indice) => {

            const filas = normalizarFilas(
              tabla.rows
            );

            return (
              <section
                key={`${tabla.torneo}-${tabla.grupo}-${indice}`}
                className="bg-[#121821] border border-[#263244] rounded-lg overflow-hidden"
              >

                {/* TITULO */}

                <div className="px-4 py-3 border-b border-[#263244]">

                  <h2 className="font-semibold text-lg">
                    {tabla.grupo}
                  </h2>

                  <p className="text-xs text-[#8b949e] mt-1">
                    {tabla.torneo}
                  </p>

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

                      {filas.map((fila, index) => {

                        const diferencia =
                          Number(
                            fila.diferencia
                          );

                        return (
                          <tr
                            key={`${fila.equipo}-${index}`}
                            className="border-t border-[#263244] hover:bg-[#18212c]"
                          >

                            {/* POSICION */}

                            <td className="px-3 py-3 text-center text-[#9ca3af] font-medium">
                              {fila.posicion}
                            </td>

                            {/* EQUIPO */}

                            <td className="px-3 py-3">

                              <div className="font-medium whitespace-nowrap">
                                {fila.equipo}
                              </div>

                            </td>

                            {/* PUNTOS */}

                            <td className="px-3 py-3 text-center font-bold">
                              {fila.puntos}
                            </td>

                            {/* PJ */}

                            <td className="px-3 py-3 text-center">
                              {fila.pj}
                            </td>

                            {/* GANADOS */}

                            <td className="px-3 py-3 text-center">
                              {fila.ganados}
                            </td>

                            {/* EMPATADOS */}

                            <td className="px-3 py-3 text-center">
                              {fila.empatados}
                            </td>

                            {/* PERDIDOS */}

                            <td className="px-3 py-3 text-center">
                              {fila.perdidos}
                            </td>

                            {/* GOLES */}

                            <td className="px-3 py-3 text-center">
                              {fila.goles}
                            </td>

                            {/* DIFERENCIA */}

                            <td
                              className={`px-3 py-3 text-center ${
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
                      })}

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