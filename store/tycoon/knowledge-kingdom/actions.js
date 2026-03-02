import { getMilestoneMultiplier } from './getters'

function computeTotalGPS(ownedItems, items) {
  let totalGPS = 0

  for (const [itemId, count] of Object.entries(ownedItems)) {
    const item = items.find(i => i.id === parseInt(itemId))

    if (item) {
      const tickSeconds = item.tickSeconds || 1
      totalGPS += (item.goldPerSecond / tickSeconds) * count * getMilestoneMultiplier(count)
    }
  }

  return totalGPS
}

export default {
  async loadItems({ commit, state }) {
    if (state.economyVersion !== 'v23') {
      commit('RESET_ECONOMY')
    }

    if (state.isLoaded) return

    try {
      const response = await fetch('/data/tycoon/knowledge-kingdom.json')
      const data = await response.json()

      commit('SET_ITEMS', data.items)
      commit('SET_IS_LOADED', true)

      const totalGPS = computeTotalGPS(state.ownedItems, data.items)
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

    const totalGPS = computeTotalGPS(state.ownedItems, state.items)
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

          if (state.tickCount % tickSeconds === 0) {
            goldToDepositThisTick += ownedItem.goldPerSecond * count * getMilestoneMultiplier(count)
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
  },

  debugCheat({ commit }) {
    commit('ADD_GOLD', 9999e15) // 9999Q
    commit('SET_DEBUG_UNLOCK_ALL', true)
  }
}
