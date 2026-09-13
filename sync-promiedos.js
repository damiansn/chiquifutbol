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

                if (tableText.includes('goles') || tableText.includes('promedio de gol') && headers.length <= 3) {
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

        // Extraer Estadísticas Personales correctamente (Buscando nombre de jugador en celdas de texto)
        const statsData = await page.evaluate(() => {
            const statBlocks = [];
            const tables = document.querySelectorAll('table');
            
            tables.forEach((table) => {
                const rows = table.querySelectorAll('tr');
                if (rows.length < 2) return;

                let titleText = "";
                let parent = table.parentElement;
                for (let i = 0; i < 4 && parent && !titleText; i++) {
                    const candidate = parent.querySelector('div, span, b, h3, h4');
                    if (candidate && candidate !== table) {
                        const t = candidate.innerText.trim();
                        if (t.length > 2 && t.length < 35) {
                            titleText = t;
                        }
                    }
                    parent = parent.parentElement;
                }

                if (!titleText) {
                    let prev = table.previousElementSibling;
                    let steps = 0;
                    while (prev && !titleText && steps < 4) {
                        const t = prev.innerText ? prev.innerText.trim() : "";
                        if (t.length > 2 && t.length < 35) {
                            titleText = t;
                        }
                        prev = prev.previousElementSibling;
                        steps++;
                    }
                }

                const lowerTitle = titleText.toLowerCase();
                const isStatTable = lowerTitle.includes('goles') || 
                                    lowerTitle.includes('asistencia') || 
                                    lowerTitle.includes('barrida') || 
                                    lowerTitle.includes('tarjeta') || 
                                    lowerTitle.includes('amarilla') || 
                                    lowerTitle.includes('roja') ||
                                    lowerTitle.includes('goleador');

                if (isStatTable || rows.length <= 15) {
                    const players = [];

                    rows.forEach((row) => {
                        const cols = row.querySelectorAll('td');
                        if (cols.length >= 3) {
                            let playerName = "";
                            
                            // Buscar el primer texto que no sea un número en las columnas intermedias
                            for (let c = 1; c < cols.length - 1; c++) {
                                const text = cols[c]?.innerText?.trim();
                                if (text && text.length > 1 && isNaN(text)) {
                                    playerName = text;
                                    break;
                                }
                            }

                            if (!playerName && cols[2]) {
                                playerName = cols[2]?.innerText?.trim();
                            }

                            let statValueStr = cols[cols.length - 1]?.innerText?.trim().replace(',', '.');
                            const statValue = parseFloat(statValueStr);

                            if (playerName && 
                                !playerName.toLowerCase().includes('equipo') && 
                                !playerName.toLowerCase().includes('jugador') && 
                                !isNaN(statValue)) {
                                players.push({ name: playerName, value: statValue });
                            }
                        }
                    });

                    if (players.length > 0 && titleText) {
                        statBlocks.push({
                            category: titleText.toUpperCase(),
                            players: players.slice(0, 10)
                        });
                    }
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
    }
}

sincronizarDatos();
setInterval(sincronizarDatos, 60000);