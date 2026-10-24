import { reactive } from '@nuxtjs/composition-api'

const STORAGE_KEY = 'parolla:cookieConsent'

// shared by the banner, the preferences dialog and the menu link; choice: null until the visitor decides
const state = reactive({ choice: undefined, isOpenPreferences: false })

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))

    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

// AdSense reads this flag on every ad request: personalised ads only after an explicit yes
const applyAdConsent = choice => {
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.requestNonPersonalizedAds = choice?.ads ? 0 : 1
}

export default () => {
  if (state.choice === undefined) {
    state.choice = read()
    applyAdConsent(state.choice)
  }

  const save = choice => {
    state.choice = choice
    state.isOpenPreferences = false
    applyAdConsent(choice)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
    } catch {}
  }

  return {
    state,
    save,
    acceptAll: () => save({ ads: true }),
    rejectAll: () => save({ ads: false }),
    openPreferences: () => {
      state.isOpenPreferences = true
    }
  }
}
