import { fetchArtists as fetchArtistsFromItunes, fetchSongs as fetchSongsFromItunes } from '@/services/itunes.service'
import {
  fetchFeaturedPlaylists as fetchFeaturedPlaylistsFromCf,
  fetchFeaturedArtists as fetchFeaturedArtistsFromCf,
  fetchPlaylistSongs as fetchPlaylistSongsFromCf,
  searchPlaylists as searchPlaylistsFromCf,
  searchPlaylistsByTag as searchPlaylistsByTagFromCf
} from '@/services/music.service'

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

  async fetchFeaturedPlaylists({ commit }, { locale } = {}) {
    const { data, meta, error } = await fetchFeaturedPlaylistsFromCf(locale)

    return { data: data || [], meta, error }
  },

  async fetchFeaturedArtists({ commit }, { locale } = {}) {
    const { data, meta, error } = await fetchFeaturedArtistsFromCf(locale)

    return { data: data || [], meta, error }
  },

  async fetchPlaylistSongs({ commit }, { playlistId, locale }) {
    const { data, meta, error } = await fetchPlaylistSongsFromCf(playlistId, locale)

    return { data: data || [], meta, error }
  },

  async searchPlaylists({ commit }, { term, locale }) {
    const { data, meta, error } = await searchPlaylistsFromCf(term, locale)

    return { data: data || [], meta, error }
  },

  async searchPlaylistsByTag({ commit }, { term, offset, limit, locale }) {
    const { data, meta, error } = await searchPlaylistsByTagFromCf({ term, offset, limit, locale })

    return { data: data || [], meta, error }
  }
}
