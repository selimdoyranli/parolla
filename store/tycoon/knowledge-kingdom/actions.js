export default {
  async loadItems({ commit, state }) {
    if (state.isLoaded) return

    try {
      const response = await fetch('/data/word_idle_tycoon_items.json')
      const data = await response.json()

      commit('SET_ITEMS', data.items)
      commit('SET_IS_LOADED', true)

      // Recalculate GPS from persisted owned items
      let totalGPS = 0

      for (const [itemId, count] of Object.entries(state.ownedItems)) {
        const item = data.items.find(i => i.id === parseInt(itemId))

        if (item) {
          totalGPS += item.goldPerSecond * count
        }
      }

      commit('SET_GOLD_PER_SECOND', totalGPS)
    } catch (error) {
      console.error('Failed to load items:', error)
    }
  },

  buyItem({ commit, state }, itemId) {
    const item = state.items.find(i => i.id === itemId)

    if (!item) return false

    if (state.gold < item.cost) return false

    commit('SUBTRACT_GOLD', item.cost)
    commit('BUY_ITEM', itemId)

    // Recalculate total GPS
    let totalGPS = 0

    for (const [id, count] of Object.entries(state.ownedItems)) {
      const ownedItem = state.items.find(i => i.id === parseInt(id))

      if (ownedItem) {
        totalGPS += ownedItem.goldPerSecond * count
      }
    }

    commit('SET_GOLD_PER_SECOND', totalGPS)

    return true
  },

  tick({ commit, state }) {
    if (state.goldPerSecond > 0) {
      commit('ADD_GOLD', state.goldPerSecond)
    }
  },

  tapGold({ commit, state }) {
    commit('ADD_GOLD', state.goldPerClick)
  }
}
