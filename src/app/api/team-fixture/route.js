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

    // En Promiedos, los partidos individuales en el calendario suelen listarse en filas (tr) o elementos específicos con estructura de enfrentamiento
    $('tr').each((_, el) => {
      const $el = $(el);

      // Capturar la categoría o torneo actual de la sección
      const tituliga = $el.find('.tituliga').text().trim() || $el.prevAll('.tituliga').first().text().trim();
      if (tituliga) {
        currentLeagueContext = tituliga.replace(/Partidos de (hoy|mañana|ayer|la fecha)/gi, '').trim();
      }

      const text = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      // Validar que la fila contenga al equipo buscado y algún indicador de partido ('vs' o '-')
      if (lowerText.includes(searchLower) && (lowerText.includes('vs') || lowerText.includes('-'))) {
        if (text.includes(" Res.") || currentLeagueContext.toLowerCase().includes("reserva")) {
          return;
        }

        // Extraer los equipos involucrados de forma limpia utilizando partición por 'vs' o '-'
        // Buscamos la subcadena exacta que contiene al equipo para aislarla del resto de los partidos de la celda
        const parts = text.split(/(?:vs|-)/i);
        for (let i = 0; i < parts.length; i++) {
          const currentPart = parts[i].toLowerCase();
          if (currentPart.includes(searchLower) && i > 0 && i < parts.length) {
            // Reconstruimos el partido individual: [Equipo Izquierda] VS [Equipo Derecha]
            const teamA = parts[i - 1].replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\s]/g, "").trim().split(' ').pop(); 
            // Para asegurar nombres limpios, extraemos las últimas palabras lógicas o acotamos el bloque
            
            // Alternativa más directa: Limpiar todo el bloque de texto que contenga ambos contendientes
            let candidateMatch = `${parts[i - 1].trim()} VS ${parts[i].trim()}`;
            // Limpiamos basuras de horarios pegados al nombre
            candidateMatch = candidateMatch.replace(/(\d{2}:\d{2})/g, '').replace(/\s+/g, ' ').trim();

            if (candidateMatch.toLowerCase().includes(searchLower) && candidateMatch.length < 40 && candidateMatch.length > 5) {
              const matchKey = `${candidateMatch}-${targetDate.toDateString()}`;
              if (seenMatches.has(matchKey)) continue;
              seenMatches.add(matchKey);

              const timeMatch = text.match(/(\d{2}:\d{2})/);
              const timeStr = timeMatch ? timeMatch[1] : "";

              matches.push({
                id: Math.random().toString(36).substring(2, 9),
                rawText: candidateMatch,
                league: currentLeagueContext || "Torneo",
                date: targetDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }),
                time: timeStr
              });
              break;
            }
          }
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