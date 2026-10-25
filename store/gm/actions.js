// GM moderation panel endpoints (parolla-strapi api/moderation, GM role only)
export default {
  fetchWordblockAnomalies(_, { date }) {
    return this.$appFetch({
      path: 'moderation/wordblock-anomalies',
      query: { date },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  fetchDailyAnomalies(_, { date, page }) {
    return this.$appFetch({
      path: 'moderation/daily-anomalies',
      query: { date, page },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  fetchAiSettings() {
    return this.$appFetch({
      path: 'moderation/ai-settings',
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  // Only `apiKeys` the GM edited are sent; the server keeps the others as they are
  updateAiSettings(_, data) {
    return this.$appFetch({
      path: 'moderation/ai-settings',
      method: 'PUT',
      data,
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  fetchAiQueue() {
    return this.$appFetch({
      path: 'moderation/ai-queue',
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  // kind: 'tagged' | 'moderated' | 'reported'
  fetchAiRooms(_, { kind, page }) {
    return this.$appFetch({
      path: `moderation/ai-${kind}-rooms`,
      query: { page },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  // Takes the room off the public list (isSystemRemovedFromPublic) with the GM's note
  // blockOwner also bans the room's owner (resolved on the server, anonymous rooms included)
  unlistRoom(_, { documentId, locale, note, blockOwner = false }) {
    return this.$appFetch({
      path: `moderation/rooms/${documentId}/unlist`,
      method: 'POST',
      data: { locale, note, blockOwner },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  dismissRoomAiFlag(_, { documentId, locale }) {
    return this.$appFetch({
      path: `moderation/rooms/${documentId}/dismiss-ai-flag`,
      method: 'POST',
      data: { locale },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  runCommand(_, { command }) {
    return this.$appFetch({
      path: 'moderation/commands',
      method: 'POST',
      data: { command },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  fetchFreeEvents() {
    return this.$appFetch({ path: 'moderation/free-events', headers: { Authorization: `${this.$auth.strategy.token.get()}` } })
  },

  // id set: edit, otherwise create
  saveFreeEvent(_, { id, data }) {
    return this.$appFetch({
      path: id ? `moderation/free-events/${id}` : 'moderation/free-events',
      method: id ? 'PUT' : 'POST',
      data,
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  deleteFreeEvent(_, id) {
    return this.$appFetch({
      path: `moderation/free-events/${id}`,
      method: 'DELETE',
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  fetchCommandLogs(_, { page }) {
    return this.$appFetch({
      path: 'moderation/commands/logs',
      query: { page },
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  },

  // action: 'block-user' | 'delete-daily-score' | 'delete-wordblock-scores'
  runAction(_, { action, data }) {
    return this.$appFetch({
      path: `moderation/${action}`,
      method: 'POST',
      data,
      headers: { Authorization: `${this.$auth.strategy.token.get()}` }
    })
  }
}
