import { ampFetch, formatArtwork, jsonResponse } from './_apple.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const term = new URL(request.url).searchParams.get('term')

  if (!term || term.trim().length < 2) {
    return jsonResponse({ data: [] })
  }

  try {
    const json = await ampFetch(env, `/search?term=${encodeURIComponent(term.trim())}&types=playlists&limit=10&l=en-US`)
    const items = json?.results?.playlists?.data ?? []
    const data = items.map(p => ({
      playlistId: p.id,
      name: p.attributes?.name,
      artworkUrl: formatArtwork(p.attributes?.artwork?.url, 300)
    }))

    return jsonResponse({ data })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
