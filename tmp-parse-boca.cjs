const fs = require("fs");
const html = fs.readFileSync("tmp-boca.html", "utf8");
const start = html.indexOf('id="__NEXT_DATA__"');
const jsonStart = html.indexOf(">", start) + 1;
const jsonEnd = html.indexOf("</script>", jsonStart);
const data = JSON.parse(html.slice(jsonStart, jsonEnd));
const pp = data.props.pageProps;
console.log("pageProps keys", Object.keys(pp));

function walk(obj, path) {
  if (!obj || typeof obj !== "object") return;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = path + "." + k;
    if (/game|match|fixture|league|tournament|compet/i.test(k)) {
      const preview = Array.isArray(v)
        ? "array " + v.length + (v[0] ? " first=" + JSON.stringify(v[0]).slice(0, 500) : "")
        : typeof v === "object"
          ? "obj keys=" + Object.keys(v).slice(0, 40).join(",")
          : String(v).slice(0, 200);
      console.log("FOUND", p, preview);
    }
    if (v && typeof v === "object") walk(v, p);
  }
}
walk(pp, "pageProps");
