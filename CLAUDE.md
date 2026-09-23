# CLAUDE.md

Kontekst projektu dla LLM rozwijającego to repozytorium.

## Czym jest ten projekt

Edytowalne, wersjonowalne **CV programisty jako kod**. Cel właściciela
(Hubert Zabłocki): aktualizować CV na bieżąco i chwalić się **certyfikatami,
szkoleniami, projektami i przeczytanymi książkami**. Wynik: publiczna
**wizytówka programistyczna** (strona WWW na GitHub Pages) + prywatny **pełny PDF CV**.

## Dwa warianty z jednego źródła (WAŻNE)

`render(data, {variant})` generuje DWA warianty z tego samego `cv.yaml`:

- **`web`** → `dist/` — **publiczna wizytówka, BEZ danych wrażliwych**, z sekcjami
  szczegółowymi (certyfikaty, szkolenia, projekty, książki, źródła wiedzy). Kontakt =
  tylko e-mail + linki (GitHub/LinkedIn); BEZ telefonu, lokalizacji, wykształcenia,
  języków, zainteresowań i RODO. To jedyne, co trafia na GitHub Pages.
- **`full`** → `private/` — **zwięzłe CV na 1 stronę A4** (źródło PDF dla rekruterów).
  Zawiera: doświadczenie, umiejętności, wykształcenie, języki, zainteresowania, RODO
  i pełny kontakt. **NIE zawiera** sekcji szczegółowych — zamiast nich elegancki
  odsyłacz do strony (`basics.website`, klasa `.more`, etykieta `morePrefix`).
  `private/` jest **w `.gitignore`** i **NIE jest deployowane** — PDF wysyłasz ręcznie.

Listę sekcji per wariant trzyma `SECTIONS` w `template.mjs`; pola wrażliwe w nagłówku
gate'uje flaga `full`. **Nigdy nie dodawaj danych wrażliwych do wariantu `web`.**
**CV (`full`) musi mieścić się na 1 stronie A4** — po zmianach sprawdź licznik stron PDF
(odstępy druku są zacieśnione w `@media print`).

## Zasada naczelna: jedno źródło prawdy

Cała treść mieszka w **`cv.yaml`**. Szablon i style tylko ją renderują.

- Zmieniasz **treść** → edytuj `cv.yaml`. Nigdy nie wpisuj treści na sztywno w `template.mjs`.
- Zmieniasz **wygląd** → `src/style.css` (`:root` ma zmienne, kolor = `--accent`).
- Zmieniasz **strukturę/kolejność sekcji lub format pola** → `src/template.mjs`
  (renderer + wpis w `SECTIONS` dla właściwych wariantów).

`dist/` i `private/` są **generowane** (w `.gitignore`) — nigdy nie edytuj ręcznie ani nie commituj.

### Dane wrażliwe (repo jest PUBLICZNE)

Repozytorium jest publiczne na GitHubie, więc **`cv.yaml` też jest publiczny**. Telefon
i klauzula RODO NIE mogą tam wrócić — mieszkają w `cv.private.yaml`
(+ `cv.private.<kod>.yaml` dla tłumaczeń), który jest w `.gitignore`.
`build.mjs` scala tę nakładkę **wyłącznie na wariant `full`**; gdy plików nie ma
(tak jest w CI na GitHub Actions), build przechodzi normalnie, a pola po prostu znikają.
Katalogi `old/` i `raw/` (stare CV, certyfikaty, bilety) są gitignorowane — nie commituj ich.
**Dodając nowe pole z danymi osobowymi, dopisuj je do `cv.private.yaml`, nie do `cv.yaml`.**

## Architektura (przepływ danych)

```
cv.yaml ─────────────┐                          ┌─ variant "web"  ─► dist/    (PL + en/)  ──► GitHub Pages
                     ├─(merge wg indeksu)─► render┤
cv.en.yaml (nakładka)┘   w src/template.mjs      └─ variant "full" ─► private/ (PL + en/)  ──┐
                                                                                             │ (lokalnie, gitignored)
private/**/index.html ──► src/pdf.mjs (Chromium/Playwright) ──► private/CV_Hubert_Zablocki[_EN].pdf
dist/ ──► .github/workflows/deploy.yml ──► GitHub Pages   (private/ NIGDY nie jest deployowane)
```

## Pliki

| Plik | Rola |
|---|---|
| `cv.yaml` | **Bazowe źródło treści (PL).** Każda sekcja to lista wpisów. |
| `cv.en.yaml` | Nakładka EN: tylko pola różniące się od `cv.yaml` (reszta dziedziczy). |
| `cv.private.yaml` | **Dane wrażliwe (telefon, RODO). Gitignored.** Scalane TYLKO na wariant `full`. Wzór: `cv.private.example.yaml`. |
| `cv.private.en.yaml` | Tłumaczenia pól wrażliwych (EN). Też gitignored. |
| `src/template.mjs` | Dane → HTML + słownik etykiet `LABELS` (i18n). Funkcja `render(data, opts)`. |
| `src/style.css` | Wygląd ekran + druk A4 (`@media print`, `@page`). |
| `src/build.mjs` | Czyta YAML (`js-yaml`), renderuje oba warianty: `dist/` (web) + `private/` (full). |
| `src/pdf.mjs` | Drukuje **pełne CV z `private/`** do PDF przez Playwright (chromium). |
| `package.json` | Skrypty: `build`, `pdf`, `serve`. `"type": "module"` (ESM). |
| `.github/workflows/deploy.yml` | Auto-deploy **tylko `dist/`** na Pages przy push na `main`. |
| `dist/` | Generowany — publiczna wizytówka (web). Gitignored. |
| `private/` | Generowany — pełne CV + PDF (full). Gitignored, **nie publikować**. |
| `old/` | Archiwum starych CV (.docx/.pdf). Tylko do odczytu danych niezmiennych. |

## Komendy

```bash
npm run build   # cv.yaml -> dist/ (web, publiczne) + private/ (full, lokalne)
npm run pdf      # build + PDF z private/ (wymaga raz: npx playwright install chromium)
npm run serve    # build + podgląd wizytówki http://localhost:4173 (serwuje dist/)
```

Środowisko: Windows, Node 24+, PowerShell. Skrypty są ESM (`.mjs`).

## Schemat `cv.yaml` (kontrakt z template.mjs)

Sekcje top-level: `basics`, `experience`, `education`, `skills`, `certyfikaty`,
`szkolenia`, `projekty`, `ksiazki`, `zrodla_wiedzy`, `jezyki`, `zainteresowania`, `rodo`.

Widoczność per wariant (patrz `SECTIONS` w `template.mjs`):
- **`web`** (publiczne): `experience`, `skills`, `certyfikaty`, `szkolenia`, `projekty`,
  `ksiazki`, `zrodla_wiedzy`. Nagłówek bez telefonu i lokalizacji.
- **`full`** (PDF, 1 strona A4): `experience`, `skills`, `education`, `jezyki`,
  `zainteresowania` + `rodo` i pełny kontakt. BEZ sekcji szczegółowych — zamiast nich
  odsyłacz `.more` do `basics.website`. To jedyne miejsce z danymi wrażliwymi.

Pola nowych sekcji:
- `basics.website`: adres strony-wizytówki (GitHub Pages). W CV (`full`) renderuje się
  jako odsyłacz `.more` „po więcej"; na stronie (`web`) jest pomijany (self-link).
- `projekty[]`: `nazwa`, `opis` (1 zdanie), `stack` (lista), `url`, `rok` (opcjonalne).
- `zrodla_wiedzy[]`: `nazwa`, `typ` (np. `blog`/`dokumentacja`/`kanał YouTube`), `url`, `opis`.

Konwencje pól:
- Daty wpisuje się jako `"YYYY-MM"` (np. `"2024-03"`); `template.mjs` formatuje do `MM.YYYY`.
  Wartość `"obecnie"` (lub dowolny nie-`YYYY-MM` tekst) renderuje się dosłownie.
- `ksiazki[]`: tylko `tytul` i `autor`. `szkolenia[]`: `nazwa`, `organizator`, `url`.
- Pola opcjonalne (`url`, `id`, ...) można pominąć — znikają z renderu.
- **Sekcja bez wpisów nie pojawia się** (helper `has()` w template.mjs).
- Treść jest po polsku.

## Wielojęzyczność (i18n)

- **Baza = `cv.yaml` (PL).** Każdy dodatkowy język to nakładka `cv.<kod>.yaml`
  zawierająca TYLKO przetłumaczone pola.
- `build.mjs` robi **deep-merge** nakładki na bazę. Tablice scalane **wg indeksu**
  (element po elemencie) — kolejność i liczba wpisów MUSZĄ się zgadzać z bazą;
  pominięty wpis = fallback do PL. Pola neutralne (kontakt, daty, tagi, stack,
  książki) zostawia się poza nakładką, żeby dziedziczyły.
- **Etykiety sekcji i słowa UI** (np. „Doświadczenie zawodowe", badge „w trakcie")
  NIE są w danych — są w `LABELS` w `template.mjs`, keyed per `lang`.
- **Token „obecnie"/„present"**: w danych wpisujesz raz (np. `data_do: "obecnie"`),
  a `fmtDate()` tłumaczy go na `L.present`. Lista słów w `PRESENT` w `template.mjs`.
- **Dodanie języka**: (a) utwórz `cv.<kod>.yaml`, (b) dopisz `<kod>` do `overlays`
  w `build.mjs`, (c) dodaj słownik w `LABELS` w `template.mjs`. Reszta (ścieżki
  `dist/<kod>/`, przełącznik, PDF z sufiksem) wygeneruje się sama.

## Reguły dla LLM przy rozwoju

1. **Dodajesz nową sekcję?** Trzeba: (a) klucz w `cv.yaml`, (b) funkcja
   renderująca `(items, L)` + wpis w `RENDERERS` w `template.mjs`, (c) dopisanie
   klucza do `SECTIONS.web` i/lub `SECTIONS.full` (zdecyduj, czy sekcja jest
   publiczna — dane wrażliwe TYLKO w `full`), (d) etykieta w `LABELS` dla każdego
   języka, (e) ewentualne style w `style.css`. Trzymaj się wzorca istniejących sekcji.
   Pamiętaj o przetłumaczeniu nowej sekcji też w `cv.en.yaml`.
2. **Zawsze escapuj** dane użytkownika w template przez `esc()` (już jest w pliku).
3. **Po każdej zmianie uruchom `npm run build`** i zweryfikuj wynik
   (screenshot `dist/index.html` = web, `private/index.html` = full, przez Playwright;
   lokalnie brak `pdftoppm`, więc PDF sprawdzaj zrzutem renderu HTML, nie czytaniem PDF).
   **Po zmianach przy danych: potwierdź, że `dist/` nie zawiera danych wrażliwych
   (telefon, RODO, adres, wykształcenie) — to jedyne, co jest publiczne.**
4. **Nie psuj druku**: zmiany layoutu testuj też pod `@media print` (A4, podział stron).
5. **Commituj po polsku**, prefiks `cv:` dla zmian treści (np. `cv: dodaj certyfikat AZ-204`).
6. Nie wprowadzaj ciężkich zależności bez potrzeby — build ma być lekki (`js-yaml` to jedyna prod-zależność; Playwright jest dev-only).

## Dane niezmienne (z `old/CV_Hubert_Zablocki.pdf`)

Hubert Zabłocki · hzablocki97@gmail.com · ang. B2 · (telefon: `cv.private.yaml`)
inż. (2017–2021) i mgr (2021–) informatyki, Uniwersytet Przyrodniczo-Humanistyczny
w Siedlcach. Pierwsze doświadczenie: BCODERS S.A. (staż 2020, potem Fullstack Dev).

## Stan / TODO

- Link GitHub w `cv.yaml` wskazuje na `Ihuarraquax`; LinkedIn do zweryfikowania przez właściciela.
- Wpisy „Przykład: …" w `certyfikaty`/`szkolenia`/`projekty`/`zrodla_wiedzy` są poglądowe
  (EN: „Example: …") — podmień na realne.
- Repo publiczne: `Ihuarraquax/Ihuarraquax.github.io`. Strona: https://ihuarraquax.github.io/
- Historia sprzed publikacji (ze starymi CV) siedzi w lokalnej gałęzi `archiwum-przed-publikacja` — **nigdy jej nie pushuj**.
- Strona = publiczna wizytówka (web). Pełne CV (PDF z `private/`) wysyłasz ręcznie rekruterom.
- Możliwe rozszerzenia: kolejne języki (np. `cv.de.yaml`), więcej projektów/źródeł wiedzy.
