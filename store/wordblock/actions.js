export default {
  async fetchWord({ commit }) {
    /* const { data, error } = await this.$appFetch({
      path: `modes/wordblock/daily-word`,
      query: {
        length: 5
      }
    })

    if (data) {
      commit('SET_TARGET_WORD', {
        word: data.word
      })
    }

    return {
      data,
      error
    } */

    commit('SET_TARGET_WORD', 'PARLA')
  }
}
