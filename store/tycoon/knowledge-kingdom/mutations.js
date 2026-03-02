export default {
  RESET_ECONOMY(state) {
    state.gold = 0
    state.goldPerSecond = 0
    state.ownedItems = {}
    state.economyVersion = 'v3'
  },

  SET_GOLD(state, gold) {
    state.gold = gold
  },

  SET_GOLD_PER_SECOND(state, gps) {
    state.goldPerSecond = gps
  },

  INCREMENT_TICK_COUNT(state) {
    state.tickCount++
  },

  ADD_GOLD(state, amount) {
    state.gold += amount
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
