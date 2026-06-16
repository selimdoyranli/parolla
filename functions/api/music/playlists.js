import { ampFetch, formatArtwork, jsonResponse, localeToStorefront, localeToLang } from './_apple.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const storefront = localeToStorefront(params.get('locale'))
  const lang = localeToLang(params.get('locale'))
  const strapiBase = env.STRAPI_API_URL || 'https://strapi.parolla.app/api'

  let ids = []

  try {
    const res = await fetch(`${strapiBase}/modes/music/playlists`)
    const body = await res.json()

    ids = (body?.data ?? []).map(entry => entry.playlistId).filter(Boolean)
  } catch (err) {
    return jsonResponse({ data: [], error: 'Failed to load curated playlists' }, 502)
  }

  if (!ids.length) {
    return jsonResponse({ data: [], meta: { total: 0 } })
  }

  try {
    const results = await Promise.all(
      ids.map(async id => {
        try {
          const json = await ampFetch(env, `/playlists/${encodeURIComponent(id)}?l=${lang}`, storefront)
          const attr = json?.data?.[0]?.attributes

          if (!attr) {
            return null
          }

          return { playlistId: id, name: attr.name, artworkUrl: formatArtwork(attr.artwork?.url, 300) }
        } catch {
          return null
        }
      })
    )
    const data = results.filter(Boolean)

    return jsonResponse({ data, meta: { total: data.length } })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
