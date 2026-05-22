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
    profilePhotoEditor: {
      isOpen: false
    }
  }
})
