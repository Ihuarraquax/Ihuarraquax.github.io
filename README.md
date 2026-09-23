# CV — Hubert Zabłocki

Edytowalne, wersjonowalne CV. **Jedno źródło prawdy: [`cv.yaml`](cv.yaml)** →
renderowane do strony WWW i PDF z tego samego szablonu.

## Jak aktualizować

1. Edytuj **`cv.yaml`** (dopisz certyfikat, książkę, szkolenie, projekt — to po prostu listy).
2. `npm run build` — generuje `dist/index.html` + `dist/style.css`.
3. `git add -A && git commit -m "cv: dodaj certyfikat AZ-204"` — masz historię zmian.

## Komendy

| Komenda | Co robi |
|---|---|
| `npm run build` | YAML → `dist/index.html` (PL) + `dist/en/index.html` (EN) + `style.css` |
| `npm run pdf`   | build + PDF-y `CV_Hubert_Zablocki.pdf` i `..._EN.pdf` (Playwright) |
| `npm run serve` | build + podgląd na `http://localhost:4173` |

### PDF
`npm run pdf` wymaga jednorazowo: `npx playwright install chromium`.
Bez tego: otwórz `dist/index.html` w przeglądarce → **Ctrl+P → Zapisz jako PDF**
(efekt identyczny — to ten sam HTML).

## Wersja angielska (i inne języki)

Angielski to **nakładka** [`cv.en.yaml`](cv.en.yaml) z samymi przetłumaczonymi
polami. Dane neutralne (telefon, e-mail, linki, daty, tagi umiejętności, stack,
tytuły/autorzy książek) **dziedziczą się z `cv.yaml`** — nie duplikujesz ich.

- Tłumaczenie tylko tych pól, które się różnią (np. `summary`, `punkty`, `stopien`).
- Daty „obecnie" tłumaczą się same na „present" (token i18n — wpisujesz raz w `cv.yaml`).
- Po przebudowie: PL → `dist/index.html`, EN → `dist/en/index.html`, plus PDF-y
  `CV_Hubert_Zablocki.pdf` i `CV_Hubert_Zablocki_EN.pdf`. W nagłówku jest przełącznik **PL | EN**.

> ⚠️ Scalanie tablic jest **wg indeksu** — w `cv.en.yaml` zachowuj tę samą
> kolejność i liczbę wpisów co w `cv.yaml`. Pominięty wpis = zostaje wersja polska.

Kolejny język: utwórz `cv.<kod>.yaml`, dopisz `<kod>` do tablicy `overlays`
w `src/build.mjs`, dodaj słownik w `LABELS` w `src/template.mjs`.

## Struktura

```
cv.yaml              ← TYLKO to edytujesz (treść, PL = baza)
cv.en.yaml           ← nakładka EN: tylko przetłumaczone pola
src/
  template.mjs       ← szablon: dane → HTML
  style.css          ← wygląd (ekran + druk A4); kolor: zmienna --accent
  build.mjs          ← YAML → dist/
  pdf.mjs            ← dist/index.html → PDF
.github/workflows/   ← auto-publikacja na GitHub Pages
dist/                ← wynik (generowany, w .gitignore)
old/                 ← stare CV (archiwum)
```

## Publikacja online (GitHub Pages)

1. Wypchnij repo na GitHub.
2. **Settings → Pages → Source: GitHub Actions**.
3. Każdy `git push` na `main` przebudowuje i publikuje CV pod adresem Pages.

## Edycja wyglądu

Kolor przewodni i typografię zmienisz w `:root` w `src/style.css`
(np. `--accent`). Kolejność sekcji — w funkcji `render()` w `src/template.mjs`.
