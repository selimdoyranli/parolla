import { Toast } from 'vant'
import { useSfx } from '@/composables/useSfx'

/**
 * showToast — vant Toast wrapper that plays the matching ACS sound.
 *
 * Variants (sound preset in parens):
 *   showToast.success(message, opts)  // success
 *   showToast.fail(message, opts)     // error  (alias: .error)
 *   showToast.info(message, opts)     // notify
 *   showToast.default(message, opts)  // notify @ vol 0.5
 *
 * `message` may be a string (becomes opts.message) or a full options
 * object. Always returns the Toast instance so callers can `.clear()`
 * or chain.
 */

const normalize = (messageOrOpts, opts) => {
  if (typeof messageOrOpts === 'string') {
    return { message: messageOrOpts, position: 'bottom', ...(opts || {}) }
  }

  return { position: 'bottom', ...(messageOrOpts || {}) }
}

const fire = (preset, vantOpts, sfxOpts) => {
  const { play } = useSfx()
  play(preset, sfxOpts)

  return Toast(vantOpts)
}

export const showToast = {
  success(message, opts) {
    const o = normalize(message, opts)

    return fire('success', { type: 'success', ...o })
  },
  fail(message, opts) {
    const o = normalize(message, opts)

    return fire('error', { type: 'fail', ...o })
  },
  error(message, opts) {
    return showToast.fail(message, opts)
  },
  info(message, opts) {
    const o = normalize(message, opts)

    return fire('notify', o)
  },
  default(message, opts) {
    const o = normalize(message, opts)

    return fire('notify', o, { volume: 0.5 })
  }
}

export default showToast
