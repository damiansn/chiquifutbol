import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Devuelve la fecha de hoy en Argentina como { dia, mes, anio }
function hoyArgentina() {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
    return { dia: parts.day, mes: parts.month, anio: parts.year };
}

// Suma N días a una fecha DD-MM-YYYY y devuelve DD-MM-YYYY
function sumarDias(ddmmyyyy, n) {
    const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    d.setUTCDate(d.getUTCDate() + n);
    const p = v => String(v).padStart(2, '0');
    return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

async function fetchFechaArbitraria(ddmmyyyy) {
    const cacheKey = `chiquifutbol_fecha_${ddmmyyyy}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // API interna de Promiedos
    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    const apiUrl = `https://api.promiedos.com.ar/games/${yyyy}-${mm}-${dd}`;

    const res = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.promiedos.com.ar/',
            'Origin': 'https://www.promiedos.com.ar',
        },
        next: { revalidate: 0 }
    });

    if (!res.ok) return null;

    const json = await res.json();

    // Normalizar: buscar leagues igual que el sync
    function buscarLeagues(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.leagues && typeof obj.leagues === 'object') return obj.leagues;
        for (const val of Object.values(obj)) {
            const found = buscarLeagues(val);
            if (found) return found;
        }
        return null;
    }

    const leagues = buscarLeagues(json);
    if (!leagues) return null;

    // Convertir objeto leagues a array (igual que normalizarLeagues en sync)
    const partidos = Array.isArray(leagues)
        ? leagues
        : Object.entries(leagues).map(([key, value]) => ({ ...value, key }));

    if (partidos.length > 0) {
        // Caché 10 minutos para fechas pasadas/futuras, 1 min para hoy
        const hoy = hoyArgentina();
        const esHoy = ddmmyyyy === `${hoy.dia}-${hoy.mes}-${hoy.anio}`;
        await redis.set(cacheKey, JSON.stringify(partidos), 'EX', esHoy ? 60 : 600);
    }

    return partidos.length > 0 ? partidos : null;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date') || 'today';

        // Fecha fija: ayer / hoy / mañana → Redis del sync
        if (dateParam === 'today' || dateParam === 'ayer' || dateParam === 'manana') {
            const redisKey =
                dateParam === 'ayer'   ? 'chiquifutbol_matches_ayer' :
                dateParam === 'manana' ? 'chiquifutbol_matches_manana' :
                                        'chiquifutbol_matches_v2';
            const cachedData = await redis.get(redisKey);
            if (!cachedData) {
                return NextResponse.json({ error: 'No hay partidos sincronizados todavía para esta fecha.' }, { status: 404 });
            }
            return NextResponse.json(JSON.parse(cachedData));
        }

        // Fecha arbitraria DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateParam)) {
            const partidos = await fetchFechaArbitraria(dateParam);
            if (!partidos) {
                return NextResponse.json({ error: 'No hay partidos para esta fecha.' }, { status: 404 });
            }
            return NextResponse.json(partidos);
        }

        return NextResponse.json({ error: 'Fecha inválida.' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}