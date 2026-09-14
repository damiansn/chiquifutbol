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
      const parts = dateParam.partes || dateParam.split("-");
      if (parts && parts.length === 3) {
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

    // Recorremos específicamente filas de tablas o elementos que representan partidos individuales
    $('tr').each((_, el) => {
      const $el = $(el);

      // Detectar título de liga si la fila lo contiene
      const tituliga = $el.find('.tituliga').text().trim();
      if (tituliga) {
        currentLeagueContext = tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
      }

      const text = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      // Buscamos que la fila pertenezca al equipo y tenga un enfrentamiento 'vs'
      if (lowerText.includes(searchLower) && (lowerText.includes('vs') || lowerText.includes('-'))) {
        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) {
          return;
        }

        // Regex para capturar de manera limpia el patrón de un partido (Ej: "Equipo A VS Equipo B" o variantes con hora)
        // Buscamos bloques que contengan el nombre del equipo buscado junto a su rival
        const matchRegex = new RegExp(`([^0-9]{3,25}?(?:vs|-)[^0-9]{3,25}?)`, 'gi');
        const founds = text.match(matchRegex);

        if (founds) {
          founds.forEach(matchBlock => {
            const cleanMatch = matchBlock.trim();
            if (cleanMatch.toLowerCase().includes(searchLower) && cleanMatch.length < 50 && cleanMatch.length > 6) {
              
              // Evitar duplicados exactos
              const matchKey = `${cleanMatch}-${targetDate.toDateString()}`;
              if (seenMatches.has(matchKey)) return;
              seenMatches.add(matchKey);

              // Extraer hora si existe en el texto general de la fila
              const timeMatch = text.match(/(\d{2}:\d{2})/);
              const timeStr = timeMatch ? timeMatch[1] : "";

              matches.push({
                id: Math.random().toString(36).substring(2, 9),
                rawText: cleanMatch,
                league: currentLeagueContext,
                date: targetDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }),
                time: timeStr
              });
            }
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