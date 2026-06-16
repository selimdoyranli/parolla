import { ampFetch, formatArtwork, jsonResponse } from './_apple.js'

const toTrack = resource => {
  const a = resource.attributes

  return {
    trackId: resource.id,
    trackName: a.name,
    previewUrl: a.previews?.[0]?.url ?? null,
    trackViewUrl: a.url ?? null,
    artistId: null,
    artistName: a.artistName ?? null,
    artworkUrl100: formatArtwork(a.artwork?.url, 100)
  }
}

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const playlistId = params.get('playlistId')

  if (!playlistId) {
    return jsonResponse({ data: [], error: 'playlistId is required' }, 400)
  }

  const limitParam = Number(params.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 300) : 100

  try {
    const json = await ampFetch(env, `/playlists/${encodeURIComponent(playlistId)}?include=tracks&limit%5Btracks%5D=300`)
    const root = json?.data?.[0]
    const attr = root?.attributes
    const refs = root?.relationships?.tracks?.data ?? []
    const included = Array.isArray(json?.included) ? json.included : []
    const byId = new Map(included.map(r => [r.id, r]))
    const tracks = refs
      .map(ref => (ref?.attributes ? ref : byId.get(ref?.id)))
      .filter(r => r && r.type === 'songs' && r.attributes)
      .map(toTrack)

    const seen = new Set()
    const songs = []

    for (const track of tracks) {
      if (!track.previewUrl) {
        continue
      }

      if (track.trackName && seen.has(track.trackName)) {
        continue
      }

      if (track.trackName) {
        seen.add(track.trackName)
      }
      songs.push(track)

      if (songs.length >= limit) {
        break
      }
    }

    return jsonResponse({
      data: songs,
      error: songs.length === 0 ? 'No playable tracks found for this playlist' : null,
      meta: {
        playlistId,
        total: songs.length,
        playlist: { name: attr?.name ?? null, artworkUrl: formatArtwork(attr?.artwork?.url, 300) }
      }
    })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
