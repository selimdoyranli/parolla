/**
 * Shared rendering core for the static content pages (GEO / AI visibility layer).
 * Pure builders — no filesystem writes. Consumed by:
 *  - generate.js (build-time emit into dist/)
 *  - dev-middleware.js (on-demand rendering for `nuxt dev`)
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const MarkdownIt = require('markdown-it')
const { BASE_URL, SAME_AS, GAME_INFO, APP_ROUTES, CONTENT_PAGES } = require('./site.config')
const { renderPage } = require('./template')

const md = new MarkdownIt({ html: false, linkify: true })
const ROOT = path.resolve(__dirname, '../..')
const LOCALES = ['tr', 'en']

const SECTION_TITLES = {
  steps: { tr: 'Adım Adım', en: 'Step by Step' },
  faq: { tr: 'Sorular ve Cevaplar', en: 'Questions and Answers' }
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

/** Renders one content page. Throws on missing source or frontmatter. */
const renderContentPage = (page, locale) => {
  const srcPath = path.join(ROOT, page[locale].src)

  if (!fs.existsSync(srcPath)) throw new Error(`missing markdown source: ${page[locale].src}`)

  const { data: fm, content: body } = matter.read(srcPath)

  if (!fm.title || !fm.description) throw new Error(`missing title/description frontmatter in ${page[locale].src}`)

  const contentHtml = buildContentHtml(locale, page, fm, body)
  const jsonldBlocks = buildJsonld(locale, page, fm)
  const updated = fm.updated instanceof Date ? fm.updated.toISOString().slice(0, 10) : String(fm.updated)
  const urls = { tr: page.tr.url, en: page.en.url }
  const html = renderPage({ locale, urls, title: fm.title, description: fm.description, updated, contentHtml, jsonldBlocks })

  return {
    url: page[locale].url,
    locale,
    html,
    title: fm.title,
    description: fm.description,
    text: stripHtml(contentHtml)
  }
}

/** @param {ReturnType<typeof renderContentPage>[]} rendered — all pages, both locales */
const buildLlmsOutputs = rendered => {
  const index = { tr: [], en: [] }
  const full = []

  for (const item of rendered) {
    index[item.locale].push(`- [${item.title}](${BASE_URL}${item.url}): ${item.description}`)
    full.push(`# ${item.title} (${BASE_URL}${item.url})\n\n${item.text}`)
  }

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
    ...index.tr,
    '',
    '## English',
    '',
    ...index.en,
    ''
  ].join('\n')

  return { llmsTxt, llmsFullTxt: full.join('\n\n---\n\n') + '\n' }
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

/**
 * @param {object} options
 * @param {string} options.buildDate  ISO date used for app routes
 * @param {(page: object) => string} options.contentLastMod  lastmod resolver per content page
 */
const buildSitemap = ({ buildDate, contentLastMod }) => {
  const entries = [
    ...APP_ROUTES.map(urls => sitemapEntry(urls, buildDate)),
    ...CONTENT_PAGES.map(page => sitemapEntry({ tr: page.tr.url, en: page.en.url }, contentLastMod(page)))
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    ''
  ].join('\n')
}

module.exports = { ROOT, LOCALES, renderContentPage, buildLlmsOutputs, buildSitemap }
