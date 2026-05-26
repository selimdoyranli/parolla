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
      path: `auth/google/callback?${callbackParams}&populate=diceBear,profilePhoto,role`,
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
  },

  async updateUser({ commit, state }, params) {
    const { username, fullname, bio, diceBear, avatarSource } = params

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
        ...(diceBear && { diceBear }),
        ...(avatarSource && { avatarSource })
      }
    })

    return {
      data,
      error
    }
  },

  async uploadProfilePhoto({ commit }, { file }) {
    const token = this.$auth.strategy.token.get()

    const formData = new FormData()
    formData.append('files', file, `profile-photo-${Date.now()}.jpg`)

    const { data, error } = await this.$appFetch({
      path: 'users/me/profile-photo',
      method: 'POST',
      data: formData,
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'multipart/form-data'
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

  async deleteProfilePhoto({ commit }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: 'users/me/profile-photo',
      method: 'DELETE',
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
      const response = await fetch(`https://ipinfo.io/json`)
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
