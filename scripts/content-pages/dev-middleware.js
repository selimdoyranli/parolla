/**
 * Dev server middleware for the static content pages (GEO / AI visibility layer).
 * In production these pages are real files emitted into dist/ by generate.js —
 * but `nuxt dev` never runs the generator, so /nasil-oynanir & co. would 404.
 * This middleware renders them on demand (fresh markdown read on every request,
 * so content edits show up immediately). Registered in nuxt.config.js.
 */

const { CONTENT_PAGES } = require('./site.config')
const { LOCALES, renderContentPage, buildLlmsOutputs, buildSitemap } = require('./render')

const routes = new Map()

for (const page of CONTENT_PAGES) {
  for (const locale of LOCALES) {
    routes.set(page[locale].url, { page, locale })
  }
}

const renderAll = () => CONTENT_PAGES.flatMap(page => LOCALES.map(locale => renderContentPage(page, locale)))

const send = (res, contentType, body) => {
  res.statusCode = 200
  res.setHeader('Content-Type', contentType)
  res.end(body)
}

module.exports = (req, res, next) => {
  const pathname = (req.url || '/').split('?')[0].replace(/\/+$/, '') || '/'

  try {
    const hit = routes.get(pathname)

    if (hit) return send(res, 'text/html; charset=utf-8', renderContentPage(hit.page, hit.locale).html)

    if (pathname === '/llms.txt') return send(res, 'text/plain; charset=utf-8', buildLlmsOutputs(renderAll()).llmsTxt)

    if (pathname === '/llms-full.txt') return send(res, 'text/plain; charset=utf-8', buildLlmsOutputs(renderAll()).llmsFullTxt)

    if (pathname === '/sitemap.xml') {
      const now = new Date().toISOString()

      return send(res, 'application/xml; charset=utf-8', buildSitemap({ buildDate: now, contentLastMod: () => now }))
    }
  } catch (e) {
    return next(e)
  }

  next()
}
