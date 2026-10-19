import defaultState from './state'

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
  },
  SET_IS_OPEN_QUESTS_DIALOG(state, isOpen) {
    state.dialog.quests.isOpen = isOpen
  },
  RESET(state) {
    const fresh = defaultState()

    state.wallet = fresh.wallet
    state.quests = null
    state.inventory = null
    state.achievements = null
    state.dialog.quests.isOpen = false
  }
}
