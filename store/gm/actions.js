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
