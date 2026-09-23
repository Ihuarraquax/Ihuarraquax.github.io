// PDF: drukuje PEŁNE CV z private/ (wariant "full", ze wszystkimi danymi)
// do private/CV_Hubert_Zablocki[_LANG].pdf przez Chromium (Playwright).
// private/ jest gitignored i NIE trafia na GitHub Pages — PDF wysyłasz ręcznie.
// Wymaga wcześniej: npm run build  oraz  npx playwright install chromium.
// Fallback bez Playwrighta: otwórz HTML w przeglądarce -> Ctrl+P -> Zapisz jako PDF.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const priv = join(root, "private");

// PL w private/, pozostałe języki w private/<lang>/. Sufiks w nazwie PDF dla EN itd.
const targets = [
  { html: join(priv, "index.html"), out: join(priv, "CV_Hubert_Zablocki.pdf") },
  ...["en"].map((l) => ({
    html: join(priv, l, "index.html"),
    out: join(priv, `CV_Hubert_Zablocki_${l.toUpperCase()}.pdf`),
  })),
].filter((t) => existsSync(t.html));

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "✗ Brak pakietu 'playwright'.\n" +
      "  Zainstaluj:  npm i -D playwright  &&  npx playwright install chromium\n" +
      "  Albo ręcznie: otwórz dist/index.html w przeglądarce → Ctrl+P → Zapisz jako PDF."
  );
  process.exit(1);
}

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(t.html).href, { waitUntil: "networkidle" });
  await page.pdf({ path: t.out, format: "A4", printBackground: true });
  await page.close();
  console.log(`✓ Zapisano PDF: ${t.out}`);
}
await browser.close();
