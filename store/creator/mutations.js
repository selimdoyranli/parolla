import { GAME_TIME_LIMIT } from '@/system/constant'

export default {
  SET_ROOMS_SORT(state, sort) {
    state.room.sort = sort
  },

  SET_ROOMS(state, rooms) {
    state.room.list = rooms
  },

  PUSH_ROOMS(state, rooms) {
    state.room.list.push(...rooms)
  },

  SET_PAGINATION(state, pagination) {
    state.room.pagination = {
      ...pagination
    }
  },

  SET_ROOM_TOTAL(state, total) {
    state.room.total = total
  },

  SET_ROOM(state, room) {
    state.room.room = room
  },

  INCREMENT_ROOM_REVIEW_COUNT(state) {
    state.room.room.reviewCount += 1
  },

  SET_CURRENT_DATE(state, date) {
    state.currentDate = date
  },

  SET_IS_GAME_OVER(state, { isGameOver }) {
    state.isGameOver = isGameOver
  },

  SET_QUESTIONS(state, { questions }) {
    state.questions = questions
  },

  SET_ALPHABET_ITEMS(state, items) {
    const alphabetItems = items.map((item, index) => {
      return {
        index,
        letter: item,
        isPassed: false,
        isWrong: false,
        isCorrect: false
      }
    })

    state.alphabet.items = alphabetItems
  },

  SET_ALPHABET_ACTIVE_INDEX(state, index) {
    state.alphabet.activeIndex = index
  },

  UPDATE_COUNTDOWN_REMAIN_TIME(state, remainTime) {
    state.countdown.remainTime = remainTime
  },

  UPDATE_COUNTDOWN_TIMER(state, ms) {
    state.countdown.time = ms
  },

  RESET_COUNTDOWN_TIMER(state) {
    state.countdown.time = GAME_TIME_LIMIT
  },

  RESET_ALPHABET(state) {
    state.alphabet.activeIndex = 0

    state.alphabet.items.forEach((item, index) => {
      item.index = index
      item.isPassed = false
      item.isWrong = false
      item.isCorrect = false
    })
  },

  SET_IS_OPEN_STATS_DIALOG(state, isOpen) {
    state.dialog.stats.isOpen = isOpen
  },

  SET_SCOREBOARD(state, scoreboard) {
    state.scoreboard.list = scoreboard
  },

  PUSH_SCOREBOARD(state, scoreboard) {
    state.scoreboard.list.push(...scoreboard)
  },

  SET_SCOREBOARD_PAGINATION(state, { pagination, total }) {
    state.scoreboard.pagination = {
      cursor: pagination.next_page_url?.split('cursor=')[1] || null,
      limit: Number(pagination.per_page)
    }

    state.scoreboard.total = Number(total)
  },

  SET_TODAYS_SOLVED_TOTAL_QUIZ(state, todaysSolvedTotalQuiz) {
    state.todaysSolvedTotalQuiz = {
      items: todaysSolvedTotalQuiz.data,
      meta: todaysSolvedTotalQuiz.meta
    }
  },

  SET_TODAYS_QUIZ(state, todaysQuiz) {
    state.todaysQuiz = todaysQuiz
  }
}
