import { roomCommentTransformer } from '@/transformers'

const authHeaders = ctx => (ctx.$auth.loggedIn ? { Authorization: `${ctx.$auth.strategy.token.get()}` } : {})

export default {
  async fetchComments(_, { roomId, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: 'room-comments',
      query: { room: roomId, page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data.map(roomCommentTransformer), hasMore: data.meta.hasMore } : null, error }
  },

  async fetchReplies(_, { documentId, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `room-comments/${documentId}/replies`,
      query: { page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data.map(roomCommentTransformer), hasMore: data.meta.hasMore } : null, error }
  },

  async fetchThread(_, { documentId }) {
    const { data, error } = await this.$appFetch({ path: `room-comments/${documentId}`, headers: authHeaders(this) })

    return {
      data: data
        ? { item: roomCommentTransformer(data.data), targetDocumentId: data.meta.targetDocumentId, roomId: data.meta.roomId }
        : null,
      error
    }
  },

  // topLevel: only comments posted on the quiz (profile tab); otherwise replies come too, with a parent quote
  async fetchByUser(_, { userId, page = 1, topLevel = false }) {
    const { data, error } = await this.$appFetch({
      path: `room-comments/by-user/${userId}`,
      query: { page, pageSize: 10, ...(topLevel && { topLevel: 1 }) },
      headers: authHeaders(this)
    })

    return {
      data: data ? { items: data.data.map(roomCommentTransformer), hasMore: data.meta.hasMore, total: data.meta.total } : null,
      error
    }
  },

  async fetchMyLikes(_, { page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: 'room-comment-likes/me',
      query: { page, pageSize: 10 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data.map(roomCommentTransformer), hasMore: data.meta.hasMore } : null, error }
  },

  async postComment({ dispatch }, { roomId, content, parent = null }) {
    const { data: deviceInfo } = await dispatch('auth/getDeviceInfo', null, { root: true })
    const { data, error } = await this.$appFetch({
      path: 'room-comments',
      method: 'POST',
      data: { room: roomId, content, parent, deviceInfo },
      headers: authHeaders(this)
    })

    return { data: data ? { item: roomCommentTransformer(data.data) } : null, error }
  },

  async deleteComment(_, { documentId }) {
    return await this.$appFetch({ path: `room-comments/${documentId}`, method: 'DELETE', headers: authHeaders(this) })
  },

  async toggleLike(_, { documentId, liked }) {
    const { data, error } = await this.$appFetch({
      path: `room-comments/${documentId}/like`,
      method: liked ? 'DELETE' : 'POST',
      headers: authHeaders(this)
    })

    // app-fetch returns the whole axios response for DELETE
    return { data: data?.data ?? data, error }
  },

  async fetchRatings(_, { roomId, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: 'room-ratings',
      query: { room: roomId, page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data, ...data.meta } : null, error }
  },

  async postRating({ dispatch }, { roomId, rating }) {
    const { data: deviceInfo } = await dispatch('auth/getDeviceInfo', null, { root: true })
    const { data, error } = await this.$appFetch({
      path: 'room-ratings',
      method: 'POST',
      data: { room: roomId, rating, deviceInfo },
      headers: authHeaders(this)
    })

    return { data: data ? data.data : null, error }
  }
}
