import { roomTransformer, scoreboardTransformer } from '@/transformers'
import { choiceTypeEnum } from '@/enums/quiz.enum'

export default {
  async postRoom({ commit, state }, { form, deviceInfo }) {
    const token = this.$auth.strategy.token.get()

    const transform = form => {
      return {
        user: this.$auth.user?.id,
        isVisible: form.isVisible,
        isPublic: form.isListed,
        isAnon: !this.$auth.loggedIn && !this.$auth.user ? true : form.isAnon,
        title: form.roomTitle,
        description: form.description?.trim() || null,
        quizType: form.quizType,
        qaList: (form.qaList || []).map(item => {
          const qaItem = {
            order: item.order,
            character: item.character,
            questionType: item.questionType,
            question: item.question,
            answerType: item.answerType,
            answer: item.answer,
            media: item.media?.id || null,
            mediaNote: item.mediaNote,
            triviaOptions: item.triviaOptions
          }

          return qaItem
        }),
        choiceList: (form.choices || []).map(item => {
          const youtubeUrl = item.type === choiceTypeEnum.YOUTUBE ? item.media.url : null

          return {
            id: item.id,
            choiceType: item.type,
            text: item.type === choiceTypeEnum.TEXT ? item.content : null,
            youtubeUrl: youtubeUrl,
            media: item.media?.id || null,
            mediaNote: item.mediaNote
          }
        }),
        flashcardList: (form.flashcardList || []).map((item, index) => {
          return {
            cardFrontText: item.cardFrontText,
            cardBackText: item.cardBackText,
            order: index
          }
        }),
        roomTags: form.tags,
        gameTimeLimit: form.gameTimeLimit === null ? null : Number(form.gameTimeLimit),
        deviceInfo
      }
    }

    const { data, error } = await this.$appFetch({
      path: 'rooms',
      query: {
        locale: this.$i18n.locale
      },
      method: 'POST',
      data: {
        data: transform(form)
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async editRoom({ commit, state }, { documentId, form, deviceInfo }) {
    const token = this.$auth.strategy.token.get()

    const transform = form => {
      return {
        user: this.$auth.user?.id,
        isVisible: form.isVisible,
        isPublic: form.isListed,
        isAnon: !this.$auth.loggedIn && !this.$auth.user ? true : form.isAnon,
        title: form.roomTitle,
        description: form.description?.trim() || null,
        quizType: form.quizType,
        qaList: (form.qaList || []).map(item => {
          const qaItem = {
            documentId: item.documentId,
            order: item.order,
            character: item.character,
            questionType: item.questionType,
            question: item.question,
            answerType: item.answerType,
            answer: item.answer,
            media: item.media?.id || null,
            mediaNote: item.mediaNote,
            triviaOptions: item.triviaOptions
          }

          return qaItem
        }),
        choiceList: (form.choices || []).map(item => {
          const youtubeUrl = item.type === choiceTypeEnum.YOUTUBE ? item.media.url : null

          return {
            id: item.id,
            choiceType: item.type,
            text: item.type === choiceTypeEnum.TEXT ? item.content : null,
            youtubeUrl: youtubeUrl,
            media: item.media?.id || null,
            mediaNote: item.mediaNote
          }
        }),
        flashcardList: (form.flashcardList || []).map((item, index) => {
          return {
            documentId: item.documentId,
            cardFrontText: item.cardFrontText,
            cardBackText: item.cardBackText,
            order: index
          }
        }),
        roomTags: form.tags,
        gameTimeLimit: form.gameTimeLimit === null ? null : Number(form.gameTimeLimit),
        deviceInfo
      }
    }

    const { data, error } = await this.$appFetch({
      path: `rooms/${documentId}`,
      method: 'PUT',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: transform(form)
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async setRoomVisibility({ commit }, { documentId, isVisible }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: `rooms/${documentId}`,
      method: 'PUT',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: {
          user: this.$auth.user?.id,
          isVisible: isVisible
        }
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async deleteRoom({ commit }, { documentId }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: `rooms/${documentId}`,
      method: 'DELETE',
      query: {
        locale: this.$i18n.locale
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async uploadQuizMedia({ commit }, { file, path, ref, refId, field }) {
    const token = this.$auth.strategy.token.get()

    const formData = new FormData()

    formData.append('files', file)
    formData.append('path', path)
    formData.append('ref', ref)
    formData.append('refId', refId)
    formData.append('field', field)

    const { data, error } = await this.$appFetch({
      path: `rooms/upload-media`,
      method: 'POST',
      data: formData,
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return {
      data,
      error
    }
  },

  async uploadRoomCoverPhoto({ commit }, { documentId, file }) {
    const token = this.$auth.strategy.token.get()
    const formData = new FormData()
    formData.append('files', file, `cover-photo-${Date.now()}.jpg`)
    const { data, error } = await this.$appFetch({
      path: `rooms/${documentId}/cover-photo`,
      method: 'POST',
      data: formData,
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return { data, error }
  },

  async deleteRoomCoverPhoto({ commit }, { documentId }) {
    const token = this.$auth.strategy.token.get()
    const { data, error } = await this.$appFetch({
      path: `rooms/${documentId}/cover-photo`,
      method: 'DELETE',
      headers: {
        Authorization: `${token}`
      }
    })

    return { data, error }
  },

  async upvoteChoice({ commit }, { choiceDocumentId }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: `room-choices/${choiceDocumentId}/upvote`,
      method: 'PUT',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: {
          user: this.$auth.user?.id
        }
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async fetchRooms({ commit, state }, params) {
    const { isVisible, isLoadMore = false, page, limit, keyword, tags, user, locale } = params

    const getSort = _sort => {
      if (_sort === 'oldest') {
        return 'createdAt:asc'
      }

      if (_sort === 'byViewCount') {
        return 'viewCount:desc'
      }

      return 'createdAt:desc'
    }

    const queryDefault = {
      isVisible: null,
      page: 1,
      perPage: 10,
      search: '',
      tags: [],
      user: null,
      sort: state.room.sort,
      populate: '*',
      locale: this.$i18n.locale
    }

    const query = {
      'filters[isVisible][$eq]': isVisible || queryDefault.isVisible,
      'pagination[page]': page || queryDefault.page,
      'pagination[pageSize]': limit || queryDefault.perPage,
      sort: getSort(state.room.sort) || queryDefault.sort,
      'populate[user][populate]': 'diceBear',
      populate: 'roomTags',
      locale: locale || queryDefault.locale
    }

    if (isVisible) {
      query['filters[isVisible][$eq]'] = isVisible
    }

    // Check if keyword contains # to search in roomTags instead of title
    if (keyword && keyword.includes('#')) {
      const cleanedKeyword = keyword.replace('#', '')
      query['filters[roomTags][title][$in]'] = cleanedKeyword
    } else if (keyword) {
      query['filters[title][$containsi]'] = keyword
    }

    // Only add user filter if user is not null
    if (user) {
      query['filters[user]'] = user
    }

    if (tags?.length > 0) {
      tags.forEach((tag, index) => {
        query[`filters[roomTags][title][$in][${index}]`] = tag
      })
    }

    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'rooms',
      query: query,
      headers: {
        Authorization: `${token}`
      }
    })

    if (data) {
      const rooms = data.data.map(room => roomTransformer(room))

      if (isLoadMore) {
        commit('PUSH_ROOMS', rooms)
      } else {
        commit('SET_ROOMS', rooms)
      }

      const pagination = data.meta.pagination

      commit('SET_PAGINATION', pagination)

      const roomTotal = data.meta.pagination.total

      commit('SET_ROOM_TOTAL', roomTotal)
    }

    return {
      data,
      error
    }
  },

  async fetchUserRooms({ commit }, params) {
    const { isLoadMore = false, page, limit, keyword, user, locale, includeDrafts = false, includeUnlisted = false } = params

    // Other-user profile = strict public view. Own-profile callers opt in to
    // see their drafts (isVisible:false) and unlisted (isPublic:false) rooms.
    const query = {
      'pagination[page]': page || 1,
      'pagination[pageSize]': limit || 10,
      sort: 'createdAt:desc',
      'populate[user][populate]': 'diceBear',
      populate: 'roomTags',
      locale: locale || this.$i18n.locale
    }

    if (!includeDrafts) query['filters[isVisible][$eq]'] = true

    if (!includeUnlisted) query['filters[isPublic][$eq]'] = true

    if (keyword && keyword.includes('#')) {
      query['filters[roomTags][title][$in]'] = keyword.replace('#', '')
    } else if (keyword) {
      query['filters[title][$containsi]'] = keyword
    }

    if (user) {
      query['filters[user]'] = user
    }

    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'rooms',
      query,
      headers: { Authorization: `${token}` }
    })

    if (data) {
      const rooms = data.data.map(room => roomTransformer(room))

      if (isLoadMore) commit('PUSH_USER_ROOMS', rooms)
      else commit('SET_USER_ROOMS', rooms)

      if (data.meta?.pagination) commit('SET_USER_ROOMS_PAGINATION', data.meta.pagination)
    }

    return { data, error }
  },

  async fetchRoom({ commit }, id) {
    const { data, error } = await this.$appFetch({
      path: `rooms/${id}`,
      query: {
        locale: this.$i18n.locale
      }
    })

    if (data) {
      const room = roomTransformer(data.data)

      commit('SET_ROOM', room)

      commit('SET_QUESTIONS', {
        questions: room.questions
      })

      commit('SET_CHOICES', {
        choices: room.choices
      })

      commit('SET_ALPHABET_ITEMS', room.alphabet)

      commit('SET_GAME_TIME_LIMIT', room.gameTimeLimit)
    }

    return {
      data,
      error
    }
  },

  async fetchReviews({ commit }, { roomId }) {
    // populate[user][populate][...] — without nested populate the user
    // relation comes back with no diceBear/profilePhoto and PlayerAvatar
    // falls back to a generated, unrelated avatar.
    const params = new URLSearchParams({
      'filters[room][roomId][$eq]': roomId,
      'populate[user][populate][0]': 'diceBear',
      'populate[user][populate][1]': 'profilePhoto',
      sort: 'createdAt:desc'
    })

    const { data, error } = await this.$appFetch({
      path: `room-reviews?${params.toString()}`,
      method: 'GET'
    })

    return {
      data,
      error
    }
  },

  async fetchRoomScoresByUser({ commit }, { userId, page = 1, limit = 10, isLoadMore = false }) {
    const { data, error } = await this.$appFetch({
      path: 'room-scores',
      query: {
        'filters[user][id][$eq]': userId,
        'pagination[page]': page,
        'pagination[pageSize]': limit,
        populate: 'room',
        sort: 'createdAt:desc'
      }
    })

    if (data) {
      const list = data.data || []

      if (isLoadMore) commit('PUSH_USER_ROOM_SCORES', list)
      else commit('SET_USER_ROOM_SCORES', list)

      if (data.meta?.pagination) commit('SET_USER_ROOM_SCORES_PAGINATION', data.meta.pagination)
    }

    return { data, error }
  },

  async fetchReviewsByUser({ commit }, { userId, page = 1, limit = 10, isLoadMore = false }) {
    const { data, error } = await this.$appFetch({
      path: 'room-reviews',
      query: {
        'filters[user][id][$eq]': userId,
        'pagination[page]': page,
        'pagination[pageSize]': limit,
        populate: 'room',
        sort: 'createdAt:desc'
      }
    })

    if (data) {
      const list = data.data || []

      if (isLoadMore) commit('PUSH_USER_REVIEWS', list)
      else commit('SET_USER_REVIEWS', list)

      if (data.meta?.pagination) commit('SET_USER_REVIEWS_PAGINATION', data.meta.pagination)
    }

    return { data, error }
  },

  async postReview({ commit, state }, { roomDocumentId, form }) {
    const token = this.$auth.strategy.token.get()

    const transform = form => {
      return {
        room: roomDocumentId,
        rating: form.rating,
        content: form.comment,
        user: this.$auth.user?.id
      }
    }

    const { data, error } = await this.$appFetch({
      path: `room-reviews`,
      method: 'POST',
      data: {
        data: transform(form)
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async postStats({ commit, state }, params) {
    if (!this.$auth.loggedIn && !this.$auth.user) {
      return
    }

    const { roomDocumentId, stats } = params
    const token = this.$auth.strategy.token.get()

    const transformBody = model => {
      return {
        room: model.room,
        user: model.user,
        results: model.stats
      }
    }

    const { data, error } = await this.$appFetch({
      path: `room-scores`,
      method: 'POST',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: transformBody({
          room: roomDocumentId,
          user: this.$auth.user?.id,
          stats
        })
      },
      headers: {
        Authorization: `${token}`
      }
    })

    return {
      data,
      error
    }
  },

  async fetchScoreboard({ commit, state }, params) {
    const { isLoadMore = false, limit, roomId, page, sort, locale } = params

    const queryDefault = {
      perPage: 50,
      page: 1,
      sort: 'createdAt:desc',
      locale: this.$i18n.locale
    }

    const query = {
      'pagination[pageSize]': limit || queryDefault.perPage,
      'pagination[page]': page || queryDefault.page,
      'filters[room][roomId][$eq]': roomId,
      sort: sort || queryDefault.sort,
      populate: 'user',
      locale: locale || queryDefault.locale
    }

    const { data, error } = await this.$appFetch({
      path: `room-scores`,
      method: 'GET',
      query: query
    })

    if (data) {
      if (isLoadMore) {
        commit('PUSH_SCOREBOARD', scoreboardTransformer(data.data))
      } else {
        commit('SET_SCOREBOARD', scoreboardTransformer(data.data))
      }

      commit('SET_SCOREBOARD_PAGINATION', {
        pagination: data.meta.pagination,
        total: data.meta.pagination.total
      })
    }

    return {
      data,
      error
    }
  },

  async fetchTodaysQuiz({ commit, state }, params = {}) {
    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const query = {
      'filters[createdAt][$gte]': startOfDay.toISOString(),
      'filters[createdAt][$lt]': endOfDay.toISOString(),
      'filters[isPublic][$eq]': true,
      'sort[0]': 'viewCount:desc',
      'pagination[pageSize]': 1,
      locale: this.$i18n.locale
    }

    const { data, error } = await this.$appFetch({
      path: 'rooms',
      query: query
    })

    if (data && data.data && data.data.length > 0) {
      commit('SET_TODAYS_QUIZ', roomTransformer(data.data[0]))
    }

    return {
      data,
      error
    }
  },

  async increaseDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/creator/view-count`,
      method: 'POST'
    })

    return {
      data,
      error
    }
  },

  async fetchDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/creator/view-count`
    })

    if (data) {
      commit('SET_DAILY_PLAYING_COUNT', data.count)
    }

    return {
      data,
      error
    }
  }
}
