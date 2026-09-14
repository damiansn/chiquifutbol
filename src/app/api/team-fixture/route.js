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
    
    // Lista de términos flexibles para asegurar que encuentre equipos como River, Boca, etc., 
    // sin importar si en la web figuran con nombre corto o completo.
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

    // Ventana de búsqueda de días
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

      // Nos enfocamos estrictamente en las filas de partidos (tr) para evitar duplicaciones y arrastre de celdas sueltas
      $('tr').each((_, el) => {
        const $el = $(el);

        const tituliga = $el.find('.tituliga').text().trim() || $el.prevAll('.tituliga').first().text().trim();
        if (tituliga) {
          currentLeagueContext = tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
        }

        const text = $el.text().replace(/\s+/g, ' ').trim();
        const lowerText = text.toLowerCase();

        // Validar si la fila contiene alguno de los términos del equipo buscado
        const matchesSearch = searchTerms.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(lowerText);
        });

        if (!matchesSearch) return;

        // Validar que la fila sea realmente un partido (debe tener indicador de vs, guion o horario)
        if (!lowerText.includes('vs') && !lowerText.includes(' - ') && !/\d{2}:\d{2}/.test(text)) {
          return;
        }

        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) {
          return;
        }

        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const timeStr = timeMatch ? timeMatch[1] : "";

        let cleanText = text;
        if (timeStr) {
          cleanText = cleanText.replace(timeStr, "").trim();
        }

        cleanText = cleanText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\sVS-]+/g, " ").replace(/\s+/g, ' ').trim();

        // Verificar que el equipo siga estando presente luego de la limpieza y que tenga longitud lógica de partido
        const hasTeamInClean = searchTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(cleanText));
        if (hasTeamInClean && cleanText.length > 5 && cleanText.length < 80) {
          
          // Clave única atada a la fecha exacta del bucle para evitar duplicar partidos entre días o dentro de la misma página
          const matchKey = `${cleanText}-${currentDate.toDateString()}`.toLowerCase();
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