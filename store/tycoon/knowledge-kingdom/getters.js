export default {
  gold(state) {
    return state.gold
  },

  goldPerSecond(state) {
    return state.goldPerSecond
  },

  goldPerClick(state) {
    // Tap power scales to 0.2% of passive GPS, minimum 1 — slower progression
    return Math.max(1, Math.floor(state.goldPerSecond * 0.002))
  },

  itemCost: state => id => {
    const item = state.items.find(i => i.id === id)

    if (!item) return 0

    const ownedCount = state.ownedItems[id] || 0
    const base = item.baseCost !== undefined ? item.baseCost : item.cost

    // 1.15 multiplier — repeat purchases cost more, slows leveling
    return Math.floor(base * Math.pow(1.15, ownedCount))
  },

  ownedItems(state) {
    return state.ownedItems
  },

  items(state) {
    return state.items
  },

  isLoaded(state) {
    return state.isLoaded
  }
}
