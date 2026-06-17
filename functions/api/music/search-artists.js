import { ampFetch, formatArtwork, jsonResponse, withCache, CACHE_TTL, localeToStorefront, localeToLang } from './_apple.js'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 25

export async function onRequestGet(context) {
  return withCache(context, async () => {
    const { request, env } = context
    const params = new URL(request.url).searchParams
    const term = (params.get('term') || '').trim()
    const storefront = localeToStorefront(params.get('locale'))
    const lang = localeToLang(params.get('locale'))

    const limitParam = Number(params.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_LIMIT) : DEFAULT_LIMIT

    if (term.length < 2) {
      return jsonResponse({ data: [] })
    }

    try {
      const json = await ampFetch(
        env,
        `/search?term=${encodeURIComponent(term)}&types=artists&with=serverBubbles&platform=web&limit=${limit}&l=${lang}`,
        storefront,
        { edge: true }
      )
      // serverBubbles groups results under `results.artist` (singular);
      // fall back to the typed `results.artists` shape just in case.
      const group = json?.results?.artist || json?.results?.artists
      const items = group?.data ?? []
      // AMP catalog artist id matches the iTunes artistId, so the play screen's
      // iTunes /lookup keeps working with the id returned here.
      const data = items.map(a => ({
        artistId: a.id,
        artistName: a.attributes?.name,
        artworkUrl: formatArtwork(a.attributes?.artwork?.url, 300)
      }))

      return jsonResponse({ data }, 200, { maxAge: CACHE_TTL.search })
    } catch (err) {
      return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
    }
  })
}
