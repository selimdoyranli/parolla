import 'acs-audio'

/**
 * acs.js — sync ACS (audio-css) mute state with Vuex.
 *
 * The <link rel="audiostyle" href="/sound/parolla.acs"> is declared
 * statically in app.html so it's in the DOM before acs-audio runs its
 * one-shot DOMContentLoaded scan (runtime.mjs:4350). Inserting the link
 * here at plugin-time is too late — ACS's loadStylesheets() has already
 * run and won't pick up dynamically-added <link> elements.
 *
 * Plugin responsibility is now just: reflect Vuex `app/isActiveSoundFx`
 * into window.ACS.setEnabled() so the existing MenuDialog "sound
 * effects" switch mutes Howler (game sounds, see useGameScene.js) and
 * ACS (UI sounds) through a single source of truth.
 */
export default function ({ store }) {
  if (!process.client || typeof window === 'undefined') return

  const apply = active => {
    if (!window.ACS || typeof window.ACS.setEnabled !== 'function') return
    window.ACS.setEnabled(!!active)
  }

  // Initial sync. ACS may not be wired up yet on the very first tick
  // after import — retry once on the next microtask.
  const initial = store.getters['app/isActiveSoundFx']
  apply(initial)
  Promise.resolve().then(() => apply(store.getters['app/isActiveSoundFx']))

  store.watch((_state, getters) => getters['app/isActiveSoundFx'], apply)
}
