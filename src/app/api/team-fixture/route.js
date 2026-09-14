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

    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const year = targetDate.getFullYear();
    const formattedDateForUrl = `${day}-${month}-${year}`;

    const targetUrl = `https://www.promiedos.com.ar/calendario/${formattedDateForUrl}`;

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener la información del calendario.");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const matches = [];
    const seenMatches = new Set();
    const searchLower = teamName.toLowerCase().trim();

    let currentLeagueContext = "Torneo";

    // Recorremos tanto filas como celdas o divs pequeños para capturar el bloque del partido
    $('tr, td, div').each((_, el) => {
      const $el = $(el);

      const tituliga = $el.find('.tituliga').text().trim() || $el.prevAll('.tituliga').first().text().trim();
      if (tituliga) {
        currentLeagueContext = tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
      }

      const text = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      // Buscamos que contenga el equipo y la palabra "vs" (o guión), cuidando que no sea un bloque gigantesco de toda la página
      if (lowerText.includes(searchLower) && (lowerText.includes('vs') || lowerText.includes(' - ')) && text.length > 5 && text.length < 120) {
        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) {
          return;
        }

        // Extraemos la hora si la tiene
        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const timeStr = timeMatch ? timeMatch[1] : "";

        // Limpiamos el texto para dejar solo el cruce (ej: "Banfield VS Barracas Central")
        let cleanText = text;
        if (timeStr) {
          cleanText = cleanText.replace(timeStr, "");
        }

        // Si el texto sigue siendo largo porque agarró elementos adyacentes, intentamos recortar alrededor del equipo buscado
        const teamIndex = cleanText.toLowerCase().indexOf(searchLower);
        if (teamIndex !== -1 && cleanText.length > 40) {
          // Tomamos un fragmento prudente de 35 caracteres a la izquierda y derecha del nombre del equipo
          const start = Math.max(0, teamIndex - 25);
          const end = Math.min(cleanText.length, teamIndex + 35);
          cleanText = cleanText.substring(start, end);
        }

        cleanText = cleanText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\sVS-]+/g, "").trim();

        if (cleanText.toLowerCase().includes(searchLower) && cleanText.length > 5) {
          const matchKey = `${cleanText}-${targetDate.toDateString()}`;
          if (seenMatches.has(matchKey)) return;
          seenMatches.add(matchKey);

          matches.push({
            id: Math.random().toString(36).substring(2, 9),
            rawText: cleanText,
            league: currentLeagueContext || "Torneo",
            date: targetDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }),
            time: timeStr
          });
        }
      }
    });

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