/**
 * useSfx — thin composable wrapping window.ACS.helpers.play().
 *
 * Safe to call before ACS is ready (early mount, SSR-stripped builds):
 * unknown global → no-op. Mute state is controlled centrally via
 * window.ACS.setEnabled(), driven by plugins/acs.js watching the
 * Vuex `app/isActiveSoundFx` getter — callers never check the flag.
 */
export const useSfx = () => {
  const play = (preset, opts) => {
    if (process.server) return

    if (typeof window === 'undefined') return

    if (!window.ACS || !window.ACS.helpers || typeof window.ACS.helpers.play !== 'function') return

    try {
      window.ACS.helpers.play(preset, opts)
    } catch (err) {
      // Silent — sound failures must never break UX.
    }
  }

  return { play }
}
