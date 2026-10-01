const fs = require("fs");
const html = fs.readFileSync("tmp-boca.html", "utf8");
const start = html.indexOf('id="__NEXT_DATA__"');
const jsonStart = html.indexOf(">", start) + 1;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const next = data.props.pageProps.data.games.next;
console.log("next keys", Object.keys(next));
console.log("main_league", JSON.stringify(data.props.pageProps.data.main_league, null, 2));
console.log("row0 keys", Object.keys(next.rows[0]));
for (let i = 0; i < next.rows.length; i++) {
  const r = next.rows[i];
  const g = r.game || {};
  const teams = (g.teams || []).map(t => t.name || t.short_name);
  console.log(JSON.stringify({
    i,
    rowKeys: Object.keys(r),
    league: r.league || r.tournament || r.competition,
    extra: Object.fromEntries(Object.entries(r).filter(([k]) => k !== "game")),
    start_time: g.start_time,
    url_name: g.url_name,
    teams,
    stage: g.stage_round_name,
    description: g.description
  }));
}
