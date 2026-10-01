const fs = require("fs");
const html = fs.readFileSync("tmp-game.html", "utf8");
const start = html.indexOf('id="__NEXT_DATA__"');
const jsonStart = html.indexOf(">", start) + 1;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const pp = data.props.pageProps;
console.log("keys", Object.keys(pp));
if (pp.data) {
  console.log("data keys", Object.keys(pp.data));
  const d = pp.data;
  for (const k of Object.keys(d)) {
    const v = d[k];
    if (v && typeof v === "object") {
      console.log(k, Array.isArray(v) ? "array" : Object.keys(v).slice(0, 25).join(","));
    } else console.log(k, v);
  }
  console.log("league-ish", JSON.stringify({
    league: d.league,
    tournament: d.tournament,
    competition: d.competition,
    game: d.game && Object.keys(d.game),
  }, null, 2).slice(0, 3000));
}

function findLeague(obj, path, depth) {
  if (!obj || typeof obj !== "object" || depth > 8) return;
  for (const k of Object.keys(obj)) {
    if (/league|tournament|compet|championship/i.test(k)) {
      console.log("HIT", path + "." + k, JSON.stringify(obj[k]).slice(0, 400));
    }
    findLeague(obj[k], path + "." + k, depth + 1);
  }
}
findLeague(pp, "pp", 0);
