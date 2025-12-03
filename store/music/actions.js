import { artistTransformer } from '@/transformers/music.transformer'

const fetchArtworkHelper = async (appFetch, { artistId, artistName }) => {
  let url

  if (artistId) {
    url = `https://itunes.apple.com/lookup?id=${artistId}&entity=album`
  } else {
    url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=50`
  }

  const { data, error } = await appFetch({ url })

  if (data && data.results && data.results.length > 0) {
    const albums = data.results.filter(result => result.wrapperType === 'collection')

    if (albums.length > 0) {
      const sortedAlbums = albums.sort((a, b) => {
        const trackCountA = a.trackCount || 0
        const trackCountB = b.trackCount || 0

        return trackCountB - trackCountA
      })

      const albumWithMostTracks = sortedAlbums[0]

      return {
        data: {
          artworkUrl: albumWithMostTracks.artworkUrl100 || null,
          collectionName: albumWithMostTracks.collectionName || null,
          releaseDate: albumWithMostTracks.releaseDate || null,
          trackCount: albumWithMostTracks.trackCount || null
        },
        error: null
      }
    }
  }

  return {
    data: null,
    error: error || (data && data.results && data.results.length === 0 ? { message: 'No album found' } : null)
  }
}

export default {
  async fetchArtwork({ commit }, { artistId, artistName }) {
    return await fetchArtworkHelper(this.$appFetch, { artistId, artistName })
  },

  async fetchArtists({ commit }, { term }) {
    const { data, error } = await this.$appFetch({
      url: `https://itunes.apple.com/search?term=${term}&media=music&entity=musicArtist`
    })

    if (!data || !data.results) {
      return {
        data: [],
        error
      }
    }

    const transformedArtists = await Promise.all(
      data.results.map(async artist => {
        const transformedArtist = artistTransformer(artist)

        const { data: artworkData } = await fetchArtworkHelper(this.$appFetch, {
          artistId: artist.artistId,
          artistName: artist.artistName
        })

        return {
          ...transformedArtist,
          artwork: artworkData
        }
      })
    )

    if (data) {
      console.log(transformedArtists)
    }

    return {
      data: transformedArtists,
      error
    }
  },

  async increaseDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/music/view-count`,
      method: 'POST'
    })

    return {
      data,
      error
    }
  },

  async fetchDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/music/view-count`
    })

    if (data) {
      commit('SET_DAILY_PLAYING_COUNT', data.count)
    }

    return {
      data,
      error
    }
  }
}
