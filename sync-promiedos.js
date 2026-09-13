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
        // 1. Sincronizar Partidos desde la API interna que sí funciona
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

        // 2. Sincronizar Posiciones haciendo scraping de la tabla en la URL de la Liga Profesional
        console.log("Consultando tabla de posiciones...");
        await page.goto('https://www.promiedos.com.ar/league/liga-profesional/hc', { waitUntil: 'networkidle2', timeout: 60000 });

        const standingsData = await page.evaluate(() => {
            // Buscamos la tabla de posiciones en el DOM de Promiedos
            // Por lo general está en una tabla dentro de la sección de posiciones
            const rows = document.querySelectorAll('.posiciones tr, table tr');
            const teams = [];

            rows.forEach((row, index) => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 5) {
                    const name = cols[1]?.innerText?.trim() || cols[0]?.innerText?.trim();
                    const points = cols[2]?.innerText?.trim() || cols[tokens]?.innerText?.trim();
                    
                    // Intentamos filtrar para quedarnos solo con filas que tengan equipos y puntos válidos
                    if (name && name !== "Equipo" && !isNaN(parseInt(points))) {
                        teams.push({
                            position: teams.length + 1,
                            name: name,
                            points: parseInt(cols[2]?.innerText?.trim() || 0),
                            played: parseInt(cols[3]?.innerText?.trim() || 0),
                            goal_difference: parseInt(cols[4]?.innerText?.trim() || 0)
                        });
                    }
                }
            });

            return { teams };
        });

        if (standingsData && standingsData.teams.length > 0) {
            // Guardamos usando una clave genérica o específica para la liga profesional
            await redis.set('chiquifutbol_standings', JSON.stringify(standingsData));
            // Si querés guardarla por ID de liga específico (ej: liga profesional ID 1 o similar):
            await redis.set('chiquifutbol_standings_1', JSON.stringify(standingsData));
            console.log(`¡Tabla de posiciones sincronizada en Redis (${standingsData.teams.length} equipos) !`);
        } else {
            console.log("No se pudieron extraer equipos de la tabla (puede que el selector de CSS necesite un ajuste fino).");
        }

    } catch (error) {
        console.error("Error durante el proceso con Puppeteer:", error);
    } finally {
        await browser.close();
    }
}

sincronizarDatos();
setInterval(sincronizarDatos, 60000);