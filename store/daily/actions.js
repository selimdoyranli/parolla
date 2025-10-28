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
  }
}
