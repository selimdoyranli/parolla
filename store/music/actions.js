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

    const { data, error } = await this.$appFetch({
      path: `modes/music/songs`,
      query: {
        artistIds: artistIds.join(','),
        perArtistLimit: getPerArtistLimit()
      }
    })

    const transformedData = data?.data.map(song => songTransformer(song)) || []

    return {
      data: transformedData,
      meta: data?.meta,
      error
    }
  }
}
