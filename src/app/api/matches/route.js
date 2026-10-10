import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { agregarPenalesScrapeados } from '../../../lib/promiedos-penalties.js';

const redis = new Redis(process.env.REDIS_URL);

const REDIS_STANDINGS = {
  libertadores:     'chiquifutbol_libertadores',
  sudamericana:     'chiquifutbol_sudamericana',
  copa_argentina:   'chiquifutbol_copa_argentina',
  champions:        'chiquifutbol_champions',
  europa_league:    'chiquifutbol_europa_league',
  conference_league:'chiquifutbol_conference_league',
  u20_world_cup:    'chiquifutbol_u20_world_cup',
  copa_america:     'chiquifutbol_copa_america',
  eliminatorias_conmebol: 'chiquifutbol_eliminatorias_conmebol',
  eliminatorias_uefa:     'chiquifutbol_eliminatorias_uefa',
  eliminatorias_concacaf: 'chiquifutbol_eliminatorias_concacaf',
  euro:             'chiquifutbol_euro',
  repechaje_mundial:'chiquifutbol_repechaje_mundial',
};

function hoyArgentina() {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
    return { dia: parts.day, mes: parts.month, anio: parts.year };
}

// ─── CALCULAR GLOBAL DESDE BRACKETS ──────────────────────────────────────────
// Dado un partido, busca su serie en los brackets y calcula el global acumulado
function calcularGlobalDesdeBrackets(game, brackets) {
    if (!brackets?.stages) return null;
    const gid = game?.id ? String(game.id) : null;
    const teamIds = (game?.teams || []).map(t => t?.id ? String(t.id) : null).filter(Boolean);
    if (teamIds.length < 2) return null;

    for (const stage of brackets.stages) {
        for (const group of (stage?.groups || [])) {
            const games = group?.games || [];
            if (games.length < 2) continue;

            // Ver si este grupo contiene el partido
            const enGrupo = games.some(g => {
                if (gid && g?.id && String(g.id) === gid) return true;
                const gTeamIds = (g?.teams || []).map(t => t?.id ? String(t.id) : null).filter(Boolean);
                return teamIds.every(id => gTeamIds.includes(id));
            });
            if (!enGrupo) continue;

            // Calcular global
            const scores = { [teamIds[0]]: 0, [teamIds[1]]: 0 };
            let hayResultados = false;
            for (const g of games) {
                const sc = Array.isArray(g?.scores) ? g.scores : [];
                const ts = (g?.teams || []).map(t => t?.id ? String(t.id) : null);
                if (sc.length < 2 || ts.length < 2) continue;
                const s0 = Number(sc[0]); const s1 = Number(sc[1]);
                if (!Number.isFinite(s0) || !Number.isFinite(s1)) continue;
                hayResultados = true;
                if (scores[ts[0]] !== undefined) scores[ts[0]] += s0;
                if (scores[ts[1]] !== undefined) scores[ts[1]] += s1;
            }
            if (!hayResultados) return null;
            return { score1: scores[teamIds[0]], score2: scores[teamIds[1]] };
        }
    }
    return null;
}

// ─── CARGAR TODOS LOS BRACKETS EN MEMORIA ────────────────────────────────────
async function cargarBrackets() {
    const brackets = {};
    for (const [key, redisKey] of Object.entries(REDIS_STANDINGS)) {
        try {
            const raw = await redis.get(redisKey);
            if (!raw) continue;
            const data = JSON.parse(raw);
            if (data?.brackets?.stages?.length > 0) brackets[key] = data.brackets;
        } catch {}
    }
    return brackets;
}

// ─── DETECTAR COMPETENCIA DE UN PARTIDO ──────────────────────────────────────
function detectarCompetencia(leagueName) {
    const n = (leagueName || '').toLowerCase();
    if (n.includes('libertadores')) return 'libertadores';
    if (n.includes('sudamericana')) return 'sudamericana';
    if (n.includes('copa argentina')) return 'copa_argentina';
    if (n.includes('champions')) return 'champions';
    if (n.includes('europa league')) return 'europa_league';
    if (n.includes('conference')) return 'conference_league';
    if (n.includes('copa am')) return 'copa_america';
    if (n.includes('u20') || n.includes('sub-20') || n.includes('mundial sub')) return 'u20_world_cup';
    if (n.includes('conmebol wc') || n.includes('conmebol-wc') || n.includes('eliminatorias conmebol')) return 'eliminatorias_conmebol';
    if (n.includes('uefa world cup') || n.includes('eliminatorias uefa')) return 'eliminatorias_uefa';
    if (n.includes('concacaf world cup') || n.includes('eliminatorias concacaf')) return 'eliminatorias_concacaf';
    if (n.includes('euro')) return 'euro';
    if (n.includes('repechaje') || n.includes('inter-confederation')) return 'repechaje_mundial';
    return null;
}

// ─── ENRIQUECER PARTIDOS CON GLOBAL ──────────────────────────────────────────
function enriquecerConGlobal(partidos, allBrackets) {
    for (const league of partidos) {
        const comp = detectarCompetencia(league?.name || league?.nombre || '');
        const brackets = comp ? allBrackets[comp] : null;
        if (!brackets) continue;
        for (const game of (league?.games || [])) {
            if (game.global) continue;
            const global = calcularGlobalDesdeBrackets(game, brackets);
            if (global) game.global = global;
        }
    }
    return partidos;
}

async function fetchFechaArbitraria(ddmmyyyy) {
    const cacheKey = `chiquifutbol_fecha_${ddmmyyyy}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    const apiUrl = `https://api.promiedos.com.ar/games/${dd}-${mm}-${yyyy}`;
    const pageUrl = `https://www.promiedos.com.ar/games/${dd}-${mm}-${yyyy}`;

    function buscarLeagues(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.leagues && typeof obj.leagues === 'object') return obj.leagues;
        for (const val of Object.values(obj)) {
            const found = buscarLeagues(val);
            if (found) return found;
        }
        return null;
    }

    let json = null;
    let html = null;
    let res = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.promiedos.com.ar/',
            'Origin': 'https://www.promiedos.com.ar',
        },
        next: { revalidate: 0 }
    });

    if (res.ok) {
        try {
            json = await res.json();
        } catch {}
    }

    let leagues = buscarLeagues(json);

    if (!leagues) {
        try {
            const pageRes = await fetch(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Referer': 'https://www.promiedos.com.ar/',
                },
                next: { revalidate: 0 }
            });
            if (pageRes.ok) {
                html = await pageRes.text();
                const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
                if (match) {
                    const pageJson = JSON.parse(match[1]);
                    leagues = buscarLeagues(pageJson);
                    if (leagues) json = pageJson;
                }
            }
        } catch {}
    }

    if (!leagues) return null;

    let partidos = Array.isArray(leagues)
        ? leagues
        : Object.entries(leagues).map(([key, value]) => ({ ...value, key }));

    if (partidos.length > 0) {
        if (html == null) {
            try {
                const pageRes = await fetch(pageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Referer': 'https://www.promiedos.com.ar/',
                    },
                    next: { revalidate: 0 }
                });
                if (pageRes.ok) {
                    html = await pageRes.text();
                }
            } catch (error) {
                console.error('No se pudieron leer los penales desde Promiedos:', error);
            }
        }
        if (html != null) agregarPenalesScrapeados(partidos, html);

        // Enriquecer con globales desde brackets
        const allBrackets = await cargarBrackets();
        partidos = enriquecerConGlobal(partidos, allBrackets);

        const hoy = hoyArgentina();
        const esHoy = ddmmyyyy === `${hoy.dia}-${hoy.mes}-${hoy.anio}`;
        await redis.set(cacheKey, JSON.stringify(partidos), 'EX', esHoy ? 60 : 600);
    }

    return partidos.length > 0 ? partidos : null;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = searchParams.get('game');
        const dateParam = searchParams.get('date') || 'today';

        if (gameId) {
            if (!/^[a-z0-9]{1,32}$/i.test(gameId)) {
                return NextResponse.json({ error: 'ID de partido inválido.' }, { status: 400 });
            }

            const response = await fetch(`https://api.promiedos.com.ar/gamecenter/${encodeURIComponent(gameId)}`, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8,tr;q=0.7,zh-TW;q=0.6,zh;q=0.5',
                    'Origin': 'https://www.promiedos.com.ar',
                    'Referer': 'https://www.promiedos.com.ar/',
                    'X-Ver': '1.11.7.5',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                },
                cache: 'no-store',
            });
            if (!response.ok) {
                return NextResponse.json({ error: 'No se pudo cargar las estadísticas de este partido.' }, { status: 502 });
            }

            const data = await response.json();
            if (!data?.game) {
                return NextResponse.json({ error: 'No hay datos disponibles para este partido.' }, { status: 404 });
            }
            return NextResponse.json(data.game, { headers: { 'Cache-Control': 'no-store' } });
        }

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