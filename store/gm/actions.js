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

  // kind: 'tagged' | 'moderated'
  fetchAiRooms(_, { kind, page }) {
    return this.$appFetch({
      path: `moderation/ai-${kind}-rooms`,
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
