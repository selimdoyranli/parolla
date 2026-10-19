export default {
  SET_WALLET(state, wallet) {
    state.wallet = { ...state.wallet, ...wallet }
  },
  SET_CATALOG(state, catalog) {
    state.catalog = catalog
  },
  SET_QUESTS(state, quests) {
    state.quests = quests
  },
  SET_INVENTORY(state, inventory) {
    state.inventory = inventory
  },
  SET_ACHIEVEMENTS(state, achievements) {
    state.achievements = achievements
  }
}
