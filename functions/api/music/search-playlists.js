import { ampFetch, formatArtwork, jsonResponse, withCache, CACHE_TTL, localeToStorefront, localeToLang } from './_apple.js'

export async function onRequestGet(context) {
  return withCache(context, async () => {
    const { request, env } = context
    const params = new URL(request.url).searchParams
    const term = params.get('term')
    const storefront = localeToStorefront(params.get('locale'))
    const lang = localeToLang(params.get('locale'))

    if (!term || term.trim().length < 2) {
      return jsonResponse({ data: [] })
    }

    try {
      const json = await ampFetch(
        env,
        `/search?term=${encodeURIComponent(term.trim())}&types=playlists&with=serverBubbles&platform=web&limit=10&l=${lang}`,
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

      return jsonResponse({ data }, 200, { maxAge: CACHE_TTL.search })
    } catch (err) {
      return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
    }
  })
}
