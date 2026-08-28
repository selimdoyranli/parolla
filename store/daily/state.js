import { GAME_TIME_LIMIT } from '@/system/constant'

export default () => ({
  isGameOver: false,
  currentDate: null,
  alphabet: {
    activeIndex: 0,
    items: []
  },
  questions: [],
  countdown: {
    time: GAME_TIME_LIMIT,
    remainTime: {}
  },
  dialog: {
    stats: {
      isOpen: false
    }
  },
  dailyPlayingCount: 0,
  dailyScore: {
    items: [],
    meta: {}
  },
  leaderboard: {
    items: [],
    meta: {}
  },
  // Where the signed-in player stands, for the row the leaderboard pins above the list
  userRank: null
})
