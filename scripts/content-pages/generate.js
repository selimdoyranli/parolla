/**
 * Static content page generator (GEO / AI visibility layer).
 * Runs AFTER `nuxt generate`: converts content/site markdown into real HTML in dist/,
 * and emits llms.txt, llms-full.txt and sitemap.xml.
 * Self-validates and exits non-zero on any failure so a broken build never ships.
 * Spec: docs/superpowers/specs/2026-08-05-ai-visibility-design.md
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const matter = require('gray-matter')
const MarkdownIt = require('markdown-it')
const { BASE_URL, SAME_AS, GAME_INFO, APP_ROUTES, CONTENT_PAGES } = require('./site.config')
const { renderPage } = require('./template')

const md = new MarkdownIt({ html: false, linkify: true })
const ROOT = path.resolve(__dirname, '../..')
const LOCALES = ['tr', 'en']

const argIndex = process.argv.indexOf('--out-dir')
const OUT_DIR = path.resolve(ROOT, argIndex > -1 ? process.argv[argIndex + 1] : 'dist')

const SECTION_TITLES = {
  steps: { tr: 'Adım Adım', en: 'Step by Step' },
  faq: { tr: 'Sorular ve Cevaplar', en: 'Questions and Answers' }
}

const fail = message => {
  console.error(`❌ content-pages: ${message}`)
  process.exit(1)
}

const stripHtml = html =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

const gitLastMod = src => {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${src}"`, { cwd: ROOT, encoding: 'utf8' }).trim()

    if (out) return out
  } catch (e) {
    /* fall through to mtime */
  }

  return fs.statSync(path.join(ROOT, src)).mtime.toISOString()
}

const videoGameBlock = locale => ({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: GAME_INFO.name,
  url: BASE_URL,
  description: GAME_INFO.descriptions[locale],
  genre: ['Word game', 'Trivia'],
  gamePlatform: ['Web', 'iOS', 'Android'],
  applicationCategory: 'Game',
  operatingSystem: 'Web, iOS, Android',
  inLanguage: ['tr', 'en'],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  sameAs: SAME_AS,
  author: { '@type': 'Person', name: 'Selim Doyranlı', url: 'https://selimdoyranli.com' }
})

const organizationBlock = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: GAME_INFO.name,
  url: BASE_URL,
  logo: `${BASE_URL}/meta/logo.png`,
  sameAs: SAME_AS
})

const breadcrumbBlock = (locale, page, fm) => {
  const hub = CONTENT_PAGES.find(p => p.key === 'how-to-play')
  const items = [{ name: locale === 'tr' ? 'Ana Sayfa' : 'Home', url: BASE_URL + (locale === 'tr' ? '/' : '/en') }]

  if (page.jsonld === 'howto' && page.key !== 'how-to-play') {
    items.push({
      name: locale === 'tr' ? 'Nasıl Oynanır?' : 'How to Play',
      url: BASE_URL + hub[locale].url
    })
  }

  items.push({ name: fm.title, url: BASE_URL + page[locale].url })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  }
}

const buildJsonld = (locale, page, fm) => {
  const blocks = [breadcrumbBlock(locale, page, fm)]

  if (page.jsonld === 'hub') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: fm.title,
      description: fm.description,
      url: BASE_URL + page[locale].url,
      inLanguage: locale
    })
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: CONTENT_PAGES.filter(p => p.jsonld === 'howto').map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: BASE_URL + p[locale].url
      }))
    })
    blocks.push(videoGameBlock(locale))
  }

  if (page.jsonld === 'howto') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: fm.title,
      description: fm.description,
      inLanguage: locale,
      step: (fm.steps || []).map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text }))
    })
    blocks.push(videoGameBlock(locale))
  }

  if (page.jsonld === 'faq') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: (fm.faq || []).map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    })
  }

  if (page.jsonld === 'about') {
    blocks.push(organizationBlock())
    blocks.push(videoGameBlock(locale))
  }

  return blocks
}

const buildContentHtml = (locale, page, fm, markdownBody) => {
  let html = md.render(markdownBody)

  if (page.jsonld === 'howto' && Array.isArray(fm.steps) && fm.steps.length) {
    const items = fm.steps.map(step => `<li>${md.renderInline(step)}</li>`).join('\n')
    html += `\n<section><h2>${SECTION_TITLES.steps[locale]}</h2>\n<ol>\n${items}\n</ol></section>`
  }

  if (page.jsonld === 'faq' && Array.isArray(fm.faq) && fm.faq.length) {
    const items = fm.faq.map(item => `<h3>${md.renderInline(item.q)}</h3>\n<p>${md.renderInline(item.a)}</p>`).join('\n')
    html += `\n<section><h2>${SECTION_TITLES.faq[locale]}</h2>\n${items}</section>`
  }

  return html
}

const sitemapEntry = (urls, lastmod) => {
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="tr" href="${BASE_URL}${urls.tr}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${urls.en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${urls.tr}"/>`
  ].join('\n')

  return LOCALES.map(
    locale => `  <url>\n    <loc>${BASE_URL}${urls[locale]}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`
  ).join('\n')
}

const run = () => {
  if (!fs.existsSync(OUT_DIR)) fail(`output dir not found: ${OUT_DIR} — run \`nuxt generate\` first`)

  const buildDate = new Date().toISOString()
  const written = []
  const llmsIndex = { tr: [], en: [] }
  const llmsFull = []

  for (const page of CONTENT_PAGES) {
    const urls = { tr: page.tr.url, en: page.en.url }

    for (const locale of LOCALES) {
      const srcPath = path.join(ROOT, page[locale].src)

      if (!fs.existsSync(srcPath)) fail(`missing markdown source: ${page[locale].src}`)

      const { data: fm, content: body } = matter.read(srcPath)

      if (!fm.title || !fm.description) fail(`missing title/description frontmatter in ${page[locale].src}`)

      const contentHtml = buildContentHtml(locale, page, fm, body)
      const jsonldBlocks = buildJsonld(locale, page, fm)
      const updated = fm.updated instanceof Date ? fm.updated.toISOString().slice(0, 10) : String(fm.updated)
      const html = renderPage({ locale, urls, title: fm.title, description: fm.description, updated, contentHtml, jsonldBlocks })

      const outFile = path.join(OUT_DIR, page[locale].url, 'index.html')

      if (fs.existsSync(outFile)) fail(`collision: ${page[locale].url} already exists in dist (Vue route?)`)

      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, html)
      written.push({ page, locale, outFile, url: page[locale].url })

      llmsIndex[locale].push(`- [${fm.title}](${BASE_URL}${page[locale].url}): ${fm.description}`)
      llmsFull.push(`# ${fm.title} (${BASE_URL}${page[locale].url})\n\n${stripHtml(contentHtml)}`)
    }
  }

  // llms.txt — short overview + link index (llmstxt.org convention)
  const llmsTxt = [
    '# parolla',
    '',
    `> ${GAME_INFO.descriptions.tr}`,
    `> ${GAME_INFO.descriptions.en}`,
    '',
    `parolla: ${BASE_URL} (Türkçe) — ${BASE_URL}/en (English)`,
    '',
    '## Türkçe',
    '',
    ...llmsIndex.tr,
    '',
    '## English',
    '',
    ...llmsIndex.en,
    ''
  ].join('\n')

  fs.writeFileSync(path.join(OUT_DIR, 'llms.txt'), llmsTxt)
  fs.writeFileSync(path.join(OUT_DIR, 'llms-full.txt'), llmsFull.join('\n\n---\n\n') + '\n')

  // sitemap.xml — app routes (build date) + content pages (git lastmod)
  const entries = [
    ...APP_ROUTES.map(urls => sitemapEntry(urls, buildDate)),
    ...CONTENT_PAGES.map(page => sitemapEntry({ tr: page.tr.url, en: page.en.url }, gitLastMod(page.tr.src)))
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    ''
  ].join('\n')

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
