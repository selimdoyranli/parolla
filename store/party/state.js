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
  error: null
})
