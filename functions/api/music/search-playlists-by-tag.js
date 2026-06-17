import { ampFetch, formatArtwork, jsonResponse, withCache, CACHE_TTL, localeToStorefront, localeToLang } from './_apple.js'

const DEFAULT_LIMIT = 21
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

    const offsetParam = Number(params.get('offset'))
    const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? Math.floor(offsetParam) : 0

    if (term.length < 1) {
      return jsonResponse({ data: [], meta: { offset, limit, hasMore: false } })
    }

    try {
      const json = await ampFetch(
        env,
        `/search?term=${encodeURIComponent(
          term
        )}&types=playlists&with=serverBubbles&platform=web&limit=${limit}&offset=${offset}&l=${lang}`,
        storefront,
        { edge: true }
      )
      // serverBubbles groups results under `results.playlist` (singular);
      // fall back to the typed `results.playlists` shape just in case.
      const group = json?.results?.playlist || json?.results?.playlists
      const items = group?.data ?? []
      const data = items.map(p => ({
        playlistId: p.id,
        name: p.attributes?.name,
        artworkUrl: formatArtwork(p.attributes?.artwork?.url, 300)
      }))
      const hasMore = Boolean(group?.next) || data.length === limit

      return jsonResponse({ data, meta: { offset, limit, hasMore } }, 200, { maxAge: CACHE_TTL.search })
    } catch (err) {
      return jsonResponse({ data: [], error: String((err && err.message) || err), meta: { offset, limit, hasMore: false } }, 502)
    }
  })
}
