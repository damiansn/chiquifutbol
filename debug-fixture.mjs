import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage();
await page.goto("https://www.promiedos.com.ar/team/river-plate/igi", { waitUntil: "domcontentloaded", timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const resultado = await page.evaluate(() => {
  const filas = Array.from(document.querySelectorAll("tr"));
  return filas.slice(0, 25).map(f => ({
    texto: (f.innerText || "").replace(/\s+/g, " ").trim().substring(0, 200),
    tds: f.querySelectorAll("td").length,
    ths: f.querySelectorAll("th").length,
    colspan: f.querySelector("[colspan]")?.getAttribute("colspan") || null,
    clases: f.className || "",
    htmlCorto: f.innerHTML.substring(0, 400)
  }));
});

resultado.forEach((f, i) => {
  console.log(`\n=== FILA ${i} | TDs:${f.tds} THs:${f.ths} colspan:${f.colspan} class:"${f.clases}" ===`);
  console.log("TEXTO:", f.texto);
  console.log("HTML:", f.htmlCorto);
});

await browser.close();
