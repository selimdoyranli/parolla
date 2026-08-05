# Design: AI Visibility (GEO) improvement for parolla.app

**Date:** 2026-08-05
**Repos affected:** `parolla` (web frontend only — no backend, no mobile shell changes)
**Status:** Approved (Approach B — SPA preserved + static content layer)

## Problem

Semrush's AI Visibility score for parolla.app is low: the brand rarely appears in
answers from AI platforms (ChatGPT, Perplexity, Gemini, Google AI Overviews).

Root causes found in the codebase:

1. **The site is invisible to AI crawlers.** Nuxt 2 runs with `ssr: false` +
   `target: 'static'`, so every generated route is an empty SPA shell. GPTBot,
   ClaudeBot, PerplexityBot, CCBot and most AI crawlers do not execute JavaScript —
   they see no content at all.
2. **There is nothing citable even if they could render it.** The app has no textual
   content pages (no how-to-play, FAQ, or about pages — only legal documents). AI
   answers cite pages that answer questions in prose; parolla has none.
3. **No machine-readable signals.** No JSON-LD structured data anywhere, no
   `llms.txt`, a minimal `robots.txt` with no AI-crawler directives, and a manually
   maintained `sitemap.xml` last touched 2024-11.

## Goals & success criteria

- AI crawlers fetching parolla URLs receive full HTML text content (verifiable with
  `curl -A "GPTBot" <url>`).
- Structured data validates in Google's Rich Results Test.
- Semrush AI Visibility score and AI-referral traffic tracked over 4–8 weeks after
  deploy. **Expectation management:** the score moves slowly and depends heavily on
  off-site citations; on-site work is the prerequisite, not the whole battle.

### Target prompt set (to track in Semrush AI Visibility)

- TR: "kelime oyunu öner", "en iyi Türkçe kelime oyunları", "günlük kelime oyunu",
  "Türkçe wordle benzeri oyun", "Kelime Oyunu (A'dan Z'ye) benzeri online oyun",
  "arkadaşlarla oynanacak online quiz", "müzik tahmin oyunu",
  "kendi quizini oluşturma oyunu"
- EN: "turkish word game", "wordle in turkish", "daily word puzzle game",
  "alphabet quiz game", "create your own quiz game"

## Decision: Approach B — keep the SPA, add a static content layer

Considered and rejected:

- **A — Full SSG (`ssr: true` + generate):** strongest long-term result, but the app
  was written under `ssr: false` assumptions (auth-next, vuex-persist, WebSocket,
  window access). High regression risk on a production app embedded in two mobile
  WebView shells; large audit + migration effort.
- **C — Minimal layer (JSON-LD + llms.txt + robots/sitemap only):** cheap but leaves
  nothing citable; won't move the score meaningfully.

**B** delivers most of A's value at a fraction of the risk: the game app stays
untouched (`ssr: false` remains); crawlable content is produced as pure static HTML
at build time.

## Architecture

### 1. Content pages (pure static HTML, not Vue routes)

New markdown content under `content/site/<tr|en>/*.md` (same convention as
`content/legal/`), with frontmatter (`title`, `description`, `slug`, optional `faq`
entries, mode metadata).

| Page | TR URL | EN URL |
|---|---|---|
| How to play (hub) | `/nasil-oynanir` | `/en/how-to-play` |
| Daily mode | `/nasil-oynanir/gunluk` | `/en/how-to-play/daily` |
| Unlimited mode | `/nasil-oynanir/limitsiz` | `/en/how-to-play/unlimited` |
| Creator mode | `/nasil-oynanir/yaratici` | `/en/how-to-play/creator` |
| Tour mode | `/nasil-oynanir/tur` | `/en/how-to-play/tour` |
| Wordblock | `/nasil-oynanir/kelimeblok` | `/en/how-to-play/wordblock` |
| Music mode | `/nasil-oynanir/muzik` | `/en/how-to-play/music` |
| Knowledge Kingdom | `/nasil-oynanir/bilgi-kralligi` | `/en/how-to-play/knowledge-kingdom` |
| FAQ | `/sss` | `/en/faq` |
| About | `/hakkinda` | `/en/about` |

Mode sub-slugs reuse the app's existing localized route names, but nested under the
new `nasil-oynanir` / `how-to-play` prefix, so no path collides with a Vue route.

Content style: each page answers the target prompts directly — a crisp definition
sentence up front, bullet lists, FAQ blocks. Written to be quotable by an LLM
composing an answer to e.g. "Türkçe kelime oyunu öner". Claude drafts the copy; the
user reviews it during implementation.

**Verified serving facts (checked 2026-08-05):** none of the new slugs appear in the
i18n `pages` mapping in `nuxt.config.js`; neither `.cloudflare/scripts/redirects.js`
(`_redirects`) nor `vercel.json` contains an SPA catch-all rewrite, so static files
at these paths are served directly on both hosts — nothing shadows them.

### 2. Generator script — `scripts/content-pages/`

`scripts/content-pages/generate.js` (Node, no browser/puppeteer, fully
deterministic):

- Parses the markdown sources (`markdown-it` + frontmatter).
- Wraps each page in a single HTML template styled to match parolla's brand (dark
  theme, existing brand colors, logo header linking back to the app, minimal footer).
- Emits `dist/<slug>/index.html` for every page.
- Per page emits: `<title>`, meta description, canonical, reciprocal TR↔EN
  `hreflang` alternate links, og/twitter meta, and page-specific JSON-LD.
- Also emits from the same sources:
  - **`dist/llms.txt`** — short description of parolla + links to all content pages
    (TR and EN).
  - **`dist/llms-full.txt`** — full plain-text content of all pages.
  - **`dist/sitemap.xml`** — replaces the stale manual `static/sitemap.xml`
    (which gets deleted); includes app routes (from a route manifest kept in the
    script) + all content pages. `lastmod`: for content pages, the last git commit
    date of the source markdown (fallback: file mtime); for app routes, the build
    date.

**Build wiring:** the `generate` npm script becomes
`nuxt generate` → `node scripts/content-pages/generate.js` → existing Cloudflare
redirects step. Works identically on Cloudflare and Vercel (pure static output).
Local preview: run the script with `--out-dir dist` after a generate, or against a
scratch dir.

**Build-time self-validation (script exits non-zero on failure):**

- every expected output file exists and is non-empty
- every JSON-LD block passes `JSON.parse`
- every hreflang pair is reciprocal
- no emitted path collides with a `nuxt generate` output path

### 3. Structured data (JSON-LD)

- **SPA shell** (via `nuxt-config/head.js` `script` entries with
  `type: 'application/ld+json'` + `innerHTML` and the required sanitizer opt-out —
  baked statically into all generated shell HTML): `WebSite`, `Organization`, and
  `VideoGame` (name, description, genre, platforms, `inLanguage: ['tr','en']`,
  `sameAs` → App Store, Play Store, social profiles; the exact `sameAs` URL list is
  collected from the user during implementation planning). Shell JSON-LD is TR-flavored;
  EN coverage comes from the EN content pages carrying their own JSON-LD.
- **Content pages:** `FAQPage` on FAQ, `HowTo` + `VideoGame` on mode pages,
  `Organization` on About.

### 4. Crawler infrastructure

- **`static/robots.txt`** — explicit `Allow: /` groups for: GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot,
  Perplexity-User, Google-Extended, CCBot, Applebot-Extended, meta-externalagent;
  keep the wildcard group and the sitemap line.
- **Meta improvements:** enrich `system/head/main/tr.js` and `en.js` titles and
  descriptions — answer-shaped copy naming the game modes (daily A–Z quiz, Turkish
  wordle-style Wordblock, music guessing, creator quizzes) instead of the current
  thin two-liner.

### 5. App integration (zero-risk boundary)

- **`MenuDialog`**: new link group (same pattern as the existing "Legal" group) with
  locale-aware plain `<a href>` links to How to Play, FAQ, About. Full page
  navigation; the static page header links back into the app.
- **Mobile WebView shells: no changes.** The bridge (`useNativeBridge`,
  `postToNative`, message contract) is untouched. Static pages open as normal
  navigations inside the WebViews.
- No changes to stores, auth, WS, or any game code.

## Verification

No test runner exists in this repo. Verification is:

1. **Build-time:** the generator's self-validation (above) fails the build on any
   missing/invalid output.
2. **Post-deploy smoke (documented in the script's README):**
   - `curl -A "GPTBot" https://www.parolla.app/nasil-oynanir/` returns full text
     content (repeat for a sample of pages + llms.txt + sitemap.xml)
   - Google Rich Results Test passes for home (shell JSON-LD), FAQ, and one mode page
3. **Ongoing:** Semrush AI Visibility score on the target prompt set + AI-referral
   traffic, reviewed at 4 and 8 weeks.

## Out of scope (explicitly)

- `ssr: true` / SSG migration, Nuxt 3 migration
- Backend (Strapi) changes, mobile shell changes
- Blog/guide article production beyond the pages listed (possible follow-up:
  2 guide articles targeting "Türkçe kelime oyunları" listicle-style prompts)

## Off-site playbook (non-code backlog — manual, not part of the implementation plan)

Priority-ordered; AI answers cite third-party sources more than brand sites:

1. **Listicle outreach:** get parolla into TR "Wordle alternatifleri" / "en iyi
   kelime oyunları" articles — the sources AI Overviews and ChatGPT cite most.
   Highest impact per effort.
2. **Ekşi Sözlük & forums:** keep the parolla entry current; organic mentions on
   Reddit (r/Turkey, r/oyun) and DonanımHaber.
3. **Entity consistency:** create a Wikidata item (lower bar than Wikipedia); align
   name/description across App Store, Play Store, socials; JSON-LD `sameAs` links to
   all of these (intersects with §3).
4. **Press:** pitch TR tech media (Webrazzi etc.) — the İhsan Varol "Kelime Oyunu"
   format connection is a good angle.
5. **Video:** YouTube/TikTok creator outreach — models also source video transcripts
   and descriptions.
