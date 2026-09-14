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
    const displayDate = `${day}/${month}`; // Formato corto para mostrar

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

    // Variable para rastrear la fecha del calendario actual en la página
    let currentDateContext = displayDate;

    // Recorremos los elementos clave de la estructura de Promiedos (incluyendo títulos de fecha y filas de partidos)
    $('tr, div, h3, h2').each((_, el) => {
      const $el = $(el);
      const text = $el.text().replace(/\s+/g, ' ').trim();

      // Si el elemento es un encabezado o contenedor de fecha en el calendario, actualizamos el contexto
      if ($el.is('h2, h3') || ($el.is('td') && $el.hasClass('fecha-calendario')) || (text.length > 5 && text.length < 30 && /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(text))) {
        currentDateContext = text;
        return;
      }

      const rowText = text;
      const rowLower = rowText.toLowerCase();

      if (
        rowLower.includes(searchLower) &&
        (rowLower.includes('vs') || rowLower.includes('-')) &&
        rowText.length > 4 &&
        rowText.length < 120 &&
        !seenTexts.has(rowText)
      ) {
        if ($el.children().length < 5) {
          seenTexts.add(rowText);

          // Extraemos la hora sin requerir que esté estrictamente al principio (busca cualquier patrón HH:MM)
          const timeMatch = rowText.match(/(\d{2}:\d{2})/);
          const timeStr = timeMatch ? timeMatch[1] : "";

          matches.push({
            rawText: rowText,
            date: currentDateContext, // Muestra la fecha detectada en el calendario o el fallback
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

  }     catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}