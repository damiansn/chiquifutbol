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

                let title = `Tabla ${index + 1}`;
                let parentPrev = table.previousElementSibling;
                if (parentPrev && parentPrev.innerText && parentPrev.innerText.length < 30) {
                    title = parentPrev.innerText.trim();
                }

                rows.forEach((row) => {
                    const cols = row.querySelectorAll('td');
                    if (cols.length >= 5) {
                        const name = cols[1]?.innerText?.trim() || cols[0]?.innerText?.trim();
                        const pointsStr = cols[2]?.innerText?.trim();

                        // Verificamos si tiene puntos válidos (ya sea entero o decimal para promedios)
                        if (name && name !== "Equipo" && pointsStr && !isNaN(parseFloat(pointsStr))) {
                            const pointsValue = pointsStr.includes('.') ? parseFloat(pointsStr) : parseInt(pointsStr) || 0;

                            teams.push({
                                position: teams.length + 1,
                                name: name,
                                points: pointsValue,
                                played: parseInt(cols[3]?.innerText?.trim() || 0),
                                goal_difference: parseInt(cols[4]?.innerText?.trim() || 0)
                            });
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

        console.log(`Se detectaron ${tablesData.length} tablas separadas.`);

        if (tablesData.length > 0) {
            await redis.set('chiquifutbol_standings', JSON.stringify({ tables: tablesData }));
            await redis.set('chiquifutbol_standings_1', JSON.stringify({ tables: tablesData }));
            console.log("¡Todas las tablas seccionadas y guardadas en Redis con éxito!");
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