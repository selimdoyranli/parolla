import { userTransformer } from '@/transformers'

export default {
  SET_TOUR_SCORE_OF_USER(state, tourScoreOfUser) {
    state.tourScoreOfUser = tourScoreOfUser
  },

  SET_TOUR(state, tour) {
    state.tour = {
      ...state.tour,
      ...tour
    }
  },

  CLEAR_FOR_NEW_ROUND(state) {
    state.tour = {
      ...state.tour,
      isTimeUp: false,
      isPlayerFinishedTheTour: false,
      countdown: {
        seconds: 30,
        percentage: 0
      },
      maxLives: 3
    }
  },

  SET_USER_LIST(state, userList) {
    const mappedPlayers = userList.players.map(player => ({
      id: player.id,
      username: player.name,
      diceBear: player.diceBear,
      profilePhoto: player.profilePhoto,
      avatarSource: player.avatarSource,
      loadout: player.loadout,
      avatarUrl: player.avatarUrl,
      lives: player.lives
    }))

    state.userList.players = mappedPlayers
    state.userList.totalPlayers = userList.totalCount
    state.userList.totalViewers = userList.totalViewers
  },

  // Live profile change (e.g. loadout) of a player in the room: patch every list showing them
  APPLY_PLAYER_UPDATE(state, player) {
    const fields = {
      diceBear: player.diceBear,
      profilePhoto: player.profilePhoto,
      avatarSource: player.avatarSource,
      loadout: player.loadout,
      role: player.role
    }
    const isSame = id => String(id) === String(player.id)
    const patch = item => (isSame(item.id) ? { ...item, ...fields, username: player.name } : item)

    state.userList.players = state.userList.players.map(patch)
    state.tour = {
      ...state.tour,
      recentAnswers: (state.tour.recentAnswers || []).map(patch),
      roundScores: (state.tour.roundScores || []).map(patch)
    }
    state.chat.messages = (state.chat.messages || []).map(message =>
      !message.isSystem && isSame(message.playerId) ? { ...message, ...fields, playerName: player.name } : message
    )
  },

  SET_LEADERBOARD(state, { leaderboard, meta }) {
    const mappedLeaderboard = leaderboard => {
      return leaderboard?.map(scorer => ({
        ...userTransformer(scorer.user),
        score: scorer.score
      }))
    }

    state.leaderboard.items = mappedLeaderboard(leaderboard)
    state.leaderboard.meta = meta
  },

  SET_USER_RANK(state, userRank) {
    state.userRank = userRank
  },

  SET_CHAT_MESSAGES(state, messages) {
    state.chat.messages = messages
  },

  SET_IS_CHAT_FOCUSED(state, isFocused) {
    state.chat.isFocused = isFocused
  },

  SET_IS_OPEN_TOUR_MODE_ONLINE_DIALOG(state, isOpen) {
    state.dialog.tourModeOnline.isOpen = isOpen
  }
}
