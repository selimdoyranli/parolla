export default {
  isLobby: s => !s.room || s.room.state === 'lobby',
  isPicking: s => s.room && s.room.state === 'picking',
  isDrawing: s => s.room && s.room.state === 'drawing',
  isRoundEnd: s => s.room && s.room.state === 'roundEnd',
  isGameEnd: s => s.room && s.room.state === 'gameEnd',
  isWaiting: s => s.room && s.room.state === 'waiting',
  isFinalScoreboard: s => s.room && s.room.state === 'finalScoreboard',
  scoreboard: s => [...(s.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0))
}
