
import puppeteer from 'puppeteer';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis(process.env.REDIS_URL);


// ==========================================================
// CONFIGURACIÓN
// ==========================================================

const URL_CALENDARIO = 'https://www.promiedos.com.ar/calendario';


// ==========================================================
// FECHAS
// ==========================================================

function obtenerFechaArgentina(offsetDias = 0) {
    const ahora = new Date();

    const fechaArgentina = new Date(
        ahora.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires'
        })
    );

    fechaArgentina.setDate(fechaArgentina.getDate() + offsetDias);

    const dia = String(fechaArgentina.getDate()).padStart(2, '0');
    const mes = String(fechaArgentina.getMonth() + 1).padStart(2, '0');
    const anio = fechaArgentina.getFullYear();

    return {
        dia,
        mes,
        anio,
        texto: `${dia}/${mes}`,
        fecha: `${anio}-${mes}-${dia}`
    };
}


// ==========================================================
// NORMALIZAR NOMBRES
// ==========================================================

function limpiarTexto(texto) {
    return texto
        .replace(/\s+/g, ' ')
        .trim();
}


// ==========================================================
// SCRAPEAR CALENDARIO DE PROMIEDOS
// ==========================================================

async function obtenerPartidosCalendario(page, offsetDias) {

    const fechaObjetivo = obtenerFechaArgentina(offsetDias);

    console.log(
        `Buscando partidos del ${fechaObjetivo.texto} en el calendario...`
    );

    await page.goto(URL_CALENDARIO, {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const partidos = await page.evaluate((fechaBuscada) => {

        function limpiar(texto) {
            return (texto || '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function esPartido(texto) {
            if (!texto) return false;

            return (
                /\d{1,2}:\d{2}/.test(texto) &&
                /\bVS\b/i.test(texto)
            );
        }

        function extraerPartido(texto) {

            texto = limpiar(texto);

            const match = texto.match(
                /^(\d{1,2}:\d{2})\s+(.+?)\s+VS\s+(.+)$/i
            );

            if (!match) return null;

            return {
                time: match[1],
                homeTeam: limpiar(match[2]),
                awayTeam: limpiar(match[3])
            };
        }

        const resultado = [];

        // --------------------------------------------------
        // Buscamos todos los enlaces de partidos
        // --------------------------------------------------

        const enlaces = Array.from(
            document.querySelectorAll('a[href*="/game/"]')
        );

        for (const enlace of enlaces) {

            const texto = limpiar(enlace.innerText);

            if (!esPartido(texto)) {
                continue;
            }

            const partido = extraerPartido(texto);

            if (!partido) {
                continue;
            }

            // --------------------------------------------------
            // Intentar detectar la competencia
            // --------------------------------------------------

            let competencia = '';

            let elemento = enlace;

            for (let nivel = 0; nivel < 6 && elemento; nivel++) {

                const padre = elemento.parentElement;

                if (!padre) break;

                const hijos = Array.from(padre.children);
                const indice = hijos.indexOf(elemento);

                // Buscar elementos anteriores al partido
                for (let i = indice - 1; i >= 0; i--) {

                    const anterior = hijos[i];

                    const textoAnterior = limpiar(
                        anterior.innerText
                    );

                    if (!textoAnterior) continue;

                    // Evitar textos enormes
                    if (textoAnterior.length > 80) continue;

                    // Evitar otros partidos
                    if (esPartido(textoAnterior)) continue;

                    // Evitar fechas
                    if (/^\d{1,2}\/\d{1,2}$/.test(textoAnterior)) {
                        continue;
                    }

                    // Evitar información personal
                    if (
                        textoAnterior.toLowerCase().includes('cumple') ||
                        textoAnterior.toLowerCase().includes('aniversario')
                    ) {
                        continue;
                    }

                    competencia = textoAnterior;
                    break;
                }

                if (competencia) break;

                elemento = padre;
            }

            // --------------------------------------------------
            // Si no encontramos competencia, buscar en ancestros
            // --------------------------------------------------

            if (!competencia) {

                let padre = enlace.parentElement;

                while (padre) {

                    const candidatos = Array.from(
                        padre.querySelectorAll(
                            'h1,h2,h3,h4,h5,h6,strong,b'
                        )
                    );

                    for (const candidato of candidatos) {

                        const texto = limpiar(
                            candidato.innerText
                        );

                        if (!texto) continue;

                        if (texto.length > 60) continue;

                        if (esPartido(texto)) continue;

                        if (
                            texto.toLowerCase().includes('cumple') ||
                            texto.toLowerCase().includes('aniversario')
                        ) {
                            continue;
                        }

                        competencia = texto;
                        break;
                    }

                    if (competencia) break;

                    padre = padre.parentElement;

                    if (padre === document.body) break;
                }
            }

            if (!competencia) {
                competencia = 'Otros';
            }

            resultado.push({
                ...partido,
                league: competencia,
                date: fechaBuscada
            });
        }

        return resultado;

    }, fechaObjetivo.texto);


    // ------------------------------------------------------
    // Eliminar duplicados
    // ------------------------------------------------------

    const unicos = [];

    const vistos = new Set();

    for (const partido of partidos) {

        const clave =
            `${partido.date}|${partido.time}|${partido.homeTeam}|${partido.awayTeam}`;

        if (vistos.has(clave)) {
            continue;
        }

        vistos.add(clave);
        unicos.push(partido);
    }


    // ------------------------------------------------------
    // Agrupar por liga
    // ------------------------------------------------------

    const ligasMap = {};

    for (const partido of unicos) {

        const nombreLiga =
            partido.league || 'Otros';

        if (!ligasMap[nombreLiga]) {
            ligasMap[nombreLiga] = [];
        }

        ligasMap[nombreLiga].push(partido);
    }


    // ------------------------------------------------------
    // Convertir al formato que usa ChiquiFútbol
    // ------------------------------------------------------

    const leagues = Object.entries(ligasMap).map(
        ([leagueName, matches]) => {

            return {
                leagueName,
                matches: matches.map(partido => ({
                    league: leagueName,
                    leagueName,
                    date: partido.date,
                    time: partido.time,
                    homeTeam: partido.homeTeam,
                    awayTeam: partido.awayTeam,
                    local: partido.homeTeam,
                    visiting: partido.awayTeam
                }))
            };

        }
    );


    console.log(
        `Encontrados ${unicos.length} partidos del ${fechaObjetivo.texto} en ${leagues.length} competencias.`
    );


    return {
        date: fechaObjetivo.texto,
        leagues
    };
}


// ==========================================================
// SINCRONIZAR DATOS
// ==========================================================

async function sincronizarDatos() {

    console.log('');
    console.log('==========================================');
    console.log('INICIANDO SINCRONIZACIÓN');
    console.log('==========================================');

    console.log('Iniciando navegador para consultar Promiedos...');

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/120.0.0.0 Safari/537.36'
    );


    try {

        // ==================================================
        // 1. PARTIDOS
        // ==================================================

        console.log('');
        console.log('Sincronizando partidos desde el calendario...');


        // --------------------------------------------------
        // AYER
        // --------------------------------------------------

        const partidosAyer =
            await obtenerPartidosCalendario(page, -1);

        if (
            partidosAyer &&
            partidosAyer.leagues &&
            partidosAyer.leagues.length > 0
        ) {

            await redis.set(
                'chiquifutbol_matches_ayer',
                JSON.stringify(partidosAyer)
            );

            console.log(
                '¡Partidos de AYER sincronizados en Redis!'
            );

        } else {

            console.log(
                'ADVERTENCIA: no se encontraron partidos de AYER.'
            );
        }


        // --------------------------------------------------
        // HOY
        // --------------------------------------------------

        const partidosHoy =
            await obtenerPartidosCalendario(page, 0);

        if (
            partidosHoy &&
            partidosHoy.leagues &&
            partidosHoy.leagues.length > 0
        ) {

            await redis.set(
                'chiquifutbol_matches_v2',
                JSON.stringify(partidosHoy)
            );

            console.log(
                '¡Partidos de HOY sincronizados en Redis!'
            );

        } else {

            console.log(
                'ADVERTENCIA: no se encontraron partidos de HOY.'
            );
        }


        // --------------------------------------------------
        // MAÑANA
        // --------------------------------------------------

        const partidosManana =
            await obtenerPartidosCalendario(page, 1);

        if (
            partidosManana &&
            partidosManana.leagues &&
            partidosManana.leagues.length > 0
        ) {

            await redis.set(
                'chiquifutbol_matches_manana',
                JSON.stringify(partidosManana)
            );

            console.log(
                '¡Partidos de MAÑANA sincronizados en Redis!'
            );

        } else {

            console.log(
                'ADVERTENCIA: no se encontraron partidos de MAÑANA.'
            );
        }


        // ==================================================
        // 2. TABLAS Y ESTADÍSTICAS
        // ==================================================

        console.log('');
        console.log(
            'Consultando tablas y estadísticas completas...'
        );

        await page.goto(
            'https://www.promiedos.com.ar/league/liga-profesional/hc',
            {
                waitUntil: 'networkidle2',
                timeout: 60000
            }
        );


        // ==================================================
        // TABLAS DE POSICIONES
        // ==================================================

        const tablesData = await page.evaluate(() => {

            const tableElements =
                document.querySelectorAll('table');

            const groupedTables = [];

            tableElements.forEach((table, index) => {

                const rows =
                    table.querySelectorAll('tr');

                if (rows.length < 3) return;

                const teams = [];

                let title = "";

                let el =
                    table.previousElementSibling;

                while (el && !title) {

                    const text =
                        el.innerText
                            ? el.innerText.trim()
                            : "";

                    if (
                        text.length > 0 &&
                        text.length < 60
                    ) {
                        title = text;
                    }

                    el =
                        el.previousElementSibling;
                }

                if (!title) {
                    title = `Tabla ${index + 1}`;
                }


                const headers =
                    Array.from(
                        rows[0]?.querySelectorAll(
                            'th, td'
                        ) || []
                    ).map(th =>
                        th.innerText
                            .trim()
                            .toLowerCase()
                    );


                const tableText =
                    table.innerText.toLowerCase();


                const isPromedioTable =
                    title
                        .toLowerCase()
                        .includes('promedio') ||

                    title
                        .toLowerCase()
                        .includes('relegation') ||

                    tableText.includes('prom') ||

                    headers.some(h =>
                        h.includes('prom')
                    );


                if (
                    tableText.includes('goles') ||
                    tableText.includes('asistencia') ||
                    tableText.includes('amarillas')
                ) {
                    return;
                }


                rows.forEach((row, rIdx) => {

                    if (
                        rIdx === 0 &&
                        row.querySelectorAll('th').length > 0
                    ) {
                        return;
                    }

                    const cols =
                        row.querySelectorAll('td');

                    if (cols.length < 3) return;


                    const name =
                        cols[1]?.innerText?.trim() ||
                        cols[0]?.innerText?.trim();


                    let pointsStr = null;

                    let playedVal = 0;

                    let dgVal = 0;

                    let season24 = 0;

                    let season25 = 0;

                    let season26 = 0;


                    if (isPromedioTable) {

                        const rawProm =
                            cols[2]?.innerText
                                ?.trim()
                                .replace(',', '.') || '';

                        const parsedProm =
                            parseFloat(rawProm);


                        const totalPts =
                            parseInt(
                                cols[3]?.innerText?.trim() || 0
                            );


                        playedVal =
                            parseInt(
                                cols[4]?.innerText?.trim() || 0
                            );


                        season24 =
                            parseInt(
                                cols[5]?.innerText?.trim() || 0
                            );


                        season25 =
                            parseInt(
                                cols[6]?.innerText?.trim() || 0
                            );


                        season26 =
                            parseInt(
                                cols[7]?.innerText?.trim() || 0
                            );


                        dgVal = totalPts;


                        if (
                            !isNaN(parsedProm) &&
                            parsedProm > 0 &&
                            parsedProm < 10
                        ) {

                            pointsStr =
                                parsedProm.toFixed(3);

                        } else if (playedVal > 0) {

                            pointsStr =
                                (totalPts / playedVal)
                                    .toFixed(3);

                        } else {

                            pointsStr = "0.000";
                        }


                    } else {

                        const standardPts =
                            cols[2]?.innerText
                                ?.trim()
                                .replace(',', '.');


                        if (
                            standardPts &&
                            !isNaN(parseFloat(standardPts))
                        ) {

                            pointsStr =
                                standardPts;

                            playedVal =
                                parseInt(
                                    cols[3]?.innerText?.trim() || 0
                                );

                            dgVal =
                                parseInt(
                                    cols[4]?.innerText?.trim() || 0
                                );
                        }
                    }


                    if (
                        name &&
                        name !== "Equipo" &&
                        name !== "Equipos" &&
                        pointsStr
                    ) {

                        const teamObj = {

                            position:
                                teams.length + 1,

                            name,

                            points:
                                pointsStr,

                            played:
                                playedVal,

                            goal_difference:
                                dgVal
                        };


                        if (isPromedioTable) {

                            teamObj.seasons = [
                                season24,
                                season25,
                                season26
                            ];
                        }


                        teams.push(teamObj);
                    }

                });


                if (teams.length >= 5) {

                    groupedTables.push({
                        title,
                        teams
                    });
                }

            });

            return groupedTables;
        });


        // ==================================================
        // ESTADÍSTICAS PERSONALES
        // ==================================================

        const statsData = await page.evaluate(() => {

            const statBlocks = [];

            const tables =
                document.querySelectorAll('table');


            tables.forEach((table, index) => {

                const rows =
                    table.querySelectorAll('tr');


                if (rows.length < 2) {
                    return;
                }


                if (rows.length > 15) {
                    return;
                }


                let titleText = "";

                let prev =
                    table.previousElementSibling;


                while (prev && !titleText) {

                    const t =
                        prev.innerText
                            ? prev.innerText.trim()
                            : "";


                    if (
                        t.length > 1 &&
                        t.length < 50
                    ) {
                        titleText = t;
                    }


                    prev =
                        prev.previousElementSibling;
                }


                if (!titleText) {

                    const parent =
                        table.parentElement;


                    if (parent) {

                        const candidate =
                            parent.querySelector(
                                'div, span, b, h3, h4'
                            );


                        if (candidate) {

                            titleText =
                                candidate.innerText.trim();
                        }
                    }
                }


                if (!titleText) {

                    titleText =
                        `ESTADÍSTICA ${index}`;
                }


                const players = [];


                rows.forEach(row => {

                    const cols =
                        row.querySelectorAll('td');


                    if (cols.length < 2) {
                        return;
                    }


                    let playerName = "";


                    for (
                        let c = 0;
                        c < cols.length;
                        c++
                    ) {

                        const txt =
                            cols[c]
                                ?.innerText
                                ?.trim() || "";


                        if (
                            txt.length > 2 &&
                            isNaN(txt) &&
                            !txt
                                .toLowerCase()
                                .includes('jugador') &&
                            !txt
                                .toLowerCase()
                                .includes('equipo')
                        ) {

                            playerName = txt;

                            break;
                        }
                    }


                    let statValue = NaN;


                    for (
                        let c = cols.length - 1;
                        c >= 0;
                        c--
                    ) {

                        const valStr =
                            cols[c]
                                ?.innerText
                                ?.trim()
                                .replace(',', '.');


                        const val =
                            parseFloat(valStr);


                        if (
                            !isNaN(val) &&
                            valStr !== ''
                        ) {

                            statValue = val;

                            break;
                        }
                    }


                    if (
                        playerName &&
                        !isNaN(statValue)
                    ) {

                        players.push({
                            name: playerName,
                            value: statValue
                        });
                    }

                });


                if (players.length > 0) {

                    statBlocks.push({

                        category:
                            titleText.toUpperCase(),

                        players:
                            players.slice(0, 10)
                    });
                }

            });


            return statBlocks;
        });


        console.log(
            `Se detectaron ${tablesData.length} tablas de posiciones y ${statsData.length} bloques de estadísticas.`
        );


        if (
            tablesData.length > 0 ||
            statsData.length > 0
        ) {

            const payload =
                JSON.stringify({
                    tables: tablesData,
                    stats: statsData
                });


            await redis.set(
                'chiquifutbol_standings',
                payload
            );


            await redis.set(
                'chiquifutbol_standings_1',
                payload
            );


            console.log(
                '¡Tablas y estadísticas guardadas en Redis con éxito!'
            );

        } else {

            console.log(
                'No se pudieron extraer los datos correctamente.'
            );
        }


    } catch (error) {

        console.error(
            'Error durante el proceso con Puppeteer:',
            error
        );

    } finally {

        await browser.close();

        console.log(
            'Navegador cerrado.'
        );
    }
}


// ==========================================================
// EJECUCIÓN
// ==========================================================

sincronizarDatos();

setInterval(
    sincronizarDatos,
    60000
);

