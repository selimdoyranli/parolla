export default {
  async fetchQuestions({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/daily`
    })

    if (data) {
      commit('SET_QUESTIONS', {
        questions: data
      })
    }

    commit('SET_ALPHABET', {
      activeIndex: 0,
      items: data.flatMap(question => {
        return {
          letter: question.letter.name,
          isPassed: false,
          isWrong: false,
          isCorrect: false
        }
      })
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

    const { stats } = params
    const token = this.$auth.strategy.token.get()

    const transformBody = model => {
      return {
        user: model.user,
        results: model.stats
      }
    }

    const { data, error } = await this.$appFetch({
      path: `daily-scores`,
      method: 'POST',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: transformBody({
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

  async increaseDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/daily/view-count`,
      method: 'POST'
    })

    return {
      data,
      error
    }
  },

  async fetchDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/daily/view-count`
    })

    if (data) {
      commit('SET_DAILY_PLAYING_COUNT', data.count)
    }

    return {
      data,
      error
    }
  },

  async fetchDailyScores({ commit }, { limit = 10, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `daily-scores`,
      query: {
        'pagination[pageSize]': limit,
        'pagination[page]': page
      }
    })

    if (data) {
      commit('SET_DAILY_SCORES', {
        data: data.data,
        meta: data.meta
      })
    }

    return {
      data,
      error
    }
  },

  async fetchLeaderboard({ commit }, { period = 'season', limit = 10, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `daily-scores/daily-leaderboard`,
      query: {
        period,
        'pagination[pageSize]': limit,
        'pagination[page]': page
      }
    })

    if (data) {
      commit('SET_LEADERBOARD', data.data)
    }

    return {
      data,
      error
    }
  }
}
