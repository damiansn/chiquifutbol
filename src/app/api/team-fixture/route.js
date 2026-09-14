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
    
    // Diccionario de sinónimos para asegurar nombres cortos y largos
    const searchTerms = [rawSearch];
    if (rawSearch.includes('river')) {
      searchTerms.push('river', 'river plate');
    } else if (rawSearch.includes('boca')) {
      searchTerms.push('boca', 'boca juniors');
    } else if (rawSearch.includes('racing')) {
      searchTerms.push('racing', 'racing club');
    } else if (rawSearch.includes('san lorenzo')) {
      searchTerms.push('san lorenzo');
    } else if (rawSearch.includes('independiente')) {
      searchTerms.push('independiente');
    }

    const matches = [];
    const seenMatches = new Set();

    // Ventana de días a buscar hacia adelante
    const daysToFetch = 10;
    const fetchPromises = [];

    for (let i = 0; i < daysToFetch; i++) {
      const currentDate = new Date(targetDate);
      currentDate.setDate(targetDate.getDate() + i);

      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = currentDate.getFullYear();
      const formattedDateForUrl = `${day}-${month}-${year}`;

      const targetUrl = `https://www.promiedos.com.ar/calendario/${formattedDateForUrl}`;

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
      let currentLeagueContext = "Torneo";

      // Buscamos en elementos de bloque lógicos para capturar el partido con seguridad
      $('tr, div, td').each((_, el) => {
        const $el = $(el);

        const tituliga = $el.find('.tituliga').text().trim() || $el.prevAll('.tituliga').first().text().trim();
        if (tituliga) {
          currentLeagueContext = tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
        }

        const text = $el.text().replace(/\s+/g, ' ').trim();
        const lowerText = text.toLowerCase();

        // Verificar si contiene alguno de los términos buscados y algún separador de partido
        const hasTeam = searchTerms.some(term => lowerText.includes(term));
        if (!hasTeam) return;

        if (!lowerText.includes('vs') && !lowerText.includes(' - ')) return;
        if (text.length < 5 || text.length > 120) return;
        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) return;

        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const timeStr = timeMatch ? timeMatch[1] : "";

        let cleanText = text;
        if (timeStr) {
          cleanText = cleanText.replace(timeStr, "").trim();
        }

        // Aislar los nombres alrededor del equipo para recortar texto basura
        const matchedTerm = searchTerms.find(term => cleanText.toLowerCase().includes(term));
        if (matchedTerm) {
          const idx = cleanText.toLowerCase().indexOf(matchedTerm);
          if (idx !== -1 && cleanText.length > 35) {
            const start = Math.max(0, idx - 20);
            const end = Math.min(cleanText.length, idx + 35);
            cleanText = cleanText.substring(start, end);
          }
        }

        cleanText = cleanText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\sVS-]+/g, " ").replace(/\s+/g, ' ').trim();

        const hasTeamClean = searchTerms.some(term => cleanText.toLowerCase().includes(term));
        if (hasTeamClean && cleanText.length > 5) {
          // Clave única basada en el texto limpio para evitar duplicados absolutos
          const matchKey = cleanText.toLowerCase().replace(/\s+/g, ' ').trim();
          if (seenMatches.has(matchKey)) return;
          seenMatches.add(matchKey);

          const options = { weekday: 'long', day: 'numeric', month: 'short' };
          const formattedDateStr = currentDate.toLocaleDateString('es-AR', options);
          const capitalizedDate = formattedDateStr.charAt(0).toUpperCase() + formattedDateStr.slice(1);

          matches.push({
            id: Math.random().toString(36).substring(2, 9),
            rawText: cleanText,
            league: currentLeagueContext || "Torneo",
            date: capitalizedDate,
            time: timeStr
          });
        }
      });
    }

    const nextWeekDate = new Date(targetDate);
    nextWeekDate.setDate(targetDate.getDate() + 7);
    const nextDateParam = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

    return NextResponse.json({
      matches,
      nextDateParam
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}