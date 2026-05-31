export default () => ({
  status: 'idle',
  channel: 'draw',
  publicRooms: [], // legacy; kept for backward compat
  communityRooms: [], // new — drives Topluluk Odaları tab
  systemRooms: [], // new — drives Resmi Odalar tab
  lobbySubscribed: false,
  roomKind: null, // drawRoomKindEnum value | null
  room: null,
  players: [],
  hostId: null,
  myId: null,
  roundIndex: 0,
  roundCount: 0,
  drawerId: null,
  drawerName: null,
  nextDrawerId: null,
  nextDrawerName: null,
  nextRoundEndsAt: 0,
  currentWord: null,
  maskedWord: null,
  category: null,
  durationMs: 0,
  remainingMs: 0,
  pickEndsAt: 0,
  strokes: [],
  chat: [],
  wordOptions: null,
  pickTimeoutMs: 0,
  iAmDrawer: false,
  iAmHost: false,
  iGuessedCorrectly: false,
  correctGuesserIds: [],
  lastRoundResult: null,
  finalScores: null,
  finalNextRoundInMs: 0, // new — system-room cycle timer
  waitingPresent: 0, // new — current player count when state=waiting
  waitingRequired: 2, // new
  // Set when the server pushes DRAW_ROOM_CLOSED (community host left,
  // or room emptied). Drives the DrawRoom canvas overlay that offers
  // a "Lobiye Dön" button. Cleared by LEAVE_ROOM on navigation.
  roomClosedReason: null,
  lastError: null
})
