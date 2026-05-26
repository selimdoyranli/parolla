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
 * Plugin responsibility: reflect Vuex `app/isActiveReactionSoundFx` into
 * window.ACS.setEnabled(). ACS covers UI feedback (clicks, keyboard,
 * popup appear/leave); game-scene sounds (Howler in useGameScene.js)
 * are gated separately by `app/isActiveGameSceneSoundFx`.
 */
export default function ({ store }) {
  if (!process.client || typeof window === 'undefined') return

  const apply = active => {
    if (!window.ACS || typeof window.ACS.setEnabled !== 'function') return
    window.ACS.setEnabled(!!active)
  }

  // Initial sync. ACS may not be wired up yet on the very first tick
  // after import — retry once on the next microtask.
  const initial = store.getters['app/isActiveReactionSoundFx']
  apply(initial)
  Promise.resolve().then(() => apply(store.getters['app/isActiveReactionSoundFx']))

  store.watch((_state, getters) => getters['app/isActiveReactionSoundFx'], apply)
}
