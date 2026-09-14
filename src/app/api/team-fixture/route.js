import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");
    const dateParam = searchParams.get("date"); // Formato YYYY-MM-DD o DD-MM-YYYY

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    // Determinamos la fecha de inicio a consultar
    let targetDate = new Date();
    if (dateParam) {
      if (dateParam.includes("-")) {
        const parts = dateParam.split("-");
        if (parts[0].length === 4) {
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    }

    if (isNaN(targetDate.getTime())) {
      targetDate = new Date();
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
      throw new Error("No se pudo obtener la información del calendario externo.");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const matches = [];
    const seenTexts = new Set();
    const searchLower = teamName.toLowerCase().trim();

    // Buscamos específicamente en filas de tablas o elementos que representen partidos reales
    // En Promiedos, los partidos suelen estar dentro de tablas o filas con clases específicas de encuentros
    $('tr, .match, .item, li').each((_, el) => {
      const $el = $(el);
      
      // Evitamos elementos que contengan menús gigantes o secciones de navegación
      if ($el.find('a[href*="ligas"], nav, header').length > 0 && !$el.find('.vs, td').length) {
        return;
      }

      const rowText = $el.text().replace(/\s+/g, ' ').trim();
      const rowLower = rowText.toLowerCase();

      // Validamos que contenga el equipo buscado, que tenga formato de partido (ej: "VS" o "-") y una longitud lógica
      const isMatchRow = (rowLower.includes('vs') || rowLower.includes('-')) && 
                         rowLower.includes(searchLower) && 
                         rowText.length > 5 && 
                         rowText.length < 150; // Evita bloques enormes de texto

      if (isMatchRow && !seenTexts.has(rowText)) {
        seenTexts.add(rowText);
        matches.push({
          rawText: rowText,
          date: formattedDateForUrl
        });
      }
    });

    // Calculamos la fecha para la siguiente semana (sumamos 7 días)
    const nextWeekDate = new Date(targetDate);
    nextWeekDate.setDate(targetDate.getDate() + 7);
    
    const nextYear = nextWeekDate.getFullYear();
    const nextMonth = String(nextWeekDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(nextWeekDate.getDate()).padStart(2, '0');
    const nextDateParam = `${nextYear}-${nextMonth}-${nextDay}`;

    return NextResponse.json({
      matches,
      nextDateParam
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}