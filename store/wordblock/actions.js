export default {
  async fetchWord({ commit }) {
    /* const { data, error } = await this.$appFetch({
      path: `modes/wordblock`
    })

    if (data) {
      commit('SET_TARGET_WORD', data.word)
    }

    return {
      data,
      error
    } */

    commit('SET_TARGET_WORD', 'PARLA')
  }
}
