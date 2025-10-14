export default {
  async fetchPlayer({ commit }, { id, username }) {
    const { data, error } = await this.$appFetch({
      path: `users`,
      query: {
        'filters[id][$eq]': id,
        'filters[username][$eq]': username,
        populate: 'diceBear'
      }
    })

    if (data) {
      commit('SET_PLAYER', data[0])
    }

    return {
      data: data[0],
      error
    }
  },

  async updateAvatar({ commit }, { userId, avatarSvg, avatarConfig }) {
    const { data, error } = await this.$appFetch({
      path: `users/${userId}`,
      method: 'PUT',
      body: {
        diceBear: {
          svg: avatarSvg,
          config: avatarConfig
        }
      }
    })

    if (data) {
      commit('SET_PLAYER', data)
    }

    return {
      data,
      error
    }
  }
}
