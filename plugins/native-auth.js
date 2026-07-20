export default ({ store }) => {
  if (typeof window === 'undefined') return

  // Called by the native (Expo) shell after a successful NATIVE Google sign-in.
  // The shell runs the native account picker (no browser, no extra layer) and hands us the
  // resulting Google access token via WebView.injectJavaScript. We exchange it with Strapi
  // for a parolla session using the same endpoints the web OAuth callback uses, and update
  // the store in place — so the current WebView page becomes authenticated without any
  // navigation, reload, or extra layer.
  window.__parollaMobileAuthComplete = async accessToken => {
    if (!accessToken) return

    try {
      const callbackParams = `access_token=${accessToken}`

      const { data } = await store.dispatch('auth/fetchGoogleUser', callbackParams)

      if (data) {
        await store.dispatch('auth/setGoogleUser', { callbackParams, googleResponse: data })
      }

      const { data: meData } = await store.dispatch('auth/fetchMe')

      if (meData) {
        store.commit('auth/SET_USER', meData)
      }
    } catch (error) {
      console.error('[native-auth] Google sign-in completion failed', error)
    }
  }
}
