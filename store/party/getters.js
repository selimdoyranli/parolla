export default {
  isHost: s => !!s.room && !!s.myId && s.room.hostId === s.myId,
  me: s => ((s.room && s.room.players) || []).find(p => p.id === s.myId) || null,
  players: s => (s.room && s.room.players) || [],
  queue: s => (s.room && s.room.queue) || [],
  settings: s => (s.room && s.room.settings) || {},
  game: s => (s.room && s.room.game) || null,
  // in-game chat on (the host's setting; the lobby always chats): the game screen gets the header chat button
  gameChat: s => {
    const r = s.room

    return !!r && !!r.game && !!r.settings && !!r.settings.chat && !s.cancelled
  },
  chatUnread: s => Math.max(0, s.chat.length - s.chatSeen),
  isPresenter: s => !!s.room && !!s.room.game && !!s.myId && s.room.game.presenterId === s.myId
}
