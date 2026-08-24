import { resolveGame } from './game'

export default {
  targetWord:
    state =>
    ({ locale, charLength }) => {
      return resolveGame(state, locale, charLength).targetWord
    },

  isGameOver:
    state =>
    ({ locale, charLength }) => {
      return resolveGame(state, locale, charLength).isGameOver
    },

  currentDate:
    state =>
    ({ locale, charLength }) => {
      return resolveGame(state, locale, charLength).currentDate
    },

  result:
    state =>
    ({ locale, charLength }) => {
      return resolveGame(state, locale, charLength).result
    },

  dialog:
    state =>
    ({ locale, charLength }) => {
      return resolveGame(state, locale, charLength).dialog
    },

  dailyPlayingCount(state) {
    return state.dailyPlayingCount
  },

  isActiveKeyboard(state) {
    return state.isActiveKeyboard
  },

  leaderboard(state) {
    return state.leaderboard
  },

  todaysLeaders: state => charLength => {
    return state.todaysLeaders[charLength] || { items: [], meta: {} }
  }
}
