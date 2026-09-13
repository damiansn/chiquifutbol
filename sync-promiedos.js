import puppeteer from 'puppeteer';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis(process.env.REDIS_URL);

async function sincronizarDatos() {
    console.log("Iniciando navegador para consultar Promiedos...");
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // 1. Sincronizar Partidos
        await page.goto('https://www.promiedos.com.ar', { waitUntil: 'networkidle2', timeout: 60000 });

        const partidosJson = await page.evaluate(async () => {
            try {
                const res = await fetch('https://api.promiedos.com.ar/games/today');
                return await res.json();
            } catch (e) {
                return { error: e.message };
            }
        });

        if (partidosJson && !partidosJson.error) {
            await redis.set('chiquifutbol_matches_v2', JSON.stringify(partidosJson));
            console.log("¡Partidos sincronizados en Redis!");
        }

        // 2. Sincronizar y separar las tablas por bloques (Grupos / Torneos)
        console.log("Consultando tablas de posiciones completas...");
        await page.goto('https://www.promiedos.com.ar/league/liga-profesional/hc', { waitUntil: 'networkidle2', timeout: 60000 });

        const tablesData = await page.evaluate(() => {
            const tableElements = document.querySelectorAll('table');
            const groupedTables = [];

            tableElements.forEach((table, index) => {
                const rows = table.querySelectorAll('tr');
                const teams = [];

                let title = "";
                let el = table.previousElementSibling;
                while (el && !title) {
                    const text = el.innerText ? el.innerText.trim() : "";
                    if (text.length > 0 && text.length < 60) {
                        title = text;
                    }
                    el = el.previousElementSibling;
                }
                if (!title) {
                    title = `Tabla ${index + 1}`;
                }

                const headers = Array.from(rows[0]?.querySelectorAll('th, td') || []).map(th => th.innerText.trim().toLowerCase());
                const tableText = table.innerText.toLowerCase();
                
                // Detección robusta para asegurar que tome la tabla de promedios
                let isPromedioTable = title.toLowerCase().includes('promedio') || 
                                    title.toLowerCase().includes('relegation') || 
                                    tableText.includes('prom') || 
                                    headers.some(h => h.includes('prom'));

                if (isPromedioTable) {
                    title = "PROMEDIOS";
                }

                rows.forEach((row, rIdx) => {
                    if (rIdx === 0 && row.querySelectorAll('th').length > 0) return;

                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 3) {
                        const name = cols[1]?.innerText?.trim() || cols[0]?.innerText?.trim();
                        
                        let pointsStr = null;
                        let playedVal = 0;
                        let dgVal = 0;
                        let season24 = 0;
                        let season25 = 0;
                        let season26 = 0;

                        if (isPromedioTable) {
                            let rawProm = cols[2]?.innerText?.trim().replace(',', '.') || '';
                            let parsedProm = parseFloat(rawProm);

                            const totalPts = parseInt(cols[3]?.innerText?.trim() || 0);
                            playedVal = parseInt(cols[4]?.innerText?.trim() || 0);

                            season24 = parseInt(cols[5]?.innerText?.trim() || 0);
                            season25 = parseInt(cols[6]?.innerText?.trim() || 0);
                            season26 = parseInt(cols[7]?.innerText?.trim() || 0);
                            
                            dgVal = totalPts; // Guardamos Pts totales para mostrarlos en la columna Pts

                            if (!isNaN(parsedProm) && parsedProm > 0 && parsedProm < 10) {
                                pointsStr = parsedProm.toFixed(3);
                            } else if (playedVal > 0) {
                                pointsStr = (totalPts / playedVal).toFixed(3);
                            } else {
                                pointsStr = "0.000";
                            }
                        } else {
                            const standardPts = cols[2]?.innerText?.trim().replace(',', '.');
                            if (standardPts && !isNaN(parseFloat(standardPts))) {
                                pointsStr = standardPts;
                                playedVal = parseInt(cols[3]?.innerText?.trim() || 0);
                                dgVal = parseInt(cols[4]?.innerText?.trim() || 0);
                            }
                        }

                        if (name && name !== "Equipo" && name !== "Equipos" && pointsStr) {
                            const teamObj = {
                                position: teams.length + 1,
                                name: name,
                                points: pointsStr,
                                played: playedVal,
                                goal_difference: dgVal
                            };

                            if (isPromedioTable) {
                                teamObj.seasons = [season24, season25, season26];
                            }

                            teams.push(teamObj);
                        }
                    }
                });

                if (teams.length >= 5) {
                    groupedTables.push({
                        title: title,
                        teams: teams
                    });
                }
            });

            return groupedTables;
        });

        // 3. Sincronizar Estadísticas Personales (Goles, Asistencias, Tarjetas, etc.) - Versión ampliada y flexible
        const statsData = await page.evaluate(() => {
            const statBlocks = [];
            const tables = document.querySelectorAll('table');
            
            tables.forEach((table, index) => {
                const rows = table.querySelectorAll('tr');
                if (rows.length < 3) return;

                let titleText = "";
                let el = table.previousElementSibling;
                let steps = 0;
                while (el && !titleText && steps < 4) {
                    const text = el.innerText ? el.innerText.trim() : "";
                    if (text.length > 0 && text.length < 60) {
                        titleText = text;
                    }
                    el = el.previousElementSibling;
                    steps++;
                }

                if (!titleText) {
                    const parent = table.closest('div');
                    if (parent) {
                        const header = parent.querySelector('div, span, h2, h3, b');
                        if (header) titleText = header.innerText.trim();
                    }
                }

                const lowerTitle = titleText.toLowerCase();
                const headersText = Array.from(table.querySelectorAll('th, tr:first-child')).map(e => e.innerText.toLowerCase()).join(' ');

                const isStatTable = lowerTitle.includes('goleador') || 
                                    lowerTitle.includes('gol') || 
                                    lowerTitle.includes('asistenci') || 
                                    lowerTitle.includes('tarjeta') || 
                                    lowerTitle.includes('amarilla') || 
                                    lowerTitle.includes('roja') ||
                                    headersText.includes('goles') ||
                                    headersText.includes('asist') ||
                                    (rows.length > 3 && table.querySelectorAll('td').length / rows.length <= 3);

                if (isStatTable) {
                    const players = [];

                    rows.forEach((row, rIdx) => {
                        if (rIdx === 0 && (row.querySelector('th') || row.innerText.toLowerCase().includes('jugador'))) return;

                        const cols = row.querySelectorAll('td');
                        if (cols.length >= 2) {
                            let playerName = "";
                            let statValue = "";

                            if (cols.length >= 3) {
                                playerName = cols[1]?.innerText?.trim() || cols[0]?.innerText?.trim();
                                statValue = cols[cols.length - 1]?.innerText?.trim();
                            } else {
                                playerName = cols[0]?.innerText?.trim();
                                statValue = cols[1]?.innerText?.trim();
                            }

                            if (playerName && 
                                playerName.toLowerCase() !== "equipo" && 
                                playerName.toLowerCase() !== "jugador" && 
                                playerName.toLowerCase() !== "goles" &&
                                statValue && !isNaN(statValue)) {
                                
                                players.push({
                                    name: playerName,
                                    value: Number(statValue)
                                });
                            }
                        }
                    });

                    if (players.length > 0) {
                        statBlocks.push({
                            category: titleText ? titleText.toUpperCase() : `ESTADÍSTICA ${index}`,
                            players: players.slice(0, 10)
                        });
                    }
                }
            });

            return statBlocks;
        });

        console.log(`Se detectaron ${tablesData.length} tablas de posiciones y ${statsData.length} bloques de estadísticas.`);

        if (tablesData.length > 0) {
            const payload = JSON.stringify({ tables: tablesData, stats: statsData });
            await redis.set('chiquifutbol_standings', payload);
            await redis.set('chiquifutbol_standings_1', payload);
            console.log("¡Tablas y estadísticas guardadas en Redis con éxito!");
        } else {
            console.log("No se pudieron extraer las tablas correctamente.");
        }

    } catch (error) {
        console.error("Error durante el proceso con Puppeteer:", error);
    } finally {
        await browser.close();
    }
}

sincronizarDatos();
setInterval(sincronizarDatos, 60000);