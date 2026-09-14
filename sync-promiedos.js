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
        // 1. Sincronizar Partidos (Ayer, Hoy y Mañana)
        console.log("Sincronizando partidos (ayer, hoy, mañana)...");

        // --- HOY ---
        await page.goto('https://www.promiedos.com.ar', { waitUntil: 'networkidle2', timeout: 60000 });
        const partidosHoy = await page.evaluate(async () => {
            try {
                const res = await fetch('https://api.promiedos.com.ar/games/today');
                return await res.json();
            } catch (e) {
                return { error: e.message };
            }
        });
        if (partidosHoy && !partidosHoy.error) {
            await redis.set('chiquifutbol_matches_v2', JSON.stringify(partidosHoy));
            console.log("¡Partidos de HOY sincronizados en Redis!");
        }

        // --- AYER ---
        await page.goto('https://www.promiedos.com.ar/ayer', { waitUntil: 'networkidle2', timeout: 60000 });
        const partidosAyer = await page.evaluate(async () => {
            try {
                const res = await fetch('https://api.promiedos.com.ar/games/yesterday');
                return await res.json();
            } catch (e) {
                return { error: e.message };
            }
        });
        if (partidosAyer && !partidosAyer.error) {
            await redis.set('chiquifutbol_matches_ayer', JSON.stringify(partidosAyer));
            console.log("¡Partidos de AYER sincronizados en Redis!");
        }

        // --- MAÑANA ---
        await page.goto('https://www.promiedos.com.ar/man', { waitUntil: 'networkidle2', timeout: 60000 });
        const partidosManana = await page.evaluate(async () => {
            try {
                const res = await fetch('https://api.promiedos.com.ar/games/tomorrow');
                return await res.json();
            } catch (e) {
                return { error: e.message };
            }
        });
        if (partidosManana && !partidosManana.error) {
            await redis.set('chiquifutbol_matches_manana', JSON.stringify(partidosManana));
            console.log("¡Partidos de MAÑANA sincronizados en Redis!");
        }

        // 2. Sincronizar la URL de la Liga Profesional (Tablas y Estadísticas)
        console.log("Consultando tablas y estadísticas completas...");
        await page.goto('https://www.promiedos.com.ar/league/liga-profesional/hc', { waitUntil: 'networkidle2', timeout: 60000 });

        // Extraer Tablas de Posiciones
        const tablesData = await page.evaluate(() => {
            const tableElements = document.querySelectorAll('table');
            const groupedTables = [];

            tableElements.forEach((table, index) => {
                const rows = table.querySelectorAll('tr');
                if (rows.length < 3) return;

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
                
                let isPromedioTable = title.toLowerCase().includes('promedio') || 
                                      title.toLowerCase().includes('relegation') || 
                                      tableText.includes('prom') || 
                                      headers.some(h => h.includes('prom'));

                if (isPromedioTable) {
                    title = "PROMEDIOS";
                }

                if (tableText.includes('goles') || tableText.includes('asistencia') || tableText.includes('amarillas')) {
                    return; 
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
                            
                            dgVal = totalPts;

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

        // Extraer Estadísticas Personales
        const statsData = await page.evaluate(() => {
            const statBlocks = [];
            const tables = document.querySelectorAll('table');
            
            tables.forEach((table, index) => {
                const rows = table.querySelectorAll('tr');
                if (rows.length < 2) return;
                if (rows.length > 15) return;

                let titleText = "";
                let prev = table.previousElementSibling;
                while (prev && !titleText) {
                    const t = prev.innerText ? prev.innerText.trim() : "";
                    if (t.length > 1 && t.length < 50) {
                        titleText = t;
                    }
                    prev = prev.previousElementSibling;
                }

                if (!titleText) {
                    const parent = table.parentElement;
                    if (parent) {
                        const candidate = parent.querySelector('div, span, b, h3, h4');
                        if (candidate) titleText = candidate.innerText.trim();
                    }
                }

                if (!titleText) {
                    titleText = `ESTADÍSTICA ${index}`;
                }

                const players = [];
                rows.forEach((row) => {
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 2) {
                        let playerName = "";
                        for (let c = 0; c < cols.length; c++) {
                            const txt = cols[c]?.innerText?.trim() || "";
                            if (txt.length > 2 && isNaN(txt) && !txt.toLowerCase().includes('jugador') && !txt.toLowerCase().includes('equipo')) {
                                playerName = txt;
                                break;
                            }
                        }

                        let statValue = NaN;
                        for (let c = cols.length - 1; c >= 0; c--) {
                            const valStr = cols[c]?.innerText?.trim().replace(',', '.');
                            const val = parseFloat(valStr);
                            if (!isNaN(val) && valStr !== '') {
                                statValue = val;
                                break;
                            }
                        }

                        if (playerName && !isNaN(statValue)) {
                            players.push({ name: playerName, value: statValue });
                        }
                    }
                });

                if (players.length > 0) {
                    statBlocks.push({
                        category: titleText.toUpperCase(),
                        players: players.slice(0, 10)
                    });
                }
            });

            return statBlocks;
        });

        console.log(`Se detectaron ${tablesData.length} tablas de posiciones y ${statsData.length} bloques de estadísticas.`);

        if (tablesData.length > 0 || statsData.length > 0) {
            const payload = JSON.stringify({ tables: tablesData, stats: statsData });
            await redis.set('chiquifutbol_standings', payload);
            await redis.set('chiquifutbol_standings_1', payload);
            console.log("¡Tablas y estadísticas guardadas en Redis con éxito!");
        } else {
            console.log("No se pudieron extraer los datos correctamente.");
        }

    } catch (error) {
        console.error("Error durante el proceso con Puppeteer:", error);
    } finally {
        await browser.close();
        // Cerramos la conexión de Redis al terminar el script para que no quede colgando
        await redis.quit();
    }
}

// Ejecución directa (ideal para GitHub Actions)
sincronizarDatos();