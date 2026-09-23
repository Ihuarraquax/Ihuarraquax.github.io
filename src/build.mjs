// Build: czyta cv.yaml (+ nakładki cv.<lang>.yaml) i renderuje DWA warianty:
//  - "web"  -> dist/      (publiczna wizytówka, BEZ danych wrażliwych; deploy na Pages)
//  - "full" -> private/   (pełne CV ze wszystkimi danymi; źródło PDF; NIE deployowane)
// Każdy wariant: index.html (PL) + <lang>/index.html dla nakładek + kopia style.css.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { render } from "./template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const priv = join(root, "private");

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

// Głębokie scalanie nakładki na bazę:
//  - obiekty: scalane po kluczach
//  - tablice: element po elemencie wg indeksu (nadmiar z bazy zostaje)
//  - skalary: wygrywa nakładka (chyba że undefined -> baza)
function merge(base, over) {
  if (Array.isArray(base) && Array.isArray(over)) {
    const out = over.map((o, i) => (i < base.length ? merge(base[i], o) : o));
    return out.concat(base.slice(over.length));
  }
  if (isObj(base) && isObj(over)) {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  return over === undefined ? base : over;
}

const load = (p) => yaml.load(readFileSync(p, "utf8"));

const base = load(join(root, "cv.yaml"));

// Wykryj dostępne języki: 'pl' (baza) + każdy cv.<lang>.yaml
const PL = "pl";
const overlays = ["en"]; // dodaj kolejne kody, gdy powstaną pliki cv.<kod>.yaml
const langs = [PL, ...overlays.filter((l) => existsSync(join(root, `cv.${l}.yaml`)))];

// Linki przełącznika dla danej strony (PL w dist/, reszta w dist/<lang>/)
const navFor = (current) =>
  langs.map((code) => ({
    code,
    active: code === current,
    href: code === PL ? (current === PL ? "." : "../") : (current === PL ? `${code}/` : `../${code}/`),
  }));

// Dane scalone raz na język (PL = baza, reszta = baza + nakładka).
const dataFor = (lang) =>
  lang === PL ? base : merge(base, load(join(root, `cv.${lang}.yaml`)));

// Nakładka prywatna (dane wrażliwe: telefon, RODO). Gitignored, więc w CI
// jej nie ma — build przechodzi, a pola po prostu nie istnieją.
// Scalana WYŁĄCZNIE na wariant "full"; "web" nigdy jej nie widzi.
const loadIfExists = (p) => (existsSync(p) ? load(p) : undefined);
const privateFor = (lang) => {
  const pl = loadIfExists(join(root, "cv.private.yaml"));
  const over = lang === PL ? undefined : loadIfExists(join(root, `cv.private.${lang}.yaml`));
  return over === undefined ? pl : merge(pl ?? {}, over);
};

// Dane dla konkretnego renderu: web = tylko publiczne, full = + nakładka prywatna.
const dataForVariant = (lang, variant) => {
  const data = dataFor(lang);
  if (variant !== "full") return data;
  const secret = privateFor(lang);
  return secret === undefined ? data : merge(data, secret);
};

// Warianty renderu: katalog docelowy + tryb render().
const variants = [
  { variant: "web", outRoot: dist },
  { variant: "full", outRoot: priv },
];

const css = join(root, "src", "style.css");

// Zdjęcie profilowe (basics.photo w cv.yaml) — kopiowane do katalogu wariantu
// obok index.html. Gdy pliku nie ma, render po prostu pomija zdjęcie.
const photoSrc = base.basics?.photo ? join(root, base.basics.photo) : undefined;
const photoName = photoSrc && existsSync(photoSrc) ? basename(photoSrc) : undefined;
if (photoSrc && !photoName) console.warn(`! Pomijam zdjęcie — brak pliku: ${photoSrc}`);

for (const { variant, outRoot } of variants) {
  mkdirSync(outRoot, { recursive: true });
  copyFileSync(css, join(outRoot, "style.css"));
  if (photoName) copyFileSync(photoSrc, join(outRoot, photoName));
  for (const lang of langs) {
    const outDir = lang === PL ? outRoot : join(outRoot, lang);
    mkdirSync(outDir, { recursive: true });
    const html = render(dataForVariant(lang, variant), {
      lang,
      variant,
      cssHref: lang === PL ? "style.css" : "../style.css",
      photoHref: photoName ? (lang === PL ? photoName : `../${photoName}`) : undefined,
      langs: navFor(lang),
    });
    writeFileSync(join(outDir, "index.html"), html, "utf8");
  }
}

const list = (rootName) => langs.map((l) => (l === PL ? `${rootName}/index.html` : `${rootName}/${l}/index.html`)).join(", ");
console.log(`✓ Wizytówka (web): ${list("dist")}`);
console.log(`✓ Pełne CV (full, lokalne): ${list("private")}`);
