import { notificationTransformer } from '@/transformers'

const POLL_INTERVAL_MS = 60 * 1000
let pollTimer = null
let visibilityHandler = null

const authHeaders = ctx => ({ Authorization: `${ctx.$auth.strategy.token.get()}` })

export default {
  // Single refresh entry: polling calls it today; a socket event can call it later.
  async refreshUnreadCount({ commit }) {
    if (!this.$auth.loggedIn) return

    const { data } = await this.$appFetch({ path: 'notifications/unread-count', headers: authHeaders(this) })

    if (data) commit('SET_UNREAD_COUNT', data.count)
  },

  startPolling({ dispatch }) {
    if (pollTimer || typeof window === 'undefined') return

    dispatch('refreshUnreadCount')
    pollTimer = setInterval(() => {
      if (!document.hidden) dispatch('refreshUnreadCount')
    }, POLL_INTERVAL_MS)
    visibilityHandler = () => {
      if (!document.hidden) dispatch('refreshUnreadCount')
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  },

  stopPolling({ commit }) {
    clearInterval(pollTimer)
    pollTimer = null

    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
    commit('SET_UNREAD_COUNT', 0)
  },

  async fetchNotifications(_, { category = 'all', page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: 'notifications',
      query: { category, page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data.map(notificationTransformer), hasMore: data.meta.hasMore } : null, error }
  },

  async markRead({ dispatch }, { ids } = {}) {
    const { error } = await this.$appFetch({
      path: 'notifications/read',
      method: 'POST',
      data: ids ? { ids } : {},
      headers: authHeaders(this)
    })

    if (!error) await dispatch('refreshUnreadCount')

    return { error }
  },

  thank(_, { id }) {
    return this.$appFetch({ path: `notifications/${id}/thank`, method: 'POST', headers: authHeaders(this) })
  }
}
