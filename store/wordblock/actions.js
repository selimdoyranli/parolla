// The API stores the game locale as Strapi writes it ('tr-TR'), while $i18n.locale is 'tr'.
// $appFetch already maps the query param; the body has to be mapped here too.
const transformLocale = locale => (locale === 'tr' ? 'tr-TR' : locale)

export default {
  async fetchWord({ commit }, { charLength = 5 }) {
    const { data, error } = await this.$appFetch({
      path: `modes/wordblock/daily-word`,
      query: {
        charLength,
        locale: this.$i18n.locale
      }
    })

    if (data) {
      const transform = data => {
        return {
          word: data.data.word,
          source: data.data.source,
          date: data.data.date,
          charLength: data.data.charLength
        }
      }

      commit('SET_TARGET_WORD', { locale: this.$i18n.locale, charLength, word: transform(data).word })
    }

    return {
      data,
      error
    }
  },

  async increaseDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/wordblock/view-count`,
      method: 'POST',
      query: {
        locale: this.$i18n.locale
      }
    })

    return {
      data,
      error
    }
  },

  // Leaderboards are per board: period + character length + game locale. The locale rides
  // along in the query the same way it does for the daily word.
  async postStats({ commit }, { charLength, stats }) {
    const token = this.$auth.strategy.token.get()

    const { data, error } = await this.$appFetch({
      path: `wordblock-scores`,
      method: 'POST',
      query: {
        locale: this.$i18n.locale
      },
      data: {
        data: {
          user: this.$auth.user?.id,
          charLength,
          gameLocale: transformLocale(this.$i18n.locale),
          results: stats
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

  async fetchLeaderboard({ commit }, { period = 'season', charLength = 5, limit = 25, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `wordblock-scores/wordblock-leaderboard`,
      query: {
        period,
        charLength,
        locale: this.$i18n.locale,
        'pagination[pageSize]': limit,
        'pagination[page]': page
      }
    })

    if (data) {
      commit('SET_LEADERBOARD', {
        leaderboard: data.data,
        meta: data.meta
      })
    }

    return {
      data,
      error
    }
  },

  // Today's board for a single character length, used by the intro card
  async fetchTodaysLeaders({ commit }, { charLength = 5, limit = 10 }) {
    const { data, error } = await this.$appFetch({
      path: `wordblock-scores/wordblock-leaderboard`,
      query: {
        period: 'daily',
        charLength,
        locale: this.$i18n.locale,
        'pagination[pageSize]': limit,
        'pagination[page]': 1
      }
    })

    if (data) {
      commit('SET_TODAYS_LEADERS', {
        charLength,
        leaderboard: data.data,
        meta: data.meta
      })
    }

    return {
      data,
      error
    }
  },

  async fetchDailyPlayingCount({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/wordblock/view-count`,
      query: {
        locale: this.$i18n.locale
      }
    })

    if (data) {
      commit('SET_DAILY_PLAYING_COUNT', data.count)
    }

    return {
      data,
      error
    }
  },

  // The board is capped at the first N players, so a player outside that window has no
  // way to read their own standing from it. This resolves it in one request.
  async fetchUserRank({ commit }, { userId, period = 'season', charLength = 5 }) {
    const { data, error } = await this.$appFetch({
      path: `wordblock-scores/rank-of-user`,
      query: {
        userId,
        period,
        charLength,
        locale: this.$i18n.locale
      }
    })

    commit('SET_USER_RANK', data?.data ?? null)

    return {
      data,
      error
    }
  }
}
