# Chartly – Auto-Report Studio

Turn Excel and CSV files into charts, plain-English findings and presentation-ready reports (PDF and PowerPoint), **entirely in your browser**.

## Privacy

- Your file is read, analysed and exported inside your browser tab. There is no server, no database, no accounts and no analytics.
- A strict Content-Security-Policy blocks every network request except to the app's own files, so this is verifiable (see "Verify the privacy claim").
- **Clear data** in the app terminates the background worker and drops the data from memory.

## What it does

1. **Import** `.xlsx`, `.xls`, `.csv`, `.tsv` (up to 50 MB and 500,000 rows). Column types are detected, and clean-up steps are explained.
2. **Explore** rule-based findings (each with a "Why this?" evidence list) and recommended charts.
3. **Compose** an editable report: reorder sections, edit text, pick a theme and layout (executive document, grid document, 16:9 slides), undo and redo.
4. **Export** a PDF or PowerPoint (editable native charts where possible) after a preflight check.

Findings are transparent statistics (trends, changes, correlations, outliers, concentration, data quality). No AI service is used.

## Run it

```bash
npm install
npm run dev        # development server
npm test           # unit tests (Vitest)
npm run e2e        # end-to-end + accessibility tests (Playwright, runs against the production build)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

First time only: `npx playwright install chromium`.

Optional benchmark (100k and 500k rows): set `VITE_BENCH=1` and run `npx vitest run src/bench`.

## Project layout

```
src/
  domain/      types and Zod schemas only (the shared vocabulary)
  core/        pure logic, no React: parsing, analysis, insights, recommendations, charts, report layout, export
  workers/     the data worker (owns the full dataset) and its typed API
  state/       Zustand stores: session, report (with undo/redo)
  components/  reusable UI;  pages/  the four stages;  hooks/  utils/  themes/
e2e/           Playwright journey and accessibility tests
```

Key idea: a report is one serialisable `ReportDocument`. A layout engine turns it into a `RenderPlan` (pages of positioned elements), and the on-screen preview, the PDF and the PowerPoint all draw that same plan.

## Deploy (static hosting)

Build command `npm run build`, output directory `dist`. Set the environment variable `NODE_VERSION` to a current LTS release if the host asks.

**Cloudflare Pages:** Workers & Pages → Create → Pages → connect the Git repository → framework preset "None" → build command and output directory as above.

**Netlify:** Add new site → import from Git → same build command; publish directory `dist`.

Both hosts read `dist/_headers`, which the build generates (CSP and other security headers). GitHub Pages cannot set headers: the CSP meta tag still applies, but you would also need `base: '/<repo-name>/'` in `vite.config.ts`.

### Verify the privacy claim

1. Open the deployed site, then DevTools → **Network**.
2. Load the sample data, walk through all four stages and download both file types.
3. Every request should be to your own site. The Console should show no "Refused to…" messages.
4. Check the headers: `curl -I https://your-site.example/` should include `content-security-policy`.

## Known limits

- PDFs use built-in fonts (Times, Helvetica, Courier), so characters outside Western European text may appear blank. The preflight check warns about this.
- Column types cannot be overridden by hand yet.
- Desktop browsers are the target. Very large Excel files are limited by browser memory.