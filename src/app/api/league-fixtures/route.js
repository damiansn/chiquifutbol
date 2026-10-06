import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PROMIEDOS_LEAGUE_ID = "hc";
const PROMIEDOS_API = "https://api.promiedos.com.ar";
const PROMIEDOS_HEADERS = {
  Accept: "application/json",
  "X-Ver": "1.11.7.5",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
};

async function fetchPromiedos(path) {
  const response = await fetch(`${PROMIEDOS_API}${path}`, {
    headers: PROMIEDOS_HEADERS,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Promiedos respondió ${response.status} al consultar las fechas.`);
  }
  return response.json();
}

function etiquetarFiltros(filters, tablesGroups) {
  const roundPhases = [...new Set(
    filters
      .filter(filter => /^Fecha \d+$/i.test(filter.name || ""))
      .map(filter => filter.key.split("_")[2])
      .filter(Boolean)
  )];
  const phaseNames = new Map(
    roundPhases.map((phase, index) => [phase, tablesGroups[index]?.name || ""])
  );

  return filters.map(filter => {
    if (filter.key === "latest") return { ...filter, label: filter.name || "Partidos actuales" };
    if (/^Fecha \d+$/i.test(filter.name || "")) {
      const phase = filter.key.split("_")[2];
      const phaseName = phaseNames.get(phase);
      return { ...filter, label: phaseName ? `${phaseName} · ${filter.name}` : filter.name };
    }
    return { ...filter, label: filter.name };
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const round = searchParams.get("round");

    if (round && round !== "latest" && !/^\d+_\d+_-?\d+_-?\d+$/.test(round)) {
      return NextResponse.json({ error: "La fecha seleccionada no es válida." }, { status: 400 });
    }

    const leagueData = await fetchPromiedos(`/league/tables_and_fixtures/${PROMIEDOS_LEAGUE_ID}`);
    const filters = Array.isArray(leagueData?.games?.filters) ? leagueData.games.filters : [];
    const labeledFilters = etiquetarFiltros(filters, leagueData?.tables_groups || []);
    const selectedFilter = round
      ? labeledFilters.find(filter => filter.key === round)
      : labeledFilters.find(filter => filter.selected) || labeledFilters.find(filter => filter.key === "latest");

    if (!selectedFilter) {
      return NextResponse.json({ error: "Promiedos no publicó fechas para este torneo." }, { status: 404 });
    }

    let games = selectedFilter.games;
    if (!Array.isArray(games)) {
      const gameData = await fetchPromiedos(
        `/league/games/${PROMIEDOS_LEAGUE_ID}/${encodeURIComponent(selectedFilter.key)}`
      );
      games = Array.isArray(gameData?.games) ? gameData.games : [];
    }

    return NextResponse.json({
      filters: labeledFilters.map(({ key, label }) => ({ key, label })),
      selectedRound: selectedFilter.key,
      games,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error cargando fechas de Liga Profesional desde Promiedos:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las fechas del torneo. Intentá nuevamente más tarde." },
      { status: 502 }
    );
  }
}
