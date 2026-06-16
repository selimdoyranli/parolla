import { fetchArtists as fetchArtistsFromItunes, fetchSongs as fetchSongsFromItunes } from '@/services/itunes.service'

export default {
  async fetchArtists({ commit }, { term }) {
    const { data, meta, error } = await fetchArtistsFromItunes({ term })

    return {
      data: data || [],
      meta,
      error
    }
  },

  async fetchSongs({ commit }, { artistIds }) {
    const perArtistLimit = 30

    const result = await fetchSongsFromItunes({
      artistIds,
      perArtistLimit
    })

    if (result.error) {
      throw new Error(result.error)
    }

    return {
      data: result.data || [],
      meta: result.meta,
      error: result.error
    }
  },

  async fetchPlaylists() {
    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'modes/music/playlists'
    })

    return {
      data: data?.data || [],
      meta: data?.meta,
      error
    }
  },

  async fetchPlaylistSongs({ commit }, { playlistId }) {
    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'modes/music/songs',
      query: { playlistId }
    })

    return {
      data: data?.data || [],
      meta: data?.meta,
      error
    }
  }
}
