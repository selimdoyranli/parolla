import { wsTypeEnum } from '@/enums'

export default {
  async listenWs({ commit, dispatch }, { ws }) {
    ws.onmessage = data => {
      const parsedData = JSON.parse(data.data)
      const { type, players, totalCount, viewerCount, chatHistory, question } = parsedData

      if (type === wsTypeEnum.TOUR_QUESTION) {
        commit('SET_TOUR', {
          question: {
            letter: question.letter,
            question: question.question
          }
        })
      }

      if (type === wsTypeEnum.CONNECTED) {
        commit('SET_CHAT_MESSAGES', chatHistory)
      }

      if (type === wsTypeEnum.TOUR_USER_LIST) {
        commit('SET_USER_LIST', { players, totalCount, totalViewers: viewerCount })
      }

      dispatch('emitWebSocketEvent', { type, data: parsedData })
    }
  },

  emitWebSocketEvent({ commit }, { type, data }) {
    window.dispatchEvent(
      new CustomEvent('ws-event', {
        detail: { type, data }
      })
    )
  },

  async fetchLeaderboard({ commit }, { period = 'season', limit = 10, page = 1 }) {
    const { data, error } = await this.$appFetch({
      path: `tour-scores/tour-leaderboard`,
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
  },

  async fetchTotalTourScoreOfUser({ commit }, { id, username }) {
    const { data, error } = await this.$appFetch({
      path: `tour-scores/total-tour-score-of-user`,
      query: {
        id,
        username
      }
    })

    return {
      data,
      error
    }
  },

  async fetchTourScoreOfUser({ commit }, { id, username }) {
    const { data, error } = await this.$appFetch({
      path: `tour-scores/tour-score-of-user`,
      query: {
        id,
        username
      }
    })

    if (data) {
      commit('SET_TOUR_SCORE_OF_USER', data.data)
    }

    return {
      data,
      error
    }
  }
}
