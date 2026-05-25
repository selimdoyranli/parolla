import { showToast } from '@/helpers/toast'

const TOAST_DEDUPE_MS = 3000
const lastToastByEndpoint = new Map()

export default function ({ $axios, app }) {
  $axios.onError(error => {
    if (!error || !error.response || error.response.status !== 429) {
      return Promise.reject(error)
    }

    const url = error.config?.url || ''
    const now = Date.now()
    const lastAt = lastToastByEndpoint.get(url) || 0

    if (now - lastAt > TOAST_DEDUPE_MS) {
      lastToastByEndpoint.set(url, now)

      const headers = error.response.headers || {}
      const retryAfterRaw = headers['retry-after'] || headers['Retry-After'] || headers['x-ratelimit-reset']
      const parsed = parseInt(retryAfterRaw, 10)
      const seconds = Number.isFinite(parsed) && parsed > 0 ? parsed : 30

      const message = app.i18n.t('error.rateLimited', { seconds })
      showToast.fail(message)
    }

    return Promise.reject(error)
  })
}
