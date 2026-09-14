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
    const seenTexts = new Set();
    const searchLower = teamName.toLowerCase().trim();

    // Variable de seguimiento temporal para avanzar de manera estricta y cronológica
    let trackingDate = new Date(targetDate);
    let lastDayIndex = trackingDate.getDay();

    const daysMap = {
      "domingo": 0, "lunes": 1, "martes": 2, "miércoles": 3, "miercoles": 3,
      "jueves": 4, "viernes": 5, "sábado": 6, "sabado": 6, "sábados": 6, "sabados": 6
    };

    // Recorremos los elementos buscando los bloques de fecha o filas de partidos
    $('tr, div').each((_, el) => {
      const $el = $(el);
      const text = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      // Detectar si el elemento es un encabezado de fecha en Promiedos
      for (const [dayName, dayIndex] of Object.entries(daysMap)) {
        if (lowerText.includes(dayName) && text.length < 50 && !$el.find('table, tr').length) {
          // Si encontramos un indicador de día, calculamos el salto respecto al día anterior
          let diff = dayIndex - lastDayIndex;
          if (diff < 0) diff += 7; // Si el día de la semana es menor, avanzamos a la semana siguiente
          if (diff > 0) {
            trackingDate.setDate(trackingDate.getDate() + diff);
            lastDayIndex = dayIndex;
          }
          break;
        }
      }

      // Si es una fila de partido, evaluamos si contiene al equipo buscado
      const rowText = text;
      const rowLower = rowText.toLowerCase();

      if (
        rowLower.includes(searchLower) &&
        (rowLower.includes('vs') || rowLower.includes('-')) &&
        rowText.length > 4 &&
        rowText.length < 150 &&
        !seenTexts.has(rowText)
      ) {
        if ($el.children().length < 8) {
          seenTexts.add(rowText);

          // Buscar hora (HH:MM)
          const timeMatch = rowText.match(/(\d{2}:\d{2})/);
          let timeStr = timeMatch ? timeMatch[1] : "";
          
          if (!timeStr) {
            const possibleTime = $el.find('.hora, .horario, span').filter((_, sub) => /\d{2}:\d{2}/.test($(sub).text())).text();
            if (possibleTime) {
              const matchSub = possibleTime.match(/(\d{2}:\d{2})/);
              if (matchSub) timeStr = matchSub[1];
            }
          }

          // Formatear la fecha real calculada de forma limpia para el cliente (Ej: "Miércoles, 16 sept")
          const options = { weekday: 'long', day: 'numeric', month: 'short' };
          const formattedDateStr = trackingDate.toLocaleDateString('es-AR', options);
          const capitalizedDate = formattedDateStr.charAt(0).toUpperCase() + formattedDateStr.slice(1);

          matches.push({
            rawText: rowText,
            date: capitalizedDate,
            time: timeStr ? `${timeStr} hs` : ""
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