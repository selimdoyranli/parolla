export default {
  async loadItems({ commit, state }) {
    if (state.economyVersion !== 'v6') {
      commit('RESET_ECONOMY')
    }

    if (state.isLoaded) return

    try {
      const response = await fetch('/data/tycoon/knowledge-kingdom.json')
      const data = await response.json()

      commit('SET_ITEMS', data.items)
      commit('SET_IS_LOADED', true)

      // Recalculate GPS from persisted owned items
      let totalGPS = 0

      for (const [itemId, count] of Object.entries(state.ownedItems)) {
        const item = data.items.find(i => i.id === parseInt(itemId))

        if (item) {
          const tickSeconds = item.tickSeconds || 1
          totalGPS += (item.goldPerSecond / tickSeconds) * count
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

    const ownedCount = state.ownedItems[itemId] || 0
    const base = item.baseCost !== undefined ? item.baseCost : item.cost
    const dynamicCost = base * Math.pow(1.15, ownedCount)
    const finalCost = dynamicCost < 100 ? Math.round(dynamicCost * 10) / 10 : Math.floor(dynamicCost)

    // Epsilon for floating point: 0.1*10 can be 0.9999999999999999
    const goldRounded = Math.round(state.gold * 100) / 100
    const costRounded = Math.round(finalCost * 100) / 100

    if (goldRounded < costRounded) return false

    commit('SUBTRACT_GOLD', finalCost)
    commit('BUY_ITEM', itemId)

    // Recalculate total GPS
    let totalGPS = 0

    for (const [id, count] of Object.entries(state.ownedItems)) {
      const ownedItem = state.items.find(i => i.id === parseInt(id))

      if (ownedItem) {
        const tickSeconds = ownedItem.tickSeconds || 1
        totalGPS += (ownedItem.goldPerSecond / tickSeconds) * count
      }
    }

    commit('SET_GOLD_PER_SECOND', totalGPS)

    return true
  },

  tick({ commit, state }) {
    commit('INCREMENT_TICK_COUNT')

    // Calculate the actual burst gold to add this specific tick based on modulo timers
    let goldToDepositThisTick = 0

    if (Object.keys(state.ownedItems).length > 0) {
      for (const [id, count] of Object.entries(state.ownedItems)) {
        const ownedItem = state.items.find(i => i.id === parseInt(id))

        if (ownedItem) {
          const tickSeconds = ownedItem.tickSeconds || 1

          // If the timer sequence hits for this item's interval length
          if (state.tickCount % tickSeconds === 0) {
            goldToDepositThisTick += ownedItem.goldPerSecond * count
          }
        }
      }
    }

    if (goldToDepositThisTick > 0) {
      commit('ADD_GOLD', goldToDepositThisTick)
    }
  },

  tapGold({ commit, getters }) {
    commit('ADD_GOLD', getters.goldPerClick)
  }
}
