import { communityTransformer, roomTransformer } from '@/transformers'

const authHeaders = ctx => (ctx.$auth.loggedIn ? { Authorization: `${ctx.$auth.strategy.token.get()}` } : {})

const ROOM_SORT = { recent: 'createdAt:desc', popular: 'viewCount:desc', oldest: 'createdAt:asc' }

// text fields only: avatar/coverPhoto go through uploadCommunityMedia
const toPayload = ({ name, description, tags, visibility, postPermission }) => ({
  data: { name, description, tags, visibility, postPermission }
})

export default {
  async fetchCommunities(_, params = {}) {
    const { data, error } = await this.$appFetch({ path: 'communities', query: params, headers: authHeaders(this) })

    return {
      data: data ? { items: data.data.map(communityTransformer), total: data.meta.total, hasMore: data.meta.hasMore } : null,
      error
    }
  },

  async fetchCommunityBySlug({ commit }, { slug }) {
    const { data, error } = await this.$appFetch({
      path: `communities/slug/${encodeURIComponent(slug)}`,
      headers: authHeaders(this)
    })
    const community = data ? communityTransformer(data.data) : null

    if (community) commit('SET_CURRENT_COMMUNITY', community)

    return { data: community, error }
  },

  async createCommunity({ dispatch }, { form }) {
    const { data, error } = await this.$appFetch({
      path: 'communities',
      method: 'POST',
      data: toPayload(form),
      headers: authHeaders(this)
    })

    if (data) await dispatch('auth/fetchMe', null, { root: true })

    return { data: data ? communityTransformer(data.data) : null, error }
  },

  async editCommunity({ commit, dispatch }, { documentId, form }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}`,
      method: 'PUT',
      data: toPayload(form),
      headers: authHeaders(this)
    })
    const community = data ? communityTransformer(data.data) : null

    if (community) {
      commit('SET_CURRENT_COMMUNITY', community)
      // name/avatar/settings are mirrored in the /users/me community lists
      await dispatch('auth/fetchMe', null, { root: true })
    }

    return { data: community, error }
  },

  async deleteCommunity({ commit, dispatch }, { documentId }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}`,
      method: 'DELETE',
      headers: authHeaders(this)
    })

    if (!error) {
      commit('SET_CURRENT_COMMUNITY', null)
      await dispatch('auth/fetchMe', null, { root: true })
    }

    return { data, error }
  },

  async uploadCommunityMedia({ commit }, { documentId, field, file }) {
    const formData = new FormData()
    formData.append('files', file, `community-${field}-${Date.now()}.jpg`)

    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}/media`,
      method: 'POST',
      query: { field },
      data: formData,
      headers: { ...authHeaders(this), 'Content-Type': 'multipart/form-data' }
    })
    const community = data ? communityTransformer(data.data) : null

    if (community) commit('SET_CURRENT_COMMUNITY', community)

    return { data: community, error }
  },

  async joinCommunity({ dispatch }, { documentId }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}/join`,
      method: 'POST',
      headers: authHeaders(this)
    })

    if (data) await dispatch('auth/fetchMe', null, { root: true })

    return { data: data ? data.data : null, error }
  },

  async leaveCommunity({ dispatch }, { documentId }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}/leave`,
      method: 'DELETE',
      headers: authHeaders(this)
    })

    if (!error) await dispatch('auth/fetchMe', null, { root: true })

    return { data: data?.data?.data ?? null, error }
  },

  async fetchMembers(_, { documentId, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}/members`,
      query: { page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data, hasMore: data.meta.hasMore } : null, error }
  },

  async fetchPendingMembers(_, { documentId, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `communities/${documentId}/pending-members`,
      query: { page, pageSize: 20 },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data, hasMore: data.meta.hasMore } : null, error }
  },

  approveMember(_, { documentId, memberDocumentId }) {
    return memberAction(this, documentId, memberDocumentId, 'approve')
  },
  rejectMember(_, { documentId, memberDocumentId }) {
    return memberAction(this, documentId, memberDocumentId, 'reject')
  },
  promoteMember(_, { documentId, memberDocumentId }) {
    return memberAction(this, documentId, memberDocumentId, 'promote')
  },
  demoteMember(_, { documentId, memberDocumentId }) {
    return memberAction(this, documentId, memberDocumentId, 'demote')
  },
  kickMember(_, { documentId, memberDocumentId }) {
    return memberAction(this, documentId, memberDocumentId)
  },

  // feed = the regular rooms endpoint filtered by community; the server answers 403 for non-members of private ones
  async fetchCommunityRooms(_, { documentId, sort = 'recent', page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: 'rooms',
      query: {
        'filters[community][documentId][$eq]': documentId,
        sort: ROOM_SORT[sort] || ROOM_SORT.recent,
        'pagination[page]': page,
        'pagination[pageSize]': 10,
        'populate[user][populate][0]': 'diceBear',
        'populate[user][populate][1]': 'role',
        populate: 'roomTags',
        locale: this.$i18n.locale
      },
      headers: authHeaders(this)
    })

    return {
      data: data
        ? {
            items: data.data.map(roomTransformer),
            hasMore: data.meta.pagination.page < data.meta.pagination.pageCount
          }
        : null,
      error
    }
  },

  // GM moderation (api/moderation, GM role only)
  async gmFetchCommunities(_, { page = 1, search = '', hidden = false } = {}) {
    const { data, error } = await this.$appFetch({
      path: 'moderation/communities',
      query: { page, ...(search && { search }), ...(hidden && { hidden: 1 }) },
      headers: authHeaders(this)
    })

    return { data: data ? { items: data.data, total: data.meta.total, hasMore: data.meta.hasMore } : null, error }
  },

  gmHideCommunity(_, { documentId, note = '' }) {
    return this.$appFetch({
      path: `moderation/communities/${documentId}/hide`,
      method: 'POST',
      data: { note },
      headers: authHeaders(this)
    })
  },

  gmUnhideCommunity(_, { documentId }) {
    return this.$appFetch({
      path: `moderation/communities/${documentId}/unhide`,
      method: 'POST',
      data: {},
      headers: authHeaders(this)
    })
  },

  gmDeleteCommunity(_, { documentId }) {
    return this.$appFetch({
      path: `moderation/communities/${documentId}`,
      method: 'DELETE',
      headers: authHeaders(this)
    })
  }
}

// approve/reject/promote/demote are POSTs; kick (no action) is the DELETE on the member
async function memberAction(ctx, documentId, memberDocumentId, action) {
  const base = `communities/${documentId}/members/${memberDocumentId}`
  const { data, error } = await ctx.$appFetch({
    path: action ? `${base}/${action}` : base,
    method: action ? 'POST' : 'DELETE',
    headers: authHeaders(ctx)
  })

  return { data: action ? data?.data ?? null : data?.data?.data ?? null, error }
}
