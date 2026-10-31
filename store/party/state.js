export default () => ({
  status: 'idle',
  myId: null,
  room: null,
  round: null, // party_round_start payload + receivedAt (reconnect snapshot carries `me`)
  answered: { answered: 0, total: 0 },
  votes: null,
  myAnswer: null,
  retry: null,
  roundEnd: null,
  final: null,
  cancelled: null,
  closedReason: null,
  chat: [],
  emojis: [],
  emojiCooldown: null, // { until, ms }: the server's emoji cooldown, drawn as a ring on the emoji buttons
  chatDialogOpen: false, // in-game chat (AppHeader button), like tour's online dialog
  chatSeen: 0, // chat length when last read in that dialog
  error: null
})
