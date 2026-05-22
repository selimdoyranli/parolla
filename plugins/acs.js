import 'acs-audio'

/**
 * acs.js — initialize ACS (audio-css) on the client.
 *
 * - Attaches the audiostyle <link> so .acs rules take effect.
 * - Syncs window.ACS.setEnabled() with Vuex `app/isActiveSoundFx`,
 *   so the existing MenuDialog "sound effects" switch mutes both
 *   Howler (game sounds, see composables/useGameScene.js) and ACS
 *   (UI sounds) through a single source of truth.
 */
export default function ({ store }) {
  if (!process.client || typeof window === 'undefined') return

  // 1) Wire the declarative stylesheet.
  if (!document.querySelector('link[rel="audiostyle"][href="/sound/parolla.acs"]')) {
    const link = document.createElement('link')
    link.rel = 'audiostyle'
    link.href = '/sound/parolla.acs'
    document.head.appendChild(link)
  }

  // 2) Helper that reflects the Vuex flag into ACS.
  const apply = active => {
    if (!window.ACS || typeof window.ACS.setEnabled !== 'function') return
    window.ACS.setEnabled(!!active)
  }

  // 3) Initial sync. ACS may not be wired up yet on the very first
  //    tick after import — retry once on the next microtask.
  const initial = store.getters['app/isActiveSoundFx']
  apply(initial)
  Promise.resolve().then(() => apply(store.getters['app/isActiveSoundFx']))

  // 4) Keep them in sync.
  store.watch((_state, getters) => getters['app/isActiveSoundFx'], apply)
}
