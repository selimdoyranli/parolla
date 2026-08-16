/**
 * Static content page generator (GEO / AI visibility layer).
 * Runs AFTER `nuxt generate`: converts content/site markdown into real HTML in dist/,
 * and emits llms.txt, llms-full.txt and sitemap.xml.
 * Self-validates and exits non-zero on any failure so a broken build never ships.
 * Rendering core lives in render.js (shared with dev-middleware.js).
 * Spec: docs/superpowers/specs/2026-08-05-ai-visibility-design.md
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { APP_ROUTES, CONTENT_PAGES } = require('./site.config')
const { ROOT, LOCALES, renderContentPage, buildLlmsOutputs, buildSitemap } = require('./render')

const argIndex = process.argv.indexOf('--out-dir')
const OUT_DIR = path.resolve(ROOT, argIndex > -1 ? process.argv[argIndex + 1] : 'dist')

const fail = message => {
  console.error(`❌ content-pages: ${message}`)
  process.exit(1)
}

const gitLastMod = src => {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${src}"`, { cwd: ROOT, encoding: 'utf8' }).trim()

    if (out) return out
  } catch (e) {
    /* fall through to mtime */
  }

  return fs.statSync(path.join(ROOT, src)).mtime.toISOString()
}

const run = () => {
  if (!fs.existsSync(OUT_DIR)) fail(`output dir not found: ${OUT_DIR} — run \`nuxt generate\` first`)

  const buildDate = new Date().toISOString()
  const written = []

  for (const page of CONTENT_PAGES) {
    for (const locale of LOCALES) {
      let rendered

      try {
        rendered = renderContentPage(page, locale)
      } catch (e) {
        return fail(e.message)
      }

      const outFile = path.join(OUT_DIR, rendered.url, 'index.html')

      if (fs.existsSync(outFile)) fail(`collision: ${rendered.url} already exists in dist (Vue route?)`)

      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, rendered.html)
      written.push({ ...rendered, outFile })
    }
  }

  const { llmsTxt, llmsFullTxt } = buildLlmsOutputs(written)

  fs.writeFileSync(path.join(OUT_DIR, 'llms.txt'), llmsTxt)
  fs.writeFileSync(path.join(OUT_DIR, 'llms-full.txt'), llmsFullTxt)

  // sitemap.xml — app routes (build date) + content pages (git lastmod of the TR source)
  const sitemap = buildSitemap({ buildDate, contentLastMod: page => gitLastMod(page.tr.src) })

  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap)

  // ---- Self-validation ----
  const expectedPages = CONTENT_PAGES.length * LOCALES.length

  if (written.length !== expectedPages) fail(`expected ${expectedPages} pages, wrote ${written.length}`)

  for (const { outFile, url } of written) {
    const html = fs.readFileSync(outFile, 'utf8')

    if (html.length < 2000) fail(`suspiciously small page: ${url}`)

    const jsonldMatches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]

    if (!jsonldMatches.length) fail(`no JSON-LD found in ${url}`)

    for (const match of jsonldMatches) {
      try {
        JSON.parse(match[1])
      } catch (e) {
        fail(`invalid JSON-LD in ${url}: ${e.message}`)
      }
    }

    if (!html.includes('hreflang="tr"') || !html.includes('hreflang="en"')) fail(`missing hreflang pair in ${url}`)
  }

  const locCount = (fs.readFileSync(path.join(OUT_DIR, 'sitemap.xml'), 'utf8').match(/<loc>/g) || []).length
  const expectedLocs = APP_ROUTES.length * 2 + expectedPages

  if (locCount !== expectedLocs) fail(`sitemap has ${locCount} <loc> entries, expected ${expectedLocs}`)

  for (const aux of ['llms.txt', 'llms-full.txt']) {
    if (!fs.statSync(path.join(OUT_DIR, aux)).size) fail(`${aux} is empty`)
  }

  console.log(`✅ content-pages: ${written.length} pages + llms.txt + llms-full.txt + sitemap.xml (${locCount} urls) → ${OUT_DIR}`)
}

run()
