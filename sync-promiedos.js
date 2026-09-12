import puppeteer from 'puppeteer';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis(process.env.REDIS_URL);

async function sincronizarPartidos() {
    console.log("Iniciando navegador para consultar Promiedos...");
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto('https://www.promiedos.com.ar', { waitUntil: 'networkidle2', timeout: 60000 });

        const partidosJson = await page.evaluate(async () => {
            try {
                const response = await fetch('https://api.promiedos.com.ar/games/today');
                return await response.json();
            } catch (e) {
                return { error: e.message };
            }
        });

        if (!partidosJson || partidosJson.error) {
            console.error("Error al obtener el JSON de la API:", partidosJson?.error || "Vacío");
            return;
        }

        await redis.set('chiquifutbol_matches_v2', JSON.stringify(partidosJson));
        console.log("¡Datos de la API sincronizados en Redis correctamente!");

    } catch (error) {
        console.error("Error durante el proceso con Puppeteer:", error);
    } finally {
        await browser.close();
    }
}

sincronizarPartidos();
setInterval(sincronizarPartidos, 60000);