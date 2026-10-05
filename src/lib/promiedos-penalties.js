import { load } from "cheerio";

export function agregarPenalesScrapeados(leagues, html) {
  if (!Array.isArray(leagues) || typeof html !== "string") return 0;

  const $ = load(html);
  const porPartido = new Map();

  $("a[href*='/game/']").each((_, link) => {
    const href = $(link).attr("href");
    if (!href) return;

    const segmentos = new URL(href, "https://www.promiedos.com.ar")
      .pathname.split("/")
      .filter(Boolean);
    const id = segmentos.at(-1);
    if (!id) return;

    const scores = $(link)
      .find(".penalties_score_rf_Gk")
      .toArray()
      .map(element => $(element).text().match(/\d+/)?.[0])
      .filter(value => value != null)
      .map(Number);

    if (scores.length >= 2 && Number.isFinite(scores[0]) && Number.isFinite(scores[1])) {
      porPartido.set(id, [scores[0], scores[1]]);
    }
  });

  let actualizados = 0;
  for (const league of leagues) {
    for (const game of league?.games || []) {
      const scores = porPartido.get(String(game?.id ?? ""));
      if (!scores) continue;
      game.scraped_penalty_scores = scores;
      actualizados += 1;
    }
  }

  return actualizados;
}
