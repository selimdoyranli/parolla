import { computed, watch, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'
import { Howl } from 'howler'

/**
 * useDrawSoundFx — Howler-backed SFX for the draw room. Mirrors useGameScene's
 * mute model: each Howl tracks `app/isActiveGameSceneSoundFx` and silences
 * itself when the user disables game-scene sounds.
 *
 * Returns play* methods only; the caller decides when to fire them.
 */
export const useDrawSoundFx = () => {
  const vm = getCurrentInstance().proxy
  const $store = vm.$store

  const isActive = computed(() => $store.getters['app/isActiveGameSceneSoundFx'])
  const muted = () => !isActive.value

  const startSfx = new Howl({ src: ['/sound/fx/start.wav'], mute: muted() })
  const correctSfx = new Howl({ src: ['/sound/fx/correct.wav'], mute: muted() })
  const tickTockSfx = new Howl({ src: ['/sound/fx/tick-tock.wav'], mute: muted(), volume: 0.3 })

  const stopWatch = watch(isActive, v => {
    const m = !v
    startSfx.mute(m)
    correctSfx.mute(m)
    tickTockSfx.mute(m)
  })

  onBeforeUnmount(() => {
    stopWatch()
    startSfx.unload()
    correctSfx.unload()
    tickTockSfx.unload()
  })

  return {
    playStart: () => startSfx.play(),
    playCorrect: () => correctSfx.play(),
    playTickTock: () => tickTockSfx.play()
  }
}
