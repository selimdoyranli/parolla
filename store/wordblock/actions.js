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

      commit('SET_TARGET_WORD', { charLength, word: transform(data).word })
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
  }
}
