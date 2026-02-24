import { GAME_TIME_LIMIT } from '@/system/constant'

export default () => ({
  room: {
    list: [],
    pagination: {},
    total: null,
    sort: 'recently',
    room: {},
    quizType: 'qa' // 'qa' | 'choices'
  },
  isGameOver: false,
  alphabet: {
    activeIndex: 0,
    items: []
  },
  questions: [],
  choices: [],
  countdown: {
    time: GAME_TIME_LIMIT,
    remainTime: {}
  },
  dialog: {
    stats: {
      isOpen: false
    }
  },
  scoreboard: {
    list: [],
    pagination: {},
    total: null
  },
  todaysQuiz: {},
  dailyPlayingCount: 0
})
