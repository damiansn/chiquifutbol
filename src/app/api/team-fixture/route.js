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

    let currentDateContext = `${day}/${month}`;

    // Recorremos los bloques principales del calendario de Promiedos (generalmente agrupados por fecha/tabla)
    // Buscamos contenedores o filas para mantener el hilo de la fecha actual y los partidos de ese día.
    $('tr, div').each((_, el) => {
      const $el = $(el);
      const text = $el.text().replace(/\s+/g, ' ').trim();

      // Detectar si el elemento es un encabezado de fecha en Promiedos (ej: "Miércoles 16 de Septiembre" o similar)
      if ($el.is('h2, h3') || $el.hasClass('fecha-calendario') || ($el.is('div') && /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(text) && text.length < 40)) {
        currentDateContext = text;
        return;
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
        // Asegurarnos de que no sea un contenedor muy amplio
        if ($el.children().length < 8) {
          seenTexts.add(rowText);

          // Buscar hora (HH:MM) tanto en el texto completo de la fila como en elementos específicos de horario
          const timeMatch = rowText.match(/(\d{2}:\d{2})/);
          let timeStr = timeMatch ? timeMatch + " hs" : "";
          
          if (!timeStr) {
            const possibleTime = $el.find('.hora, .horario, span').filter((_, sub) => /\d{2}:\d{2}/.test($(sub).text())).text();
            if (possibleTime) {
              const matchSub = possibleTime.match(/(\d{2}:\d{2})/);
              if (matchSub) timeStr = matchSub + " hs";
            }
          }

          matches.push({
            rawText: rowText,
            date: currentDateContext,
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