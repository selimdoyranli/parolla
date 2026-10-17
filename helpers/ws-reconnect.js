// Close codes parolla-ws uses when a player must NOT be auto-reconnected (see its connectionHandler)
export const WS_CLOSE_SERVICE_RESTART = 1012
export const WS_CLOSE_IDLE = 4002
export const WS_CLOSE_VOTE_KICKED = 4003
export const WS_CLOSE_GM_KICKED = 4004

// Exponential backoff capped at 10s; the jitter spreads out the reconnect burst after a deploy
export const reconnectDelay = attempt => Math.min(1000 * 2 ** attempt, 10000) * (0.5 + Math.random() / 2)
