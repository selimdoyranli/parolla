export default {
  async fetchPlayerStats({ commit }, { userId, isSelf = false }) {
    // Rooms count must mirror the rooms list visibility:
    //   - other viewers see public + visible + non-anon rooms only
    //     (backend also enforces isPublic + isAnon for non-owner queries,
    //     but we pin isVisible here since the backend does not enforce it)
    //   - the owner sees everything (drafts, unlisted, anonymous)
    const roomsQuery = {
      'filters[user][id][$eq]': userId,
      'pagination[page]': 1,
      'pagination[pageSize]': 1
    }

    if (!isSelf) {
      roomsQuery['filters[isVisible][$eq]'] = true
      roomsQuery['filters[isPublic][$eq]'] = true
    }

    const simpleQuery = {
      'filters[user][id][$eq]': userId,
      'pagination[page]': 1,
      'pagination[pageSize]': 1
    }

    const [roomsRes, scoresRes, reviewsRes] = await Promise.all([
      this.$appFetch({ path: 'rooms', query: roomsQuery }),
      this.$appFetch({ path: 'room-scores', query: simpleQuery }),
      this.$appFetch({ path: 'room-reviews', query: simpleQuery })
    ])

    const stats = {
      rooms: roomsRes.data?.meta?.pagination?.total ?? 0,
      scores: scoresRes.data?.meta?.pagination?.total ?? 0,
      reviews: reviewsRes.data?.meta?.pagination?.total ?? 0
    }

    commit('SET_PLAYER_STATS', stats)

    return {
      data: stats,
      error: roomsRes.error || scoresRes.error || reviewsRes.error || null
    }
  },

  async fetchPlayer({ commit }, { id, username }) {
    const { data, error } = await this.$appFetch({
      path: `users`,
      query: {
        'filters[id][$eq]': id,
        'filters[username][$eq]': username,
        populate: 'diceBear'
      }
    })

    if (data) {
      commit('SET_PLAYER', data[0])
    }

    return {
      data: data[0],
      error
    }
  },

  async updateAvatar({ commit }, { userId, avatarSvg, avatarConfig }) {
    const { data, error } = await this.$appFetch({
      path: `users/${userId}`,
      method: 'PUT',
      body: {
        diceBear: {
          svg: avatarSvg,
          config: avatarConfig
        }
      }
    })

    if (data) {
      commit('SET_PLAYER', data)
    }

    return {
      data,
      error
    }
  }
}
