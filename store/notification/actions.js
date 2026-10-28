import { notificationTransformer } from '@/transformers'

const POLL_INTERVAL_MS = 60 * 1000
let pollTimer = null
let visibilityHandler = null

const authHeaders = ctx => ({ Authorization: `${ctx.$auth.strategy.token.get()}` })

// guests only see announcements; which ones they've read is kept in localStorage (backend does this for members)
const GUEST_READ_KEY = 'readAnnouncements'
const ANNOUNCEMENT_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

const getGuestReadIds = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_READ_KEY)) || []
  } catch (e) {
    return []
  }
}

const fetchAnnouncements = (ctx, { page = 1, pageSize = 20 } = {}) =>
  ctx.$appFetch({
    path: 'announcements',
    query: {
      locale: ctx.$i18n.locale,
      sort: 'publishedAt:desc',
      'filters[publishedAt][$gte]': new Date(Date.now() - ANNOUNCEMENT_WINDOW_MS).toISOString(),
      'pagination[page]': page,
      'pagination[pageSize]': pageSize
    }
  })

export default {
  // Single refresh entry: polling calls it today; a socket event can call it later.
  async refreshUnreadCount({ commit }) {
    if (!this.$auth.loggedIn) {
      const { data } = await fetchAnnouncements(this)
      const readIds = getGuestReadIds()

      if (data) commit('SET_UNREAD_COUNT', data.data.filter(a => !readIds.includes(a.documentId)).length)

      return
    }

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
    if (!this.$auth.loggedIn) {
      if (category !== 'all') return { data: { items: [], hasMore: false }, error: null }

      const { data, error } = await fetchAnnouncements(this, { page })
      const readIds = getGuestReadIds()

      return {
        data: data
          ? {
              items: data.data.map(a => ({
                ids: [a.documentId],
                type: 'announcement',
                actor: null,
                actorCount: 0,
                meta: { content: a.content },
                isRead: readIds.includes(a.documentId),
                createdAt: a.publishedAt
              })),
              hasMore: page < data.meta.pagination.pageCount
            }
          : null,
        error
      }
    }

    const { data, error } = await this.$appFetch({
      path: 'notifications',
      query: { category, page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data.map(notificationTransformer), hasMore: data.meta.hasMore } : null, error }
  },

  async markRead({ dispatch }, { ids } = {}) {
    if (!this.$auth.loggedIn) {
      try {
        localStorage.setItem(GUEST_READ_KEY, JSON.stringify([...new Set([...getGuestReadIds(), ...(ids || [])])]))
      } catch (e) {}
      await dispatch('refreshUnreadCount')

      return { error: null }
    }

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
