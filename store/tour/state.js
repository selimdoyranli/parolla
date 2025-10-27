export default () => ({
  tourScoreOfUser: {
    daily: {
      score: 0,
      rank: 0
    },
    weekly: {
      score: 0,
      rank: 0
    },
    monthly: {
      score: 0,
      rank: 0
    },
    season: {
      score: 0,
      rank: 0
    },
    total: 0
  },
  tour: {
    question: null,
    countdown: {
      percentage: 0,
      seconds: 30
    },
    maxLives: 3,
    waitingNextSeconds: 10,
    isTimeUp: false,
    isPlayerFinishedTheTour: false,
    recentAnswers: [],
    roundScores: [],
    popover: {
      maxLives: {
        isOpen: false
      }
    }
  },
  userList: {
    players: [],
    totalPlayers: 0,
    totalViewers: 0
  },
  leaderboard: [],
  chat: {
    messages: []
  },
  dialog: {
    tourModeOnline: {
      isOpen: false
    }
  }
})
