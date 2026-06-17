import { ampFetch, formatArtwork, jsonResponse, withCache, CACHE_TTL, localeToStorefront, localeToLang, localeToStrapi } from './_apple.js'

export async function onRequestGet(context) {
  return withCache(context, async () => {
    const { request, env } = context
    const params = new URL(request.url).searchParams
    const storefront = localeToStorefront(params.get('locale'))
    const lang = localeToLang(params.get('locale'))
    const strapiLocale = localeToStrapi(params.get('locale'))
    const strapiBase = env.STRAPI_API_URL || 'https://strapi.parolla.app/api'

    let ids = []

    try {
      const res = await fetch(`${strapiBase}/modes/music/featured-artists?locale=${encodeURIComponent(strapiLocale)}`)
      const body = await res.json()

      ids = (body?.data ?? []).map(entry => entry.artistId).filter(Boolean)
    } catch (err) {
      return jsonResponse({ data: [], error: 'Failed to load featured artists' }, 502)
    }

    if (!ids.length) {
      return jsonResponse({ data: [], meta: { total: 0 } })
    }

    try {
      const results = await Promise.all(
        ids.map(async id => {
          try {
            const json = await ampFetch(env, `/artists/${encodeURIComponent(id)}?fields=name,artwork,url&l=${lang}`, storefront)
            const attr = json?.data?.[0]?.attributes

            if (!attr) {
              return null
            }

            return { artistId: id, artistName: attr.name, artworkUrl: formatArtwork(attr.artwork?.url, 300) }
          } catch {
            return null
          }
        })
      )
      const data = results.filter(Boolean)

      return jsonResponse({ data, meta: { total: data.length } }, 200, { maxAge: CACHE_TTL.featured })
    } catch (err) {
      return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
    }
  })
}
