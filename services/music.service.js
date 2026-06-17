const fetchJson = async url => {
  try {
    const response = await fetch(url)
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        data: body?.data || [],
        meta: body?.meta,
        error: body?.error || new Error(`Request failed with status ${response.status}`)
      }
    }

    return { data: body?.data || [], meta: body?.meta, error: body?.error || null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown fetch error')

    return { data: [], meta: undefined, error }
  }
}

export const fetchFeaturedPlaylists = locale => fetchJson(`/api/music/featured-playlists?locale=${encodeURIComponent(locale || '')}`)

export const fetchFeaturedArtists = locale => fetchJson(`/api/music/featured-artists?locale=${encodeURIComponent(locale || '')}`)

export const fetchPlaylistSongs = (playlistId, locale) =>
  fetchJson(`/api/music/playlist-songs?playlistId=${encodeURIComponent(playlistId)}&locale=${encodeURIComponent(locale || '')}`)

export const searchPlaylists = (term, locale) =>
  fetchJson(`/api/music/search-playlists?term=${encodeURIComponent(term)}&locale=${encodeURIComponent(locale || '')}`)

export const searchPlaylistsByTag = ({ term, offset = 0, limit = 21, locale }) =>
  fetchJson(
    `/api/music/search-playlists-by-tag?term=${encodeURIComponent(term)}&offset=${offset}&limit=${limit}&locale=${encodeURIComponent(
      locale || ''
    )}`
  )
