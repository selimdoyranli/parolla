/**
 * HTML template for the static content pages (GEO / AI visibility layer).
 * Pure static markup — no JS, brand-styled, light/dark via prefers-color-scheme.
 * Palette mirrors assets/style/css/variables/color.css
 */

const { BASE_URL } = require('./site.config')

const LABELS = {
  tr: {
    langName: 'Türkçe',
    switchTo: 'English',
    home: '/',
    nav: [
      { url: '/nasil-oynanir', text: 'Nasıl Oynanır?' },
      { url: '/sss', text: 'SSS' },
      { url: '/hakkinda', text: 'Hakkında' }
    ],
    play: "parolla'yı oyna",
    footerNote: 'parolla — Türkçe kelime ve bilgi oyunu platformu',
    updated: 'Son güncelleme'
  },
  en: {
    langName: 'English',
    switchTo: 'Türkçe',
    home: '/en',
    nav: [
      { url: '/en/how-to-play', text: 'How to Play' },
      { url: '/en/faq', text: 'FAQ' },
      { url: '/en/about', text: 'About' }
    ],
    play: 'Play parolla',
    footerNote: 'parolla — Turkish word and trivia game platform',
    updated: 'Last updated'
  }
}

const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CSS = `
  :root {
    --bg: #f2f2f2; --surface: #fff; --border: #ededed;
    --text: #111; --text-soft: #444; --muted: #888;
    --accent: #ff7878;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #161616; --surface: #272727; --border: #343434;
      --text: #ccc; --text-soft: #aaa; --muted: #888;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.65;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  header {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 0.75rem 1rem;
  }
  .header-inner {
    max-width: 760px; margin: 0 auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--text); font-size: 1.1rem; }
  .brand img { width: 28px; height: 28px; border-radius: 6px; }
  nav { display: flex; gap: 0.9rem; flex-wrap: wrap; margin-left: auto; font-size: 0.95rem; }
  nav a { color: var(--text-soft); }
  nav a.lang { color: var(--accent); font-weight: 500; }
  main { max-width: 760px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
  main h1 { font-size: 1.7rem; line-height: 1.3; margin: 0.5rem 0 1rem; }
  main h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; }
  main h3 { font-size: 1.05rem; margin: 1.5rem 0 0.5rem; }
  main ul, main ol { padding-left: 1.4rem; }
  main li { margin: 0.3rem 0; }
  .updated { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
  .cta {
    display: inline-block; background: var(--accent); color: #fff; font-weight: 600;
    padding: 0.6rem 1.4rem; border-radius: 999px; margin-top: 1rem;
  }
  .cta:hover { text-decoration: none; opacity: 0.9; }
  footer {
    border-top: 1px solid var(--border); background: var(--surface);
    padding: 1.5rem 1rem 2rem; font-size: 0.9rem; color: var(--text-soft);
  }
  .footer-inner { max-width: 760px; margin: 0 auto; }
  .footer-links { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem; }
`

/**
 * @param {object} page
 * @param {'tr'|'en'} page.locale
 * @param {{tr: string, en: string}} page.urls  path pair, e.g. { tr: '/sss', en: '/en/faq' }
 * @param {string} page.title
 * @param {string} page.description
 * @param {string} page.updated  YYYY-MM-DD
 * @param {string} page.contentHtml
 * @param {object[]} page.jsonldBlocks
 */
const renderPage = ({ locale, urls, title, description, updated, contentHtml, jsonldBlocks }) => {
  const t = LABELS[locale]
  const other = locale === 'tr' ? 'en' : 'tr'
  const canonical = BASE_URL + urls[locale]
  const jsonldScripts = jsonldBlocks.map(block => `<script type="application/ld+json">${JSON.stringify(block)}</script>`).join('\n  ')
  const navLinks = t.nav.map(item => `<a href="${item.url}">${escapeHtml(item.text)}</a>`).join('\n      ')

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | parolla</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="tr" href="${BASE_URL}${urls.tr}">
  <link rel="alternate" hreflang="en" href="${BASE_URL}${urls.en}">
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${urls.tr}">
  <link rel="icon" type="image/x-icon" href="/meta/icon/favicon.ico">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="parolla">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE_URL}/meta/og-main-${locale}.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
  ${jsonldScripts}
</head>
<body>
  <header>
    <div class="header-inner">
      <a class="brand" href="${t.home}"><img src="/meta/logo.png" alt="parolla logo" width="28" height="28"> parolla</a>
      <nav>
      ${navLinks}
      <a class="lang" href="${urls[other]}" hreflang="${other}">${t.switchTo}</a>
      </nav>
    </div>
  </header>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p class="updated">${t.updated}: ${updated}</p>
    ${contentHtml}
    <p><a class="cta" href="${t.home}">${escapeHtml(t.play)}</a></p>
  </main>
  <footer>
    <div class="footer-inner">
      <strong>${escapeHtml(t.footerNote)}</strong>
      <div class="footer-links">
        <a href="${t.home}">parolla.app</a>
        <a href="https://apps.apple.com/app/parolla-kelime-oyunu/id6448075358" rel="noopener">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=app.parolla" rel="noopener">Google Play</a>
        <a href="https://x.com/parollaapp" rel="noopener">X</a>
        <a href="https://github.com/selimdoyranli/parolla" rel="noopener">GitHub</a>
      </div>
    </div>
  </footer>
</body>
</html>
`
}

module.exports = { renderPage, LABELS }
