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

    // Apuntamos al calendario general o principal para asegurar que traiga la grilla completa
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
    const seenTexts = new Set();
    const searchLower = teamName.toLowerCase().trim();

    let currentLeagueContext = "Torneo";

    // Recorremos de forma más específica las tablas de partidos de Promiedos
    $('table tr, div').each((_, el) => {
      const $el = $(el);
      
      // Detectar título de liga
      if ($el.hasClass('tituliga') || $el.find('.tituliga').length > 0) {
        const leagueText = $el.text().trim();
        if (leagueText) {
          currentLeagueContext = leagueText.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
        }
        return;
      }

      const text = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      // Buscamos si el texto incluye el equipo buscado y estructura de partido
      if (
        lowerText.includes(searchLower) &&
        (lowerText.includes('vs') || lowerText.includes('-')) &&
        text.length > 4 &&
        text.length < 200 &&
        !seenTexts.has(text)
      ) {
        // Filtrar reservas si el usuario busca partidos oficiales de primera
        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) {
          return;
        }

        seenTexts.add(text);

        // Extraer hora si existe (formato HH:MM)
        const timeMatch = text.match(/(\d{2}:\d{2})/);
        const timeStr = timeMatch ? timeMatch[1] : "";

        // Intentar separar equipos de forma prolija si Promiedos los une en una sola cadena
        let cleanRow = text;
        if (timeStr) {
          cleanRow = cleanRow.replace(timeStr, "").trim();
        }

        matches.push({
          id: Math.random().toString(36).substring(2, 9),
          rawText: cleanRow,
          league: currentLeagueContext,
          date: targetDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }),
          time: timeStr
        });
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