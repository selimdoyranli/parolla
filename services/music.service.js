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

export const fetchPlaylists = () => fetchJson('/api/music/playlists')

export const fetchPlaylistSongs = playlistId => fetchJson(`/api/music/playlist-songs?playlistId=${encodeURIComponent(playlistId)}`)

export const searchPlaylists = term => fetchJson(`/api/music/search-playlists?term=${encodeURIComponent(term)}`)
