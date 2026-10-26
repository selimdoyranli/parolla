/**
 * Build-time heads for the static app routes (/gunluk/, /kelimeblok/, …).
 * `nuxt generate` with ssr:false writes the same homepage head into every route's shell, so
 * crawlers that don't run JS (and share previews) see the homepage everywhere. This step
 * rewrites each route's own HTML file with the title/description its page sets on the client
 * (`${seo.<key>.title} - ${seo.main.title}`, read from locales/*.js so the two can't drift),
 * plus canonical, hreflang, JSON-LD and a hidden text block inside #__nuxt.
 * Static files only: no Worker, no runtime cost.
 */

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { BASE_URL, ROUTE_HEADS, CONTENT_PAGES } = require('./site.config')

const ROOT = path.resolve(__dirname, '../..')

const TEXT = {
  tr: { home: 'Ana Sayfa', howTo: 'Nasıl oynanır?', play: 'Hemen oyna' },
  en: { home: 'Home', howTo: 'How to play', play: 'Play now' }
}

const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const jsonLdTag = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

// locales/*.js are ES modules; Node loads them through import() (module syntax detection)
const loadSeo = async locale => (await import(pathToFileURL(path.join(ROOT, 'locales', `${locale}.js`)).href)).default.seo

const interpolate = (text, params = {}) => text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match))

// a route ending in "/" is a directory in dist (index.html); anything else is a file next to it ("6-harf.html")
const fileFor = (outDir, url) => path.join(outDir, url.endsWith('/') ? `${url}index.html` : `${url}.html`)

// Sets the content of the shell's <meta data-hid="…">; returns false when the tag is missing
const setMeta = (html, hid, content) => {
  const pattern = new RegExp(`(<meta[^>]*data-hid="${hid}"[^>]*content=")[^"]*(")`)

  // function replacer: page text may contain `$`, which a replacement string would expand
  return pattern.test(html) ? html.replace(pattern, (match, open, close) => `${open}${escapeHtml(content)}${close}`) : false
}

/** Builds the head + body pieces for one route in one locale. */
const buildRouteHead = ({ route, locale, seo }) => {
  const entry = route.seo.split('.').reduce((node, key) => node?.[key], seo)

  if (!entry?.title || !entry?.description) throw new Error(`missing seo.${route.seo} title/description in locales/${locale}.js`)

  const text = TEXT[locale]
  const title = `${interpolate(entry.title, route.params)} - ${seo.main.title}`
  const description = interpolate(entry.description, route.params)
  const canonical = BASE_URL + route.urls[locale]
  const howTo = route.howTo && CONTENT_PAGES.find(page => page.key === route.howTo)
  const links = [
    ...(route.related || []).map(related => ({ url: related.urls[locale], label: related.labels[locale] })),
    howTo && { url: `${howTo[locale].url}/`, label: text.howTo }
  ].filter(link => link?.url)

  const body = [
    `<h1>${escapeHtml(interpolate(entry.title, route.params))}</h1>`,
    `<p>${escapeHtml(description)}</p>`,
    links.length && `<ul>${links.map(link => `<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul>`
  ]
    .filter(Boolean)
    .join('')

  const alternates = Object.entries(route.urls)
    .map(([lang, url]) => `<link rel="alternate" hreflang="${lang}" href="${BASE_URL}${url}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}${route.urls.tr}">`)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonical,
      inLanguage: locale,
      isPartOf: { '@type': 'WebSite', name: 'parolla', url: BASE_URL }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: text.home, item: `${BASE_URL}${locale === 'tr' ? '/' : '/en/'}` },
        { '@type': 'ListItem', position: 2, name: interpolate(entry.title, route.params), item: canonical }
      ]
    }
  ]

  return {
    title,
    description,
    canonical,
    keywords: entry.keywords && interpolate(entry.keywords, route.params),
    image: route.images?.[locale] && BASE_URL + route.images[locale],
    headTags: [`<link rel="canonical" href="${canonical}">`, ...alternates, ...jsonLd.map(jsonLdTag)].join(''),
    body
  }
}

/** Rewrites one shell; throws if any anchor the rewrite relies on is missing. */
const applyRouteHead = (shell, head) => {
  let html = shell.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(head.title)}</title>`)

  const metas = {
    description: head.description,
    'og:title': head.title,
    'og:description': head.description,
    'og:url': head.canonical,
    'twitter:title': head.title,
    'twitter:description': head.description,
    'twitter:url': head.canonical,
    ...(head.image && { 'og:image': head.image, 'twitter:image': head.image })
  }

  for (const [hid, content] of Object.entries(metas)) {
    const next = setMeta(html, hid, content)

    if (next === false) throw new Error(`shell has no meta[data-hid="${hid}"]`)

    html = next
  }

  // the homepage keywords don't describe this page: use the page's own or drop the tag
  html = head.keywords ? setMeta(html, 'keywords', head.keywords) || html : html.replace(/<meta[^>]*data-hid="keywords"[^>]*>/, '')

  if (!html.includes('</head>') || !html.includes('<div id="__nuxt">')) throw new Error('shell has no </head> or <div id="__nuxt">')

  return html
    .replace('</head>', () => `${head.headTags}</head>`)
    .replace('<div id="__nuxt">', () => `<div id="__nuxt"><main style="display: none">${head.body}</main>`)
}

/** Writes every ROUTE_HEADS page into outDir. Returns [{ url, file, title }]. */
const writeRouteHeads = async outDir => {
  const seo = { tr: await loadSeo('tr'), en: await loadSeo('en') }
  // routes without their own shell (dynamic ones like /kelimeblok/6-harf) start from the homepage shell
  const baseShell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
  const written = []

  for (const route of ROUTE_HEADS) {
    for (const [locale, url] of Object.entries(route.urls)) {
      const file = fileFor(outDir, url)
      const shell = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : baseShell
      const head = buildRouteHead({ route, locale, seo: seo[locale] })

      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, applyRouteHead(shell, head))
      written.push({ url, file, title: escapeHtml(head.title) })
    }
  }

  return written
}

module.exports = { writeRouteHeads, buildRouteHead, applyRouteHead, fileFor, loadSeo }
