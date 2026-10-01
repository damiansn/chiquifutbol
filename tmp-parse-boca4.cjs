const fs = require("fs");
const html = fs.readFileSync("tmp-boca.html", "utf8");
const start = html.indexOf('id="__NEXT_DATA__"');
const jsonStart = html.indexOf(">", start) + 1;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const next = data.props.pageProps.data.games.next;
console.log("columns", JSON.stringify(next.columns, null, 2));
console.log("name", next.name);

const i = html.indexOf("table-team");
console.log("table-team idx", i);
const chunk = html.slice(Math.max(0, i - 500), i + 8000);
fs.writeFileSync("tmp-boca-table.html", chunk);

// Find game ids in html near images
const re = /eiefbdg|eifgijh|liga-|sudamerican|libertador|copa-arg/gi;
const hits = [...html.matchAll(re)].slice(0, 30).map(m => m[0] + " @" + m.index);
console.log(hits);

// Look at a match page from next data for league in nearby strings
const around = html.indexOf("eifgijh");
console.log("vasco id context", html.slice(around - 200, around + 400));
