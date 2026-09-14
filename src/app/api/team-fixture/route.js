import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");
    const dateParam = searchParams.get("date"); // Formato esperado: YYYY-MM-DD o DD-MM-YYYY

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    // Determinamos la fecha de inicio a consultar
    let targetDate = new Date();
    if (dateParam) {
      // Si viene en formato YYYY-MM-DD o DD-MM-YYYY intentamos parsearlo
      if (dateParam.includes("-")) {
        const parts = dateParam.split("-");
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY
          targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    }

    if (isNaN(targetDate.getTime())) {
      targetDate = new Date();
    }

    // Formateamos a DD-MM-YYYY para la URL de Promiedos que me pasaste
    const day = String(targetDate.getDate()).padStart(2, '0');
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const year = targetDate.getFullYear();
    const formattedDateForUrl = `${day}-${month}-${year}`;

    // Construimos la URL exacta del calendario
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

    // Buscamos filas o bloques donde figuren los partidos en la página de calendario
    $('tr, .fila-partido, .partido-calendario, .match, div').each((_, el) => {
      const rowText = $(el).text().replace(/\s+/g, ' ').trim();
      
      if (
        rowText.toLowerCase().includes(teamName.toLowerCase()) && 
        rowText.length > 5 && 
        !seenTexts.has(rowText)
      ) {
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