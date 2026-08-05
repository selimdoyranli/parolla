# Static Content Pages (GEO / AI Visibility Layer)

Build-time generator that makes parolla citable by AI crawlers (GPTBot, ClaudeBot,
PerplexityBot, …) which do **not** execute JavaScript and therefore see nothing of the
`ssr: false` SPA shell.

Spec: `docs/superpowers/specs/2026-08-05-ai-visibility-design.md`

## What it does

`npm run content:generate` (wired into `npm run generate`, runs **after** `nuxt generate`):

1. Converts `content/site/<tr|en>/*.md` into pure static HTML at `dist/<url>/index.html`
   (10 pages × 2 locales — how-to-play hub, 7 mode guides, FAQ, about). Each page carries
   canonical + reciprocal hreflang, og/twitter meta, and page-specific JSON-LD
   (`HowTo`, `FAQPage`, `Organization`, `VideoGame`, `BreadcrumbList`).
2. Emits `dist/llms.txt` (overview + link index) and `dist/llms-full.txt` (full plain text).
3. Emits `dist/sitemap.xml` — app routes (build date as lastmod) + content pages
   (git commit date of the markdown source as lastmod), with hreflang alternates.
   The old hand-maintained `static/sitemap.xml` was removed in favor of this.
4. Self-validates (missing files, invalid JSON-LD, missing hreflang pairs, URL collisions
   with Vue routes, sitemap URL count) and **fails the build** on any problem.

## Files

- `site.config.js` — single source of truth: base URL, `sameAs` links, game info,
  app route manifest, content page registry. Also consumed by `nuxt-config/head.js`
  for the SPA shell JSON-LD.
- `template.js` — brand-styled HTML template (light/dark via `prefers-color-scheme`).
- `generate.js` — the generator + self-validation. `--out-dir <dir>` to target another dir.

## Adding a page

1. Add `content/site/tr/<name>.md` and `content/site/en/<name>.md` with frontmatter:
   `title`, `description`, `updated` (+ `steps:` list for HowTo pages, `faq:` q/a list for FAQ).
2. Register the pair in `CONTENT_PAGES` in `site.config.js` (pick `jsonld` kind).
3. Run `npm run content:generate` after a `nuxt generate` (or against a scratch dir).

New URLs must not collide with Vue routes — the generator throws if they do.

## Post-deploy smoke checks

```bash
# AI crawlers must receive full text (not an empty SPA shell):
curl -s -A "GPTBot" https://www.parolla.app/nasil-oynanir/ | grep -c "Günlük Mod"
curl -s -A "GPTBot" https://www.parolla.app/en/how-to-play/ | grep -c "Daily Mode"
curl -s https://www.parolla.app/llms.txt | head -5
curl -s https://www.parolla.app/sitemap.xml | grep -c "<loc>"
curl -s https://www.parolla.app/robots.txt | grep GPTBot
```

- Validate structured data with Google's Rich Results Test for `/`, `/sss` and one mode page:
  https://search.google.com/test/rich-results
- Resubmit `sitemap.xml` in Google Search Console after the first deploy.
- Review the Semrush AI Visibility score for the tracked prompt set at 4 and 8 weeks —
  the score moves slowly and also depends on off-site citations (see the spec's
  off-site playbook).
