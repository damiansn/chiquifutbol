import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DATA_FILES = [
  "referee-matches-history.csv",
  "referee-matches-current.csv",
];

let matchesPromise;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = (rows.shift() || []).map(value => value.replace(/^\uFEFF/, "").trim());
  return rows
    .filter(values => values.some(value => value.trim()))
    .map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()])));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseMatchDate(value) {
  const match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{2}|\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) return 0;
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  return new Date(year, Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0)).getTime();
}

async function loadMatches() {
  if (!matchesPromise) {
    matchesPromise = Promise.all(
      DATA_FILES.map(file => readFile(path.join(process.cwd(), "src", "data", file), "utf8"))
    ).then(contents => {
      const byId = new Map();
      for (const text of contents) {
        for (const row of parseCsv(text)) {
          if (!row.id || !row.referee || !row.homeTeam || !row.awayTeam) continue;
          const homeGoals = Number(row.FTHG);
          const awayGoals = Number(row.FTAG);
          if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) continue;
          byId.set(row.id, {
            id: row.id,
            date: row.matchDate,
            timestamp: parseMatchDate(row.matchDate),
            competition: row.League,
            season: row.Season,
            referee: row.referee,
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            homeGoals,
            awayGoals,
          });
        }
      }
      return [...byId.values()];
    }).catch(error => {
      matchesPromise = undefined;
      throw error;
    });
  }
  return matchesPromise;
}

export async function GET(request) {
  try {
    const matches = await loadMatches();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "options") {
      const referees = [...new Set(matches.map(match => match.referee))].sort((a, b) => a.localeCompare(b, "es"));
      const seasons = [...new Set(matches.map(match => match.season))].sort((a, b) => {
        const year = value => Number(value.match(/\d{4}(?!.*\d{4})/)?.[0] || value.match(/\d{4}/)?.[0] || 0);
        return year(b) - year(a) || b.localeCompare(a);
      });
      return NextResponse.json({
        referees,
        seasons,
        matchCount: matches.length,
        teamsByReferee: Object.fromEntries(referees.map(referee => [
          referee,
          [...new Set(matches
            .filter(match => normalize(match.referee) === normalize(referee))
            .flatMap(match => [match.homeTeam, match.awayTeam]))].sort((a, b) => a.localeCompare(b, "es")),
        ])),
      });
    }

    const referee = searchParams.get("referee") || "";
    const team = searchParams.get("team") || "";
    const season = searchParams.get("season") || "";
    if (!referee || !team) {
      return NextResponse.json({ error: "Seleccioná un árbitro y un equipo." }, { status: 400 });
    }

    const selectedMatches = matches
      .filter(match =>
        normalize(match.referee) === normalize(referee)
        && (!season || match.season === season)
        && (normalize(match.homeTeam) === normalize(team) || normalize(match.awayTeam) === normalize(team))
      )
      .map(match => {
        const home = normalize(match.homeTeam) === normalize(team);
        const teamGoals = home ? match.homeGoals : match.awayGoals;
        const opponentGoals = home ? match.awayGoals : match.homeGoals;
        return {
          ...match,
          result: teamGoals > opponentGoals ? "G" : teamGoals < opponentGoals ? "P" : "E",
          opponent: home ? match.awayTeam : match.homeTeam,
          teamGoals,
          opponentGoals,
          venue: home ? "Local" : "Visitante",
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      referee,
      team,
      season: season || null,
      total: selectedMatches.length,
      wins: selectedMatches.filter(match => match.result === "G").length,
      draws: selectedMatches.filter(match => match.result === "E").length,
      losses: selectedMatches.filter(match => match.result === "P").length,
      matches: selectedMatches,
    });
  } catch (error) {
    console.error("Error consultando historial de árbitros:", error);
    return NextResponse.json({ error: "No se pudo leer el historial de partidos." }, { status: 500 });
  }
}
