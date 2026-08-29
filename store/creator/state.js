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
    total: null,
    // Where the signed-in player stands in this room, for the row pinned above the list
    userRank: null
  },
  todaysQuiz: {},
  // Cover art showcase on the home block. Kept apart from room.list so it cannot
  // clobber the rooms listing page's state.
  randomRooms: [],
  dailyPlayingCount: 0,
  userReviews: {
    list: [],
    pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 }
  },
  userRoomScores: {
    list: [],
    pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 }
  },
  userRooms: {
    list: [],
    pagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 }
  }
})
