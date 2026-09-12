const Redis = require('ioredis');
require('dotenv').config({ path: '.env.local' });

const redis = new Redis(process.env.REDIS_URL);

async function cargarDatosPrueba() {
    try {
        const partidosDemo = [
            {
                match_id: "river_boca",
                tournament: "Liga Profesional 2026",
                status: "LIVE",
                minute: "38'",
                home_team: { name: "River Plate", goals: 1 },
                away_team: { name: "Boca Juniors", goals: 0 },
                stadium: "Mâs Monumental"
            },
            {
                match_id: "independiente_racing",
                tournament: "Liga Profesional 2026",
                status: "FT",
                minute: "Finalizado",
                home_team: { name: "Independiente", goals: 2 },
                away_team: { name: "Racing Club", goals: 2 },
                stadium: "Libertadores de América"
            }
        ];

        await redis.set('live_matches', JSON.stringify(partidosDemo));
        console.log("¡Partidos de prueba cargados en Redis con éxito!");
        process.exit(0);
    } catch (error) {
        console.error("Error al conectar con Redis:", error);
        process.exit(1);
    }
}

cargarDatosPrueba();