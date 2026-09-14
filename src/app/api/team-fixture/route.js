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
    
    // Sinónimos
    if (rawSearch.includes('river')) searchTerms.push('river', 'river plate');
    if (rawSearch.includes('boca')) searchTerms.push('boca', 'boca jrs.', 'boca juniors');
    if (rawSearch.includes('racing')) searchTerms.push('racing', 'racing club');
    if (rawSearch.includes('san lorenzo')) searchTerms.push('san lorenzo');
    if (rawSearch.includes('independiente')) searchTerms.push('independiente', 'independiente riv.');
    if (rawSearch.includes('banfield')) searchTerms.push('banfield');
    if (rawSearch.includes('barracas')) searchTerms.push('barracas', 'barracas central');

    // Apuntamos a la sección general de partidos / fixture de Promiedos
    const targetUrl = "https://www.promiedos.com.ar/";

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error("No se pudo conectar con Promiedos");
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches = [];

    // Lógica para extraer los partidos futuros del HTML principal o de la sección de fechas
    // Buscamos los contenedores de partidos futuros o fecha siguiente
    let currentCompetition = "Liga Profesional";

    // Recorremos las tablas o bloques de partidos futuros
    $('tr').each((_, el) => {
      const $el = $(el);
      const fullRowText = $el.text().replace(/\s+/g, ' ').trim();
      const lowerText = fullRowText.toLowerCase();

      // Validamos si pertenece al equipo buscado
      const hasTeam = searchTerms.some(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        return regex.test(lowerText);
      });

      if (!hasTeam) return;

      // Descartamos si dice Finalizado, ET o si tiene pinta de estar jugándose hoy en vivo
      if (lowerText.includes('final') || lowerText.includes('et') || lowerText.includes('pt') || lowerText.includes('st')) {
        return;
      }

      // Buscamos formato de hora o fecha futura (ej: HH:MM o día de semana próximo)
      const timeMatch = fullRowText.match(/(\d{2}:\d{2})/);
      if (!timeMatch) return; // Si no tiene horario confirmado a futuro, lo salteamos

      matches.push({
        id: Math.random().toString(36).substring(2, 9),
        rawText: fullRowText,
        league: currentCompetition,
        time: timeMatch[1]
      });
    });

    // Devolvemos estrictamente los próximos 2 partidos futuros
    return NextResponse.json({
      matches: matches.slice(0, 2),
      nextDateParam: null
    });

  } catch (error) {
    console.error("Error en team-fixture API:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}