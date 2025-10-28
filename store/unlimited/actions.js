export default {
  async fetchQuestions({ commit }) {
    const { data, error } = await this.$appFetch({
      path: `modes/unlimited`
    })

    if (data) {
      commit('SET_QUESTIONS', {
        questions: data
      })

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
    }

    return {
      data,
      error
    }
  }
}
