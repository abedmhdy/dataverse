# DataVerse — project instructions

Interactive Hebrew (RTL) study site for the course "מערכות בסיסי נתונים" (Dr. Nurit Gal-Oz; textbook Elmasri & Navathe).
React 19 + TypeScript + Vite, HashRouter, no backend. SQL runs on real SQLite via `sql.js` (WebAssembly).

## Hard rules
- **Never commit or copy original course files** (PDF/PPT/DOCX) into the repo. `.gitignore` blocks them. Course folder lives outside: `C:\Users\User\Documents\מערכות בסיסי נתונים`.
- **Do not invent lecture content or slide numbers.** Cite slides as they appear in `docs/COURSE_MAP.md` (slide = PDF page). Anything not from the lecturer is marked with `<Ext>` in lessons or "הרחבה" / "פתרון מוצע" in data.
- **Use the lecture's notation**: Chen/Elmasri ER (1/N/M labels, double line = total, double rectangle/diamond = weak, ISA triangle, `disjoint`/`d`). Ullman arrows are an alternate view only. Relational algebra uses σ π ρ ∪ ∩ − × ⋈ `*` (natural join) ÷ ℱ, `←` for assignment.
- Do not touch the NetworkVerse 3D project or any other project.
- No global installs. Playwright uses the system Edge (`channel: 'msedge'`).

## Layout
- `src/lib/ra/` — algebra parser + evaluator with step trace (pure, tested).
- `src/lib/sql/engine.ts` — sql.js wrapper, Hebrew error explanations, logical-order steps.
- `src/lib/er/` — ER model, validation (rules cite slides), ER→relational mapping (steps 1–8, 8A–8D), exercise checking.
- `src/data/` — chapters, glossary, datasets (COMPANY = textbook fig. 3.6), exercises.
- `src/lessons/<chapter>/` — one component per lesson, registered in `src/lessons/index.ts`; set `ready: true` in `src/data/chapters.ts`.
- `docs/COURSE_MAP.md`, `docs/COVERAGE_MATRIX.md` — keep the matrix updated when adding lessons.

## UI conventions
- Hebrew UI, `dir="rtl"`. Code, formulas, algebra, SQL and tables are LTR (`.ltr`, `.formula`, `table.rel`, editors). Inside Hebrew strings wrap code with U+2066…U+2069 isolates.
- English term + Hebrew translation via `<Term id=…>` (definitions in `src/data/glossary.ts`); definitions expand inline, never as overlays that hide diagrams.
- Colors only via CSS variables in `src/styles/global.css` (light + dark). Check contrast — the a11y E2E suite runs axe in both schemes.
- Quizzes: every wrong option gets a `wrong[i]` explanation.

## Commands
- `npm run dev` · `npm run build` · `npm test` (vitest, logic) · `npm run test:e2e` (Playwright + axe) · `npm run check` (all).

## Token-saving workflow
- Read the relevant `src/lib` module and its test before changing logic; run `npx vitest run <file>` for a single suite.
- For course content, grep the extracted text instead of re-reading PDFs. Extract with `pdftotext` after copying files to an ASCII path (the Windows build of pdftotext cannot open Hebrew paths).
- Prefer adding a test case to `tests/unit/*.test.ts` over manual browser checks for logic.
