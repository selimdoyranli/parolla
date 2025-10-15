import { RADKOD_API_URL } from '@/system/constant'

export default {
  async fetchMe({ commit, state }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: 'users/me',
      headers: {
        Authorization: `${token}`
      }
    })

    if (data) {
      commit('SET_USER', data)
    }

    return {
      data,
      error
    }
  },

  async fetchGoogleUser({ commit, state }, callbackParams) {
    const { data, error } = await this.$appFetch({
      path: `auth/google/callback?${callbackParams}&populate=diceBear`,
      headers: {
        Authorization: `${callbackParams}`
      }
    })

    return {
      data,
      error
    }
  },

  /**
   * Set Google user
   * @param {SetGoogleUserTypes} params
   */
  async setGoogleUser({ commit, state, dispatch, rootGetters }, params) {
    const { googleResponse } = params

    await this.$auth.setStrategy('google')
    await this.$auth.setUserToken(googleResponse.jwt)
    await this.$auth.setUser(googleResponse.user)

    await commit('SET_USER', googleResponse.user)

    // Upgrade existing WebSocket connection with token after successful login
    if (process.client) {
      try {
        const existingWs = rootGetters['app/ws']

        // Only reinitialize if WebSocket exists (was created in viewer mode)
        if (existingWs) {
          console.info('Upgrading WebSocket connection with authentication token')
          // Close existing WebSocket connection (viewer mode)
          await dispatch('app/closeWs', null, { root: true })

          // Small delay to ensure clean closure
          await new Promise(resolve => setTimeout(resolve, 100))

          // Reinitialize with authenticated token
          await dispatch('app/initWs', null, { root: true })
          const ws = rootGetters['app/ws']

          if (ws) {
            await dispatch('tour/listenWs', { ws }, { root: true })
            console.info('WebSocket upgraded to authenticated mode')
          }
        }
      } catch (error) {
        console.error('Failed to upgrade WebSocket after Google login:', error)
      }
    }
  },

  async updateUser({ commit, state }, params) {
    const { username, fullname, bio, diceBear } = params

    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: 'users/me',
      headers: {
        Authorization: `${token}`
      },
      method: 'PUT',
      data: {
        username,
        fullname,
        bio,
        diceBear
      }
    })

    return {
      data,
      error
    }
  },

  async logout({ commit, state }) {
    commit('LOGOUT')
  },

  async getDeviceInfo() {
    const UAParser = require('ua-parser-js')
    const parser = new UAParser(navigator.userAgent)
    const ua = parser.getResult()

    let deviceInfo = {
      ...ua
    }

    if (typeof window !== 'undefined') {
      deviceInfo = {
        ...deviceInfo,
        window: {
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight
        }
      }
    }

    if (navigator) {
      deviceInfo = {
        ...deviceInfo,
        language: navigator.language
      }
    }

    try {
      const response = await fetch(`${RADKOD_API_URL}/global/ipinfo.php`)
      const ipData = await response.json()

      if (ipData) {
        deviceInfo = {
          ...deviceInfo,
          ipData
        }
      }
    } catch (error) {
      console.error('Error fetching IPData info:', error)
    }

    return {
      data: deviceInfo
    }
  }
}
