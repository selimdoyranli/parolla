# AI Visibility (GEO) Static Content Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make parolla.app visible and citable to non-JS AI crawlers by adding a build-time static content layer (how-to-play/FAQ/about pages ×2 locales), JSON-LD, llms.txt, AI-friendly robots.txt, and a generated sitemap — without touching the game SPA.

**Architecture:** The Nuxt 2 SPA stays `ssr: false`. A Node script (`scripts/content-pages/generate.js`, CommonJS) runs after `nuxt generate`, converts markdown sources (`content/site/<locale>/*.md`) into pure static HTML pages written into `dist/`, and also emits `llms.txt`, `llms-full.txt`, and `sitemap.xml`. Shell JSON-LD is injected via `nuxt-config/head.js`. MenuDialog gets a locale-aware link group.

**Tech Stack:** Node ≥22 (CJS script), `markdown-it`, `gray-matter` (devDeps), Nuxt 2 head config (vue-meta), Pug/Vant for the menu edit.

**Spec:** `docs/superpowers/specs/2026-08-05-ai-visibility-design.md`

## Global Constraints

- `ssr: false` and `target: 'static'` MUST NOT change.
- Zero changes to `useNativeBridge`, `postToNative`, or the WebView message contract (`sharer`, `google-auth-request`, `end-game`).
- Code style: no semicolons, single quotes, max line 150, blank line before `return`/`if`.
- Base URL everywhere: `https://www.parolla.app`.
- New URLs (must match spec exactly): TR `/nasil-oynanir`, `/nasil-oynanir/{gunluk,limitsiz,yaratici,tur,kelimeblok,muzik,bilgi-kralligi}`, `/sss`, `/hakkinda`; EN `/en/how-to-play`, `/en/how-to-play/{daily,unlimited,creator,tour,wordblock,music,knowledge-kingdom}`, `/en/faq`, `/en/about`.
- `sameAs` URL set: `https://apps.apple.com/app/parolla-kelime-oyunu/id6448075358`, `https://play.google.com/store/apps/details?id=app.parolla`, `https://x.com/parollaapp`, `https://www.linkedin.com/showcase/parolla-kelime-oyunu`, `https://github.com/selimdoyranli/parolla`, `https://selimdoyranli.com`.
- Brand palette for static pages (from `assets/style/css/variables/color.css`): accent `#ff7878`, light bg `#f2f2f2`/surface `#fff`/text `#111`, dark bg `#161616`/surface `#272727`/text `#ccc`; font `Rubik`.
- No test runner exists; each task verifies via running the generator + `node -e` assertions, and the final task runs full `yarn generate`.

---

### Task 1: Dependencies + site config (single source of truth)

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `scripts/content-pages/site.config.js` (CommonJS so `nuxt-config/head.js` can `require` it too)

**Interfaces:**
- Produces: `BASE_URL` (string), `SAME_AS` (string[]), `GAME_INFO` ({ name, descriptions: {tr,en} }), `APP_ROUTES` ([{tr,en}]), `CONTENT_PAGES` ([{ key, jsonld: 'hub'|'howto'|'faq'|'about', tr: {src,url}, en: {src,url} }])

- [ ] **Step 1: Add devDependencies** — `yarn add -D markdown-it gray-matter`
- [ ] **Step 2: Add npm script** — `"content:generate": "node scripts/content-pages/generate.js"`; change `"generate"` to `"nuxt generate && npm run content:generate && npm run cloudflare:prepare-redirects"`
- [ ] **Step 3: Write `site.config.js`** — exports above; `CONTENT_PAGES` maps all 10 page keys (`how-to-play`, `daily`, `unlimited`, `creator`, `tour`, `wordblock`, `music`, `knowledge-kingdom`, `faq`, `about`) to `content/site/tr|en/*.md` sources and the URL set from Global Constraints; `APP_ROUTES` lists all public non-parameterized routes from the i18n `pages` mapping (`/`, `/gunluk`, `/gunluk/liderlik`, `/limitsiz`, `/yaratici`, `/quizler`, `/quiz-olustur`, `/tur`, `/tur/liderlik`, `/ciz`, `/kelimeblok`, `/muzik`, `/muzik/sarki-tahmin-et`, `/bilgi-kralligi`, 4 legal pages + EN counterparts)
- [ ] **Step 4: Verify** — `node -e "const c=require('./scripts/content-pages/site.config');console.assert(c.CONTENT_PAGES.length===10);console.assert(c.SAME_AS.length===6)"`
- [ ] **Step 5: Commit** — `feat(geo): add content-pages site config and deps`

### Task 2: TR markdown content (10 pages)

**Files:**
- Create: `content/site/tr/nasil-oynanir.md`, `nasil-oynanir-gunluk.md`, `nasil-oynanir-limitsiz.md`, `nasil-oynanir-yaratici.md`, `nasil-oynanir-tur.md`, `nasil-oynanir-kelimeblok.md`, `nasil-oynanir-muzik.md`, `nasil-oynanir-bilgi-kralligi.md`, `sss.md`, `hakkinda.md`

**Frontmatter schema (all pages):** `title`, `description`, `updated` (YYYY-MM-DD); mode pages add `steps:` (list of strings → HowTo JSON-LD); FAQ page adds `faq:` (list of `{q, a}` → FAQPage JSON-LD; also rendered as HTML).

**Content rules (per spec):** first paragraph is a crisp, quotable definition sentence answering the target prompt (e.g. "parolla, her gün yenilenen A'dan Z'ye kelime oyunu…"); then bullet-friendly H2 sections; mention "Türkçe kelime oyunu", "günlük kelime oyunu", "Türkçe Wordle benzeri" naturally where truthful. Hub page lists all 7 modes with 1-paragraph summaries + links to mode pages. About page covers: what parolla is, launch/history, modes, platforms (web + iOS + Android), publisher (selimdoyranli), and links (stores, X, GitHub).

- [ ] **Step 1: Write the 10 TR markdown files** following the schema and rules above
- [ ] **Step 2: Verify frontmatter parses** — `node -e "const m=require('gray-matter');const fs=require('fs');fs.readdirSync('content/site/tr').forEach(f=>{const d=m.read('content/site/tr/'+f).data;console.assert(d.title&&d.description,f)})"`
- [ ] **Step 3: Commit** — `feat(geo): add TR static content pages (how-to-play, faq, about)`

### Task 3: EN markdown content (10 pages)

**Files:**
- Create: `content/site/en/how-to-play.md`, `how-to-play-daily.md`, `how-to-play-unlimited.md`, `how-to-play-creator.md`, `how-to-play-tour.md`, `how-to-play-wordblock.md`, `how-to-play-music.md`, `how-to-play-knowledge-kingdom.md`, `faq.md`, `about.md`

Same schema/rules as Task 2, English copy targeting the EN prompt set ("turkish word game", "wordle in turkish", …). Not literal translations — natural English answering the same questions.

- [ ] **Step 1: Write the 10 EN markdown files**
- [ ] **Step 2: Verify frontmatter parses** (same `node -e` check, dir `content/site/en`)
- [ ] **Step 3: Commit** — `feat(geo): add EN static content pages`

### Task 4: Generator script (pages + llms.txt + sitemap) and build wiring

**Files:**
- Create: `scripts/content-pages/template.js`, `scripts/content-pages/generate.js`
- Delete: `static/sitemap.xml` (replaced by generated one)

**Interfaces:**
- Consumes: `site.config.js` exports (Task 1), markdown sources (Tasks 2–3)
- Produces: `dist/<url>/index.html` per page, `dist/llms.txt`, `dist/llms-full.txt`, `dist/sitemap.xml`; CLI `--out-dir <dir>` (default `dist`)

**`template.js`:** exports `renderPage({ locale, title, description, url, alternate: {locale,url}, updated, contentHtml, jsonldBlocks })` returning a full HTML5 document string: `<html lang>`, meta description, canonical, reciprocal hreflang (`tr`, `en`, `x-default`→TR), og/twitter tags (og:image `/meta/og-main-<locale>.jpg`), Rubik font link, inline CSS with the brand palette (light + `prefers-color-scheme: dark`), header (logo `/meta/logo.png` → `/` or `/en`, nav to hub/FAQ/About, TR↔EN switcher), `<main>` with `contentHtml`, footer (app link "parolla'yı oyna" / "Play parolla", store links, X, GitHub), and one `<script type="application/ld+json">` per block.

**`generate.js` flow:**
1. Parse CLI `--out-dir` (default `dist`); fail if the dir doesn't exist (must run after `nuxt generate`)
2. For each `CONTENT_PAGES` entry × locale: `gray-matter` read → `markdown-it` render (`html: false, linkify: true`) → build JSON-LD by `jsonld` kind: `hub` → `WebPage` + `ItemList` of the 7 mode page URLs; `howto` → `HowTo` (name=title, `step` from `steps`) + shared `VideoGame`; `faq` → `FAQPage` from `faq` list (also append rendered FAQ HTML `<section>` with `<h2>` per question); `about` → `Organization` (+ `VideoGame`); every page also gets `BreadcrumbList`. Shared `VideoGame` node: name/description from `GAME_INFO`, `url` BASE_URL, `genre: ['Word game', 'Trivia']`, `gamePlatform: ['Web', 'iOS', 'Android']`, `inLanguage: ['tr', 'en']`, `offers` free, `sameAs: SAME_AS`
3. Collision guard: if `dist/<url>/index.html` already exists (emitted by `nuxt generate`), **throw** — a Vue route collides
4. Write page HTML; collect plain text (strip tags) for llms outputs
5. Write `llms.txt` (short TR+EN intro of parolla + markdown link list of all content pages with descriptions) and `llms-full.txt` (full plain-text of every page, TR then EN)
6. Write `sitemap.xml`: all `APP_ROUTES` (lastmod = build date) + all content pages (lastmod = `git log -1 --format=%cI -- <src>`, fallback file mtime), with `xhtml:link` hreflang alternates
7. Self-validation (exit 1 on failure): every expected file exists & non-empty; every JSON-LD block round-trips `JSON.parse`; every TR page has exactly one EN alternate and vice versa; sitemap URL count === APP_ROUTES×2 + 20

- [ ] **Step 1: Write `template.js`**
- [ ] **Step 2: Write `generate.js`** with the flow above
- [ ] **Step 3: Run against a scratch dir** — `mkdir -p /tmp-scratch/dist && node scripts/content-pages/generate.js --out-dir <scratch>` → expect "✅" summary listing 20 pages + 3 aux files
- [ ] **Step 4: Assert output** — grep a TR page for the definition sentence, `application/ld+json`, `hreflang="en"`; validate `sitemap.xml` well-formed (`node -e` with a regex count of `<loc>`)
- [ ] **Step 5: Delete `static/sitemap.xml`**
- [ ] **Step 6: Commit** — `feat(geo): add static content page generator (html, llms.txt, sitemap)`

### Task 5: robots.txt AI crawler rules

**Files:**
- Modify: `static/robots.txt`

- [ ] **Step 1: Rewrite robots.txt** — keep `User-agent: *` + `Allow: /`; add explicit `Allow: /` groups for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, CCBot, Applebot-Extended, meta-externalagent; keep `Sitemap: https://www.parolla.app/sitemap.xml`
- [ ] **Step 2: Commit** — `feat(geo): allow AI crawlers explicitly in robots.txt`

### Task 6: Shell JSON-LD + enriched meta

**Files:**
- Modify: `nuxt-config/head.js` (add `script` entries + sanitizer opt-out), `system/head/main/tr.js`, `system/head/main/en.js`

- [ ] **Step 1: Add JSON-LD to head.js** — `require` `site.config.js`; add to `script`: `{ hid: 'ld-website', type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'parolla', url: BASE_URL, inLanguage: ['tr', 'en'] }) }`, an `Organization` block (name, url, logo `/meta/logo.png`, `sameAs: SAME_AS`), and a `VideoGame` block (from `GAME_INFO`, TR description); add `__dangerouslyDisableSanitizersByTagID: { 'ld-website': ['innerHTML'], 'ld-organization': ['innerHTML'], 'ld-videogame': ['innerHTML'] }`
- [ ] **Step 2: Enrich meta copy** — `tr.js`: title `parolla - Kelime Oyunu | Günlük Türkçe Kelime ve Bilgi Oyunları`; description naming the modes (günlük A'dan Z'ye kelime oyunu, Türkçe Wordle benzeri KelimeBlok, müzik tahmin, quiz oluşturma, turnuva); keywords extended (türkçe wordle, a'dan z'ye kelime oyunu, passaparola benzeri, online quiz). `en.js`: equivalent English title/description/keywords (turkish word game, wordle in turkish, alphabet quiz)
- [ ] **Step 3: Verify head renders into the SPA shell** — `yarn build` is not enough; quick check via `npx nuxt generate` is deferred to Task 8. Static check here: `node -e "const h=require('./nuxt-config/head');const s=h.script.filter(x=>x.type==='application/ld+json');s.forEach(x=>JSON.parse(x.innerHTML));console.assert(s.length===3)"`. **Contingency (verify in Task 8):** if generated `dist/index.html` lacks the ld+json blocks (vue-meta SPA quirk), move the three blocks into a custom `app.html` template instead
- [ ] **Step 4: Commit** — `feat(geo): add WebSite/Organization/VideoGame JSON-LD and enrich meta`

### Task 7: MenuDialog link group + locales

**Files:**
- Modify: `components/Dialog/MenuDialog/MenuDialog.component.vue`, `locales/tr.js`, `locales/en.js`

- [ ] **Step 1: Add locale keys** under `dialog.menu`: tr — `discover: 'Keşfet'`, `howToPlay: 'Nasıl Oynanır?'`, `faq: 'SSS'`, `about: 'Hakkında'`; en — `discover: 'Discover'`, `howToPlay: 'How to Play'`, `faq: 'FAQ'`, `about: 'About'`
- [ ] **Step 2: Add menu group** in the Pug template before the Legal group (same `span.menu-dialog__subTitle` + `CellGroup.menu-dialog-nav` pattern), 3 `Cell` items (icons: `question-o`, `chat-o`, `info-o`) calling `handleClickStaticPage('how-to-play'|'faq'|'about')`
- [ ] **Step 3: Add handler** in setup (locale from existing `useContext()`):

```js
const staticPagePaths = {
  'how-to-play': { tr: '/nasil-oynanir', en: '/en/how-to-play' },
  faq: { tr: '/sss', en: '/en/faq' },
  about: { tr: '/hakkinda', en: '/en/about' }
}

const handleClickStaticPage = key => {
  window.location.href = staticPagePaths[key][i18n.locale] || staticPagePaths[key].tr
}
```

- [ ] **Step 4: Lint** — `yarn lint:eslint` passes for the touched files
- [ ] **Step 5: Commit** — `feat(geo): link static content pages from menu`

### Task 8: End-to-end verification + docs

**Files:**
- Create: `scripts/content-pages/README.md`

- [ ] **Step 1: Full build** — `yarn generate`; expect nuxt generate → content:generate "✅" → redirects "✅"
- [ ] **Step 2: Verify dist** — `dist/nasil-oynanir/index.html`, `dist/en/how-to-play/index.html`, `dist/sss/index.html`, `dist/llms.txt`, `dist/sitemap.xml` exist with expected content; `dist/index.html` contains 3 `application/ld+json` blocks (else apply Task 6 contingency and re-run); no app shell was overwritten (spot-check `dist/gunluk/index.html` still the SPA shell)
- [ ] **Step 3: Write README.md** — how the generator works, how to add a page, post-deploy smoke checks: `curl -A "GPTBot" https://www.parolla.app/nasil-oynanir/` (expect full text), same for `/en/how-to-play/`, `/llms.txt`, `/sitemap.xml`; Google Rich Results Test for `/`, `/sss`, one mode page; Semrush AI Visibility review at 4 and 8 weeks
- [ ] **Step 4: Commit** — `docs(geo): add content pages generator readme`
