import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const keys = ['chiquifutbol_matches_v2', 'chiquifutbol_matches_ayer', 'chiquifutbol_matches_manana'];

for (const k of keys) {
  const raw = await redis.get(k);
  console.log('KEY', k, 'exists', !!raw);
  if (!raw) continue;
  const data = JSON.parse(raw);
  const games = data.flatMap((l) => Array.isArray(l.games) ? l.games : []);
  const match = games.find((x) => {
    const names = (x?.teams || []).map((t) => t?.name || '').join(' ');
    return /platense|estudiantes|panama|new zealand/i.test(`${names} ${x?.name || ''}`);
  });
  console.log('sample', match && {
    id: match.id,
    start_time: match.start_time,
    datetime: match.datetime,
    date: match.date,
    time: match.time,
    status: match.status,
    teams: (match.teams || []).map((t) => ({ name: t.name, id: t.id }))
  });
}

await redis.quit();
