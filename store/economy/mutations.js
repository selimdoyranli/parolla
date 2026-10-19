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
  SET_LAST_ECONOMY(state, lastEconomy) {
    state.lastEconomy = lastEconomy
  },
  SET_GUEST_PREVIEW(state, guestPreview) {
    state.guestPreview = guestPreview
  },
  SET_PENDING_MODE(state, pendingMode) {
    state.pendingMode = pendingMode
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
    state.lastEconomy = null
    state.guestPreview = null
    state.pendingMode = null
    state.dialog.quests.isOpen = false
  }
}
