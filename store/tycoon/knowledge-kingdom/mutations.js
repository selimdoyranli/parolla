export default {
  SET_GOLD(state, gold) {
    state.gold = gold
  },

  SET_TOTAL_GOLD(state, totalGold) {
    state.totalGold = totalGold
  },

  SET_GOLD_PER_SECOND(state, gps) {
    state.goldPerSecond = gps
  },

  ADD_GOLD(state, amount) {
    state.gold += amount
    state.totalGold += amount
  },

  SUBTRACT_GOLD(state, amount) {
    state.gold -= amount
  },

  SET_ITEMS(state, items) {
    state.items = items
  },

  BUY_ITEM(state, itemId) {
    const current = state.ownedItems[itemId] || 0

    state.ownedItems = {
      ...state.ownedItems,
      [itemId]: current + 1
    }
  },

  SET_OWNED_ITEMS(state, ownedItems) {
    state.ownedItems = ownedItems
  },

  SET_IS_LOADED(state, isLoaded) {
    state.isLoaded = isLoaded
  }
}
