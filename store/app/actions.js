import WebSocket from 'isomorphic-ws'

export default {
  initWs({ commit, rootState, state }) {
    // Check if WebSocket already exists and is connecting or open
    if (state.ws) {
      const readyState = state.ws.readyState

      if (readyState === WebSocket.CONNECTING || readyState === WebSocket.OPEN) {
        console.log('WebSocket already exists, skipping initialization')

        return state.ws
      }
    }

    // Try to get token from multiple sources
    const token =
      this.$auth.strategy.token.get() || this.$cookies.get('auth._token.google') || (rootState.nuxtAuth && rootState.nuxtAuth.token)

    console.log('Initializing WebSocket with token:', token ? 'Token found' : 'No token (viewer mode)')

    // Build WebSocket URL with token if available
    const wsUrl = token ? `${process.env.WS_URL}?token=${token}` : process.env.WS_URL

    // Create WebSocket instance
    const ws = new WebSocket(wsUrl)

    commit('SET_WS', ws)

    return ws
  },

  closeWs({ commit, state }) {
    if (state.ws) {
      state.ws.close(1000, 'Client disconnecting')
    }

    commit('SET_WS', null)
  },

  async fetchAnnouncements({ commit }) {
    const { data, error } = await this.$appFetch({
      path: 'announcements',
      query: {
        locale: this.$i18n.locale,
        sort: 'createdAt:desc'
      }
    })

    return {
      data,
      error
    }
  }
}
