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
        await page.goto('https://www.promiedos.com.ar', { waitUntil: 'networkidle2', timeout: 60000 });

        // 1. Sincronizar Partidos
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

        // 2. Sincronizar Posiciones (Ejemplo para Liga Profesional - ID 1 u otro endpoint de posiciones de su API)
        const standingsJson = await page.evaluate(async () => {
            try {
                // Ajustar el endpoint según la estructura de la API de Promiedos para posiciones
                const res = await fetch('https://api.promiedos.com.ar/league/standings/1'); 
                return await res.json();
            } catch (e) {
                return { error: e.message };
            }
        });

        if (standingsJson && !standingsJson.error) {
            await redis.set('chiquifutbol_standings', JSON.stringify(standingsJson));
            console.log("¡Tabla de posiciones sincronizada en Redis!");
        }

    } catch (error) {
        console.error("Error durante el proceso con Puppeteer:", error);
    } finally {
        await browser.close();
    }
}

sincronizarDatos();
setInterval(sincronizarDatos, 60000);