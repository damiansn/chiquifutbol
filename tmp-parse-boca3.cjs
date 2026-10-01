const fs = require("fs");
const html = fs.readFileSync("tmp-boca.html", "utf8");
const start = html.indexOf('id="__NEXT_DATA__"');
const jsonStart = html.indexOf(">", start) + 1;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const rows = data.props.pageProps.data.games.next.rows;
console.log("FULL GAME 0\n", JSON.stringify(rows[0].game, null, 2));
console.log("FULL GAME VASCO\n", JSON.stringify(rows[3].game, null, 2));

const idx = html.indexOf("PRÓXIMOS");
const chunk = html.slice(idx, idx + 25000);
fs.writeFileSync("tmp-boca-table.html", chunk);
console.log("table chunk written", chunk.length);
// look for league in table html
const leagueHits = [...chunk.matchAll(/league[^"'\s<>]{0,80}|libertador|sudamerican|copa-argentina|liga-profesional/gi)].slice(0, 40);
console.log(leagueHits.map(m => m[0]));
