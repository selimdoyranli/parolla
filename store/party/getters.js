export default {
  isHost: s => !!s.room && !!s.myId && s.room.hostId === s.myId,
  me: s => ((s.room && s.room.players) || []).find(p => p.id === s.myId) || null,
  players: s => (s.room && s.room.players) || [],
  queue: s => (s.room && s.room.queue) || [],
  settings: s => (s.room && s.room.settings) || {},
  game: s => (s.room && s.room.game) || null,
  isPresenter: s => !!s.room && !!s.room.game && !!s.myId && s.room.game.presenterId === s.myId
}
