import { artistTransformer, songTransformer } from '@/transformers/music.transformer'

export default {
  async fetchArtists({ commit }, { term }) {
    const { data, error } = await this.$appFetch({
      path: `modes/music/artists`,
      query: {
        term
      }
    })

    const transformedData = data?.data.map(artist => artistTransformer(artist)) || []

    return {
      data: transformedData,
      meta: data?.meta,
      error
    }
  },

  async fetchSongs({ commit }, { artistIds }) {
    const getPerArtistLimit = () => {
      return 30
    }

    const { data } = await this.$appFetch({
      path: `modes/music/songs`,
      query: {
        artistIds: artistIds.join(','),
        perArtistLimit: getPerArtistLimit()
      }
    })

    let transformedData = []

    if (data?.length > 0) {
      transformedData = data?.data.map(song => songTransformer(song)) || []
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return {
      data: transformedData,
      meta: data?.meta,
      error: data?.error
    }
  }
}
