// Szablon CV: dane (z cv.yaml) -> kompletny HTML, wielojęzyczny.
// Czysty JS, bez zależności. Każda sekcja renderuje się tylko gdy ma dane.

// --- etykiety i18n (UI strings) ------------------------------------------
const LABELS = {
  pl: {
    experience: "Doświadczenie zawodowe",
    skills: "Umiejętności",
    certyfikaty: "Certyfikaty",
    szkolenia: "Szkolenia i kursy",
    projekty: "Projekty",
    ksiazki: "Przeczytane książki",
    zrodla_wiedzy: "Inne źródła wiedzy",
    education: "Wykształcenie",
    jezyki: "Języki",
    zainteresowania: "Zainteresowania",
    present: "obecnie",
    cvDownload: "Pobierz PDF",
    morePrefix: "Certyfikaty, szkolenia, projekty, książki i źródła wiedzy:",
    // odmiana: 1 rok / 22 lata / 29 lat
    age: (n) => `${n} ${n === 1 ? "rok" : (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) ? "lata" : "lat"}`,
  },
  en: {
    experience: "Professional experience",
    skills: "Skills",
    certyfikaty: "Certifications",
    szkolenia: "Courses & training",
    projekty: "Projects",
    ksiazki: "Books read",
    zrodla_wiedzy: "Other learning resources",
    education: "Education",
    jezyki: "Languages",
    zainteresowania: "Interests",
    present: "present",
    cvDownload: "Download PDF",
    morePrefix: "Certifications, training, projects, books & resources:",
    age: (n) => `${n} year${n === 1 ? "" : "s"} old`,
  },
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// słowa oznaczające "teraz" w danych — tłumaczone na etykietę L.present
const PRESENT = new Set(["obecnie", "teraz", "present", "now", "current"]);

// "2021-02" -> "02.2021"; token "obecnie"/"present"/... -> L.present;
// inny tekst -> dosłownie. L jest opcjonalne (np. dla pól bez tokenów).
const fmtDate = (d, L) => {
  if (!d) return "";
  const s = String(d).trim();
  if (L && PRESENT.has(s.toLowerCase())) return esc(L.present);
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  return m ? `${m[2]}.${m[1]}` : esc(d);
};
// Wiek z daty urodzenia "YYYY-MM-DD" — liczony przy każdym buildzie, więc
// nie wymaga ręcznej aktualizacji. Zła/brakująca data -> undefined (pole znika).
const ageFrom = (birth, now = new Date()) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth ?? "").trim());
  if (!m) return undefined;
  const [, y, mo, d] = m.map(Number);
  const hadBirthday =
    now.getMonth() + 1 > mo || (now.getMonth() + 1 === mo && now.getDate() >= d);
  const age = now.getFullYear() - y - (hadBirthday ? 0 : 1);
  return age >= 0 ? age : undefined;
};

const range = (od, doo, L) =>
  [fmtDate(od, L), fmtDate(doo, L)].filter(Boolean).join(" – ");

const has = (a) => Array.isArray(a) && a.length > 0;

const section = (title, body) =>
  `<section class="block"><h2>${esc(title)}</h2>${body}</section>`;

// --- sekcje (L = słownik etykiet dla języka) -----------------------------

const experience = (items, L) =>
  !has(items) ? "" : section(L.experience, items.map((e) => `
    <article class="entry">
      <div class="entry-head">
        <h3>${esc(e.role)}${e.company ? ` · <span class="org">${esc(e.company)}</span>` : ""}</h3>
        <span class="dates">${range(e.data_od, e.data_do, L)}</span>
      </div>
      ${has(e.stack) ? `<p class="stack">${e.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</p>` : ""}
      ${has(e.punkty) ? `<ul class="bullets">${e.punkty.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
    </article>`).join(""));

const education = (items, L) =>
  !has(items) ? "" : section(L.education, items.map((e) => `
    <article class="entry">
      <div class="entry-head">
        <h3>${esc(e.stopien)}${e.kierunek ? ` · <span class="org">${esc(e.kierunek)}</span>` : ""}</h3>
        <span class="dates">${range(e.data_od, e.data_do, L)}</span>
      </div>
      ${e.uczelnia ? `<p class="sub">${esc(e.uczelnia)}</p>` : ""}
    </article>`).join(""));

const skills = (groups, L) =>
  !has(groups) ? "" : section(L.skills, `<div class="skills">${groups.map((g) => `
      <div class="skill-group">
        <span class="skill-cat">${esc(g.kategoria)}</span>
        <span class="skill-list">${(g.pozycje || []).map((p) => `<span class="tag">${esc(p)}</span>`).join("")}</span>
      </div>`).join("")}</div>`);

const certyfikaty = (items, L) =>
  !has(items) ? "" : section(L.certyfikaty, `<ul class="cards">${items.map((c) => `
      <li class="card">
        <span class="card-title">${c.url ? `<a href="${esc(c.url)}">${esc(c.nazwa)}</a>` : esc(c.nazwa)}</span>
        <span class="card-meta">${[esc(c.wydawca), fmtDate(c.data)].filter(Boolean).join(" · ")}${c.id ? ` · ID: ${esc(c.id)}` : ""}</span>
      </li>`).join("")}</ul>`);

const szkolenia = (items, L) =>
  !has(items) ? "" : section(L.szkolenia, `<ul class="cards">${items.map((s) => `
      <li class="card">
        <span class="card-title">${s.url ? `<a href="${esc(s.url)}">${esc(s.nazwa)}</a>` : esc(s.nazwa)}</span>
        <span class="card-meta">${esc(s.organizator)}</span>
      </li>`).join("")}</ul>`);

const ksiazki = (items, L) =>
  !has(items) ? "" : section(L.ksiazki, `<ul class="books">${items.map((b) => `
      <li class="book">
        <span class="book-title">${esc(b.tytul)}</span>
        <span class="book-meta">${esc(b.autor)}</span>
      </li>`).join("")}</ul>`);

const projekty = (items, L) =>
  !has(items) ? "" : section(L.projekty, items.map((p) => `
    <article class="entry">
      <div class="entry-head">
        <h3>${p.url ? `<a href="${esc(p.url)}">${esc(p.nazwa)}</a>` : esc(p.nazwa)}</h3>
        <span class="dates">${fmtDate(p.rok, L)}</span>
      </div>
      ${p.opis ? `<p class="sub">${esc(p.opis)}</p>` : ""}
      ${has(p.stack) ? `<p class="stack">${p.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</p>` : ""}
    </article>`).join(""));

const zrodla_wiedzy = (items, L) =>
  !has(items) ? "" : section(L.zrodla_wiedzy, `<ul class="cards">${items.map((z) => `
      <li class="card">
        <span class="card-title">${z.url ? `<a href="${esc(z.url)}">${esc(z.nazwa)}</a>` : esc(z.nazwa)}${z.opis ? ` <span class="card-desc">${esc(z.opis)}</span>` : ""}</span>
        ${z.typ ? `<span class="card-meta">${esc(z.typ)}</span>` : ""}
      </li>`).join("")}</ul>`);

const jezyki = (items, L) =>
  !has(items) ? "" : section(L.jezyki, `<ul class="inline">${items.map((j) => `<li><strong>${esc(j.jezyk)}</strong> — ${esc(j.poziom)}</li>`).join("")}</ul>`);

const zainteresowania = (items, L) =>
  !has(items) ? "" : section(L.zainteresowania, `<p class="interests">${items.map((i) => esc(i)).join(" · ")}</p>`);

// przełącznik języków: [{code, href, active}]
const langNav = (langs) =>
  !has(langs) || langs.length < 2 ? "" :
  `<nav class="lang-switch">${langs.map((l) =>
    l.active
      ? `<span class="lang active">${esc(l.code.toUpperCase())}</span>`
      : `<a class="lang" href="${esc(l.href)}">${esc(l.code.toUpperCase())}</a>`
  ).join("")}</nav>`;

// adres do pokazania: bez protokołu i końcowego "/"
const displayUrl = (u) => String(u ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");

// full=false (wariant web): bez wieku, telefonu i lokalizacji — tylko email i linki.
// photoHref: gotowy adres zdjęcia względem strony (build kopiuje plik obok index.html).
const header = (b, langs, full, L, photoHref) => {
  const c = b.contact || {};
  // wiek: dana wrażliwa (b.birthDate z cv.private.yaml) — tylko wariant "full"
  const age = full ? ageFrom(b.birthDate) : undefined;
  const bits = [
    age !== undefined ? `<span>${esc(L.age(age))}</span>` : "",
    full && c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${esc(c.phone)}</a>` : "",
    c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "",
    ...(b.links || []).map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`),
    full && b.location ? `<span>${esc(b.location)}</span>` : "",
  ].filter(Boolean);
  // W CV (full) sekcje szczegółowe żyją na stronie — kierujemy tam czytelnika.
  const more = full && b.website
    ? `<p class="more">${esc(L.morePrefix)} <a href="${esc(b.website)}">${esc(displayUrl(b.website))}</a></p>`
    : "";
  const photo = photoHref
    ? `<img class="photo" src="${esc(photoHref)}" alt="${esc(b.name)}" width="308" height="308">`
    : "";
  return `
  <header class="cv-header">
    ${langNav(langs)}
    <div class="head-main">
      <div class="head-text">
        <div class="identity">
          <h1>${esc(b.name)}</h1>
          ${b.title ? `<p class="role-title">${esc(b.title)}</p>` : ""}
        </div>
        <p class="contacts">${bits.join('<span class="sep">·</span>')}</p>
        ${b.summary ? `<p class="summary">${esc(b.summary)}</p>` : ""}
      </div>
      ${photo}
    </div>
    ${more}
  </header>`;
};

// Rejestr rendererów sekcji: klucz = klucz danych w cv.yaml.
const RENDERERS = {
  experience,
  education,
  skills,
  certyfikaty,
  szkolenia,
  projekty,
  ksiazki,
  zrodla_wiedzy,
  jezyki,
  zainteresowania,
};

// Które sekcje (i w jakiej kolejności) renderuje dany wariant.
//  - "web"  : pełna wizytówka — w tym sekcje szczegółowe (certyfikaty, szkolenia,
//             projekty, książki, źródła wiedzy). To tu wysyłamy po więcej detali.
//  - "full" : zwięzłe CV na 1 stronę A4 (źródło PDF) — BEZ sekcji szczegółowych;
//             zamiast nich elegancki link do strony (b.website). Z RODO i pełnym kontaktem.
const SECTIONS = {
  web: ["experience", "skills", "certyfikaty", "szkolenia", "projekty", "ksiazki", "zrodla_wiedzy"],
  full: ["experience", "skills", "education", "jezyki", "zainteresowania"],
};

/**
 * @param {object} data  - dane CV (po scaleniu z nakładką językową)
 * @param {object} opts  - { lang, cssHref, photoHref, langs, variant: "web"|"full" }
 */
export function render(data, opts = {}) {
  const lang = opts.lang || "pl";
  const L = LABELS[lang] || LABELS.pl;
  const cssHref = opts.cssHref || "style.css";
  const variant = opts.variant === "full" ? "full" : "web";
  const full = variant === "full";
  const b = data.basics || {};

  const sections = SECTIONS[variant]
    .map((key) => RENDERERS[key](data[key], L))
    .join("\n");

  const body = [
    header(b, opts.langs, full, L, opts.photoHref),
    sections,
    full && data.rodo ? `<footer class="rodo">${esc(data.rodo)}</footer>` : "",
  ].filter(Boolean).join("\n");

  const titleKind = full ? "CV" : "Portfolio";
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(b.name)} — ${titleKind}${lang === "en" ? " (EN)" : ""}</title>
  <link rel="stylesheet" href="${esc(cssHref)}">
</head>
<body>
  <main class="cv">
${body}
  </main>
</body>
</html>`;
}
