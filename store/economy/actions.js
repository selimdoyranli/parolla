import { walletTransformer } from '@/transformers'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { getDrawSocket, isDrawSocketReady } from '@/composables/useDrawSocket'

const CACHE_KEY = 'parolla.cosmetics.v1'

const authHeaders = ctx => ({ Authorization: `${ctx.$auth.strategy.token.get()}` })

// only a response carrying a numeric HTTP status is definitive; axios network codes ('ERR_NETWORK') are strings
export const isDefinitiveResponse = error => !error || typeof error.code === 'number'

// ws re-fetches our own profile from Strapi and broadcasts it to the tour/draw room we are in
const notifyLiveRooms = tourWs => {
  const msg = JSON.stringify({ type: wsTypeEnum.PROFILE_REFRESH })

  if (tourWs && tourWs.readyState === 1) tourWs.send(msg)

  if (isDrawSocketReady()) getDrawSocket().send(msg)
}

export const newIdempotencyKey = () => {
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

  return uuid.replace(/-/g, '').slice(0, 32)
}

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY))
  } catch (e) {
    return null
  }
}

const writeCache = catalog => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...catalog, fetchedAt: Date.now() }))
  } catch (e) {
    // storage full/blocked: catalog still works from the store
  }
}

// Authenticated request; commits `balance` from the response into the wallet when present.
const authed = async (ctx, params) => {
  const { data, error } = await ctx.$appFetch({ ...params, headers: authHeaders(ctx) })

  if (data && typeof data.balance === 'number') ctx.commit('economy/SET_WALLET', { gold: data.balance })

  return { data, error }
}

export default {
  // Cached copy renders at once; every load revalidates with ?v= and the server answers `unchanged` when it matches
  async fetchCatalog({ commit }) {
    const cached = readCache()
    const hasCache = cached && Array.isArray(cached.items)

    if (hasCache) commit('SET_CATALOG', { version: cached.version, items: cached.items })

    const { data, error } = await this.$appFetch({ path: 'cosmetics/catalog', query: hasCache ? { v: cached.version } : {} })

    if (data && data.unchanged) return { data: cached, error: null }

    if (data && Array.isArray(data.items)) {
      const catalog = { version: data.version, items: data.items }

      commit('SET_CATALOG', catalog)
      writeCache(catalog)
    }

    return { data, error }
  },

  // Called once per game end. Logged in: keep the score response's `economy` for the end dialog
  // and refresh wallet/quests. Guest: ask what they would have earned.
  // Call right before the end dialog opens so the previous game's reward never flashes.
  gameStarting({ commit }, mode) {
    commit('SET_LAST_ECONOMY', null)
    commit('SET_GUEST_PREVIEW', null)
    commit('SET_PENDING_MODE', mode)
  },

  async gameEnded({ commit, dispatch }, params) {
    try {
      await dispatch('settleGame', params)
    } finally {
      commit('SET_PENDING_MODE', null)
    }
  },

  async settleGame({ commit, dispatch }, { mode, data, win, attempts }) {
    if (!this.$auth.loggedIn) {
      const query = { mode }

      if (win !== undefined) Object.assign(query, { win: win ? 1 : 0, attempts })

      const res = await this.$appFetch({ path: 'economy/guest-preview', query })

      if (res.data) commit('SET_GUEST_PREVIEW', { mode, gold: res.data.gold })

      return
    }

    if (!data) return

    if (data.economy) commit('SET_LAST_ECONOMY', { mode, ...data.economy })

    // the score POST's economy summary is enough for the end dialog: refresh in the background
    dispatch('fetchWallet')

    if (data.economy && data.economy.questsCompleted.length) dispatch('fetchQuests')
  },

  async fetchWallet({ commit }) {
    const { data, error } = await authed(this, { path: 'economy/me' })

    if (data) commit('SET_WALLET', walletTransformer(data))

    return { data, error }
  },

  async claimDaily({ commit }) {
    const { data, error } = await authed(this, { path: 'economy/daily/claim', method: 'POST' })

    if (data && data.status === 'claimed') commit('SET_WALLET', { canClaimDaily: false, dailyStreak: data.streak })

    return { data, error }
  },

  async fetchQuests({ commit }) {
    const { data, error } = await authed(this, { path: 'economy/quests' })

    if (data) commit('SET_QUESTS', data)

    return { data, error }
  },

  claimQuest(_, key) {
    return authed(this, { path: `economy/quests/${key}/claim`, method: 'POST' })
  },

  rerollQuest(_, key) {
    return authed(this, { path: `economy/quests/${key}/reroll`, method: 'POST' })
  },

  claimChest() {
    return authed(this, { path: 'economy/quests/weekly-chest/claim', method: 'POST' })
  },

  async fetchInventory({ commit }) {
    const { data, error } = await authed(this, { path: 'economy/inventory' })

    if (data) commit('SET_INVENTORY', data)

    return { data, error }
  },

  async saveLoadout({ commit, state }, loadout) {
    const { data, error } = await authed(this, { path: 'economy/loadout', method: 'PUT', data: { loadout } })

    if (data) {
      commit('SET_INVENTORY', { ...state.inventory, loadout: data.loadout })
      // header avatar and profile read the loadout from the auth user
      this.commit('auth/SET_USER', { ...this.$auth.user, loadout: data.loadout })
      notifyLiveRooms(this.state.app.ws)
    }

    return { data, error }
  },

  // callers may pass an idempotencyKey so a retry after an ambiguous network failure reuses it
  purchase(_, { itemKey, fromVitrin, idempotencyKey }) {
    return authed(this, {
      path: 'economy/shop/purchase',
      method: 'POST',
      data: { itemKey, fromVitrin, idempotencyKey: idempotencyKey || newIdempotencyKey() }
    })
  },

  purchaseSet(_, { series, idempotencyKey }) {
    return authed(this, {
      path: 'economy/shop/purchase-set',
      method: 'POST',
      data: { series, idempotencyKey: idempotencyKey || newIdempotencyKey() }
    })
  },

  async buyStreakFreeze({ commit }, idempotencyKey) {
    const result = await authed(this, {
      path: 'economy/shop/streak-freeze',
      method: 'POST',
      data: { idempotencyKey: idempotencyKey || newIdempotencyKey() }
    })

    if (result.data) commit('SET_WALLET', { streakFreezes: result.data.freezes })

    return result
  },

  fetchVitrin() {
    return this.$appFetch({ path: 'economy/shop/vitrin' })
  },

  async fetchAchievements({ commit }) {
    const { data, error } = await authed(this, { path: 'economy/achievements' })

    if (data) commit('SET_ACHIEVEMENTS', data)

    return { data, error }
  },

  fetchHistory(_, page = 1) {
    return authed(this, { path: 'economy/history', query: { page } })
  }
}
