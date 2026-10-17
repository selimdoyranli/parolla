export default () => ({
  id: null,
  username: '',
  player: {},
  playerStats: {
    rooms: 0,
    scores: 0,
    reviews: 0
  },
  dialog: {
    player: {
      isOpen: false
    },
    avatarEditor: {
      isOpen: false
    },
    // "More" menu for a player in a live room; context ('tour' | 'draw') picks the socket for vote kick
    playerActions: {
      isOpen: false,
      player: null,
      context: null
    }
  }
})
