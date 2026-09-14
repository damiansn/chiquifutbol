import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");
    const dateParam = searchParams.get("date");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    let targetDate = new Date();
    if (dateParam) {
      const parts = dateParam.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    }

    const rawSearch = teamName.toLowerCase().trim();
    const searchTerms = [rawSearch];
    if (rawSearch.includes('river')) searchTerms.push('river', 'river plate');
    if (rawSearch.includes('boca')) searchTerms.push('boca', 'boca juniors');
    if (rawSearch.includes('racing')) searchTerms.push('racing', 'racing club');
    if (rawSearch.includes('san lorenzo')) searchTerms.push('san lorenzo');
    if (rawSearch.includes('independiente')) searchTerms.push('independiente');
    if (rawSearch.includes('instituto')) searchTerms.push('instituto', 'instituto cordoba');
    if (rawSearch.includes('banfield')) searchTerms.push('banfield');
    if (rawSearch.includes('barracas')) searchTerms.push('barracas', 'barracas central');

    const matches = [];
    const seenMatches = new Set();

    const daysToFetch = 7;
    const fetchPromises = [];

    for (let i = 0; i < daysToFetch; i++) {
      const currentDate = new Date(targetDate);
      currentDate.setDate(targetDate.getDate() + i);

      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      const targetUrl = `https://www.promiedos.com.ar/calendario/${day}-${month}-${year}`;

      fetchPromises.push(
        fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          next: { revalidate: 60 }
        })
        .then(async (res) => {
          if (!res.ok) return null;
          const html = await res.text();
          return { html, currentDate };
        })
        .catch(() => null)
      );
    }

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (!result) continue;
      const { html, currentDate } = result;
      const $ = cheerio.load(html);

      // Buscamos cualquier elemento pequeño o fila que contenga texto de partidos para no descartar partidos de reserva
      $('div, tr, td').each((_, el) => {
        const $el = $(el);

        const tituliga = $el.find('.tituliga').text().trim() || $el.prevAll('.tituliga').first().text().trim() || $el.closest('table').find('.tituliga').text().trim();
        const leagueContext = tituliga ? tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim() : "Calendario";

        const text = $el.text().replace(/\s+/g, ' ').trim();
        const lowerText = text.toLowerCase();

        const hasTeam = searchTerms.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(lowerText);
        });

        if (!hasTeam) return;
        if (!lowerText.includes('vs') && !lowerText.includes(' - ')) return;
        if (!/\d{2}:\d{2}/.test(text)) return;
        if (text.length < 5 || text.length > 150) return;

        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const timeStr = timeMatch ? timeMatch[1] : "";

        let cleanText = text;
        if (timeStr) {
          cleanText = cleanText.replace(timeStr, "").trim();
        }

        cleanText = cleanText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\sVS-]+/g, " ").replace(/\s+/g, ' ').trim();

        const hasTeamClean = searchTerms.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(cleanText);
        });

        if (hasTeamClean && cleanText.length > 5) {
          const matchKey = `${cleanText}-${currentDate.toISOString().split('T')[0]}`.toLowerCase().replace(/\s+/g, ' ').trim();
          if (seenMatches.has(matchKey)) return;
          seenMatches.add(matchKey);

          const options = { weekday: 'long', day: 'numeric', month: 'short' };
          const formattedDateStr = currentDate.toLocaleDateString('es-AR', options);
          const capitalizedDate = formattedDateStr.charAt(0).toUpperCase() + formattedDateStr.slice(1);

          matches.push({
            id: Math.random().toString(36).substring(2, 9),
            rawText: cleanText,
            league: leagueContext || "Calendario",
            date: capitalizedDate,
            time: timeStr
          });
        }
      });
    }

    const nextWeekDate = new Date(targetDate);
    nextWeekDate.setDate(targetDate.getDate() + 7);
    const nextDateParam = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

    const limitedMatches = matches.slice(0, 2);

    return NextResponse.json({
      matches: limitedMatches,
      nextDateParam
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}