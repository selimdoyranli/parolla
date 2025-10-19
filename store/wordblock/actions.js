export default {
  async fetchWord({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/wordblock/daily-word`,
      query: {
        charLength: 5
      }
    })

    if (data) {
      const transform = data => {
        return {
          word: data.data.word,
          source: data.data.source,
          date: data.data.date,
          charLength: data.data.charLength
        }
      }

      commit('SET_TARGET_WORD', transform(data).word)
    }

    return {
      data,
      error
    }
  }
}
