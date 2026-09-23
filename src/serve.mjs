// Lokalny podgląd wizytówki: buduje dist/ i serwuje na http://localhost:4173.
// Przebudowuje po zmianie źródeł (cv.yaml, cv.*.yaml, src/*). Bez zależności.
import { createServer } from "node:http";
import { readFileSync, watch } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const PORT = 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
};

const build = () => {
  const r = spawnSync(process.execPath, [join(root, "src", "build.mjs")], { stdio: "inherit" });
  if (r.status !== 0) console.error("✗ Build nie powiódł się — popraw błąd i zapisz plik.");
};

build();

createServer((req, res) => {
  // tylko ścieżka (bez query); "/" -> index.html, "/en/" -> en/index.html
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try {
    const body = readFileSync(join(dist, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
}).listen(PORT, () => console.log(`\n  Podgląd:  http://localhost:${PORT}\n  EN:       http://localhost:${PORT}/en/\n  (Ctrl+C aby zakończyć)\n`));

// Przebudowa po zmianie źródeł (z prostym debounce, bez pętli na dist/).
let timer = null;
watch(root, { recursive: true }, (_evt, file) => {
  if (!file) return;
  const f = file.replaceAll("\\", "/");
  if (f.startsWith("dist/") || f.startsWith("private/") || f.startsWith("node_modules/") || f.startsWith(".git/")) return;
  if (!/\.(ya?ml|mjs|css)$/.test(f)) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`↻ zmiana: ${f} — przebudowuję…`);
    build();
  }, 150);
});
