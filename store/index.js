const setUser = async ({ $auth, $cookies, dispatch }) => {
  const logout = async () => {
    await $auth.setUserToken('')
    await $auth.setUser(null)
    await $auth.logout()

    await $cookies.remove('google_auth_callback_params')
    await $cookies.remove('google_auth_access_token')
    await $cookies.remove('google_auth_jwt_token')
  }

  if ($auth.strategy.name === 'local' && $auth.loggedIn) {
    const { data, error } = await dispatch('auth/fetchMe')

    if (data) {
      $auth.setUser(data)
    }

    if (error) {
      await logout()
    }
  }

  if ($cookies.get('auth._token.google')) {
    const { data, error } = await dispatch('auth/fetchMe')

    if (data) {
      await $auth.setStrategy('google')
      await $auth.setUserToken(`${$cookies.get('auth._token.google')}`)
      await $auth.setUser(data)
    }

    if (error) {
      await logout()
    }
  }
}

export const actions = {
  async nuxtClientInit({ dispatch, commit, getters }, { $auth, $cookies }) {
    if (process.browser) {
      await setUser({ dispatch, commit, $auth, $cookies })
    }
  }
}

export const strict = false
