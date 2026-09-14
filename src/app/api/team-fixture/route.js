import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");
    const dateParam = searchParams.get("date"); // Opcional para paginar hacia adelante/atrás si lo manejás

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    // URL de ejemplo o la fuente de donde estés extrayendo el calendario
    // Ajustá la URL según cómo estés armando el fixture en tu proyecto
    const targetUrl = `https://www.promiedos.com.ar/`; 

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 } // Caché de 1 minuto
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener la información de la fuente externa.");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const matches = [];
    const seenTexts = new Set();

    // Buscamos contenedores específicos de partidos o filas de la tabla de calendario
    $('tr, .fila-partido, .partido-calendario').each((_, el) => {
      const rowText = $(el).text().replace(/\s+/g, ' ').trim();
      
      // Verificamos que contenga al equipo y que tenga una longitud coherente para un partido
      if (
        rowText.toLowerCase().includes(teamName.toLowerCase()) && 
        rowText.length > 5 && 
        !seenTexts.has(rowText)
      ) {
        seenTexts.add(rowText);
        matches.push({
          rawText: rowText,
        });
      }
    });

    return NextResponse.json({
      matches,
      nextDateParam: null // Ajustá esto si implementás paginación de fechas
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}