import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("team");

    if (!teamName) {
      return NextResponse.json({ error: "Falta el parámetro 'team'" }, { status: 400 });
    }

    const rawSearch = teamName.toLowerCase().trim();
    const searchTerms = [rawSearch];
    
    // Sinónimos y abreviaturas comunes para matchear con los nombres acortados de Promiedos
    if (rawSearch.includes('river')) searchTerms.push('river', 'river plate');
    if (rawSearch.includes('boca')) searchTerms.push('boca', 'boca jrs.', 'boca juniors');
    if (rawSearch.includes('racing')) searchTerms.push('racing', 'racing club');
    if (rawSearch.includes('san lorenzo')) searchTerms.push('san lorenzo');
    if (rawSearch.includes('independiente')) searchTerms.push('independiente', 'independiente riv.');
    if (rawSearch.includes('instituto')) searchTerms.push('instituto');
    if (rawSearch.includes('banfield')) searchTerms.push('banfield');
    if (rawSearch.includes('barracas')) searchTerms.push('barracas', 'barracas central');
    if (rawSearch.includes('tucuman')) searchTerms.push('atl. tucumán', 'atletico tucuman');
    if (rawSearch.includes('central') && !rawSearch.includes('cordoba')) searchTerms.push('rosario central', 'central');

    // Apuntamos directo a la URL de la liga que me pasaste
    const targetUrl = "https://www.promiedos.com.ar/league/liga-profesional/hc";

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error("No se pudo conectar con la página de la liga en Promiedos");
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches = [];
    const seenMatches = new Set();

    let currentDayContext = "Próximos partidos";

    // Recorremos los bloques de la tabla de la fecha
    // En esta estructura hay cabeceras de día (ej: "Vie 11/09", "Sáb 12/09") y filas de partidos
    $('tr').each((_, el) => {
      const $el = $(el);

      // Detectamos si la fila es un encabezado de día
      const rowText = $el.text().replace(/\s+/g, ' ').trim();
      
      // Si la fila tiene pinta de fecha (ej: "Vie 11/09" o "Sáb"), actualizamos el contexto del día
      if ($el.find('td').length === 1 || rowText.length < 15 && (rowText.includes('/') || /^(vie|sáb|dom|lun|mar|mié|jue)/i.test(rowText))) {
        currentDayContext = rowText;
        return;
      }

      // Buscamos las filas de partidos que contienen los equipos y el resultado u horario
      const cols = $el.find('td');
      if (cols.length >= 3) {
        const fullRowText = $el.text().replace(/\s+/g, ' ').trim();
        const lowerText = fullRowText.toLowerCase();

        // Validamos que el equipo buscado esté en la fila
        const hasTeam = searchTerms.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(lowerText);
        });

        if (!hasTeam) return;

        // Verificamos que sea un partido (suele tener guiones de resultado, 'vs' o estados como 'Final', 'ET', o un horario HH:MM)
        const hasIndicator = lowerText.includes('-') || lowerText.includes('vs') || /\d{2}:\d{2}/.test(fullRowText);
        if (!hasIndicator) return;
        if (fullRowText.includes("Res.") || lowerText.includes("reserva")) return;

        // Extraemos el horario o estado si existe
        const timeMatch = fullRowText.match(/(\d{2}:\d{2})/) || fullRowText.match(/(Final|ET|PT|ST)/i);
        const timeStr = timeMatch ? timeMatch[1] : "A confirmar";

        const cleanText = fullRowText.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ0-9\s:-]+/g, " ").replace(/\s+/g, ' ').trim();

        const matchKey = `${cleanText}-${currentDayContext}`.toLowerCase();
        if (seenMatches.has(matchKey)) return;
        seenMatches.add(matchKey);

        matches.push({
          id: Math.random().toString(36).substring(2, 9),
          rawText: cleanText,
          league: "Liga Profesional",
          date: currentDayContext,
          time: timeStr
        });
      }
    });

    // Limitamos a los primeros 2 partidos para mantener la página liviana y rápida
    const limitedMatches = matches.slice(0, 2);

    return NextResponse.json({
      matches: limitedMatches,
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}