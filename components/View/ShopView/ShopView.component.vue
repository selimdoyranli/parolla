<template lang="pug">
.shop-view
  h1.shop-view__title {{ $t('economy.shop.title') }}

  // Streak freeze
  .shop-view__freeze
    .shop-view__freeze-body
      b {{ $t('economy.shop.freeze.title') }}
      span {{ $t('economy.shop.freeze.desc') }}
      span(v-if="loggedIn") {{ $t('economy.shop.freeze.owned', { count: freezes, max: MAX_FREEZES }) }}
    Button(type="primary" size="small" :loading="freezeBusy" :disabled="loggedIn && freezes >= MAX_FREEZES" @click="buyFreeze") {{ freezeText }}

  // Vitrin
  template(v-if="vitrinCards.length")
    h2.shop-view__heading {{ $t('economy.shop.vitrin') }}
    .shop-view__grid
      CosmeticCard(
        v-for="c in vitrinCards"
        :key="`v-${c.item.key}`"
        :variants="[c.item]"
        :vitrin-price="c.price"
        :owned-keys="ownedSet"
        :viewer="viewer"
        :logged-in="loggedIn"
        @buy="openItem"
      )

  Tabs.shop-view__tabs(v-model="tabIndex" line-width="24px" :ellipsis="false" :swipeable="false")
    Tab(v-for="t in TABS" :key="t" :title="$t(`economy.shop.categories.${t}`)")

  // Only the first few series are rendered; "more" reveals the rest (445+ cards at once is heavy on mobile)
  section.shop-view__series(v-for="g in visibleGroups" :key="`${tab}-${g.series}`")
    header.shop-view__series-head
      h3 {{ g.name }}
      Button(v-if="setPrices[g.series]" type="primary" size="small" plain @click="openSet(g)") {{ setLabel(g) }}
    .shop-view__grid
      CosmeticCard(
        v-for="e in g.entries"
        :key="e[0].key"
        :variants="e"
        :owned-keys="ownedSet"
        :viewer="viewer"
        :logged-in="loggedIn"
        @buy="openItem"
      )

  Button.shop-view__more(v-if="groups.length > visibleCount" block plain @click="visibleCount += 4") {{ $t('economy.shop.more') }}

  LazyPurchaseDialog(:is-open="dialog.isOpen" :target="dialog.target" @closed="dialog.isOpen = false" @purchased="loadOwned")
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, onMounted, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Tabs, Tab, Dialog, Notify } from 'vant'
import { newIdempotencyKey, isDefinitiveResponse } from '@/store/economy/actions'

const TABS = [
  'all',
  'avatar_frame',
  'avatar_decoration',
  'nameplate',
  'profile_effect',
  'profile_frame',
  'profile_cover',
  'name_color',
  'title'
]
const MAX_FREEZES = 2
const FREEZE_PRICE = 200

export default defineComponent({
  components: { Button, Tabs, Tab },
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const loggedIn = computed(() => $auth.loggedIn)
    const viewer = computed(() => ($auth.loggedIn ? $auth.user : null))
    const freezes = computed(() => store.state.economy.wallet.streakFreezes)

    const tabIndex = ref(0)
    const tab = computed(() => TABS[tabIndex.value])
    const visibleCount = ref(3)

    watch(tabIndex, () => (visibleCount.value = 3))

    const vitrin = ref(null)
    const dialog = reactive({ isOpen: false, target: null })
    const freezeBusy = ref(false)
    let freezeKey = null

    // season and achievement items (price null) are never listed
    const forSale = computed(() => store.state.economy.catalog.items.filter(i => i.price != null && i.rarity !== 'sezon'))
    const catalogMap = computed(() => store.getters['economy/catalogMap'])
    const ownedSet = computed(() => new Set(((store.state.economy.inventory || {}).owned || []).map(o => o.itemKey)))

    const variantsOf = computed(() => {
      const map = {}

      for (const i of forSale.value) if (i.variantOf) (map[i.variantOf] = map[i.variantOf] || []).push(i)

      return map
    })

    const bases = computed(() => forSale.value.filter(i => !i.variantOf))

    // set price: 75% of the not-owned base items, rounded to 100 (server is authoritative)
    const setPrices = computed(() => {
      const sums = {}

      for (const i of bases.value) {
        if (ownedSet.value.has(i.key)) continue

        const s = (sums[i.series] = sums[i.series] || { full: 0, count: 0 })

        s.full += i.price
        s.count++
      }

      return Object.fromEntries(
        Object.entries(sums).map(([k, s]) => [k, { count: s.count, price: Math.round((s.full * 0.75) / 100) * 100 }])
      )
    })

    const groups = computed(() => {
      const bySeries = new Map()

      for (const i of bases.value) {
        if (tab.value !== 'all' && i.category !== tab.value) continue

        if (!bySeries.has(i.series)) bySeries.set(i.series, { series: i.series, name: i.seriesName, entries: [] })

        bySeries.get(i.series).entries.push([i, ...(variantsOf.value[i.key] || [])])
      }

      return [...bySeries.values()]
    })

    const visibleGroups = computed(() => groups.value.slice(0, visibleCount.value))

    const vitrinCards = computed(() =>
      ((vitrin.value && vitrin.value.items) || []).map(v => ({ item: catalogMap.value[v.key], price: v.price })).filter(c => c.item)
    )

    const toast = (message, ok) =>
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
        duration: 3000
      })

    const requireLogin = () => {
      if (loggedIn.value) return false

      store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

      return true
    }

    const openItem = ({ item, price, fromVitrin }) => {
      if (requireLogin()) return

      dialog.target = { item, price, fromVitrin, original: fromVitrin ? item.price : null }
      dialog.isOpen = true
    }

    const openSet = g => {
      if (requireLogin()) return

      dialog.target = { series: g.series, name: g.name, count: setPrices.value[g.series].count, price: setPrices.value[g.series].price }
      dialog.isOpen = true
    }

    const freezeText = computed(() =>
      loggedIn.value ? i18n.t('economy.shop.freeze.buy', { price: FREEZE_PRICE }) : i18n.t('economy.shop.loginToBuy')
    )

    const buyFreeze = async () => {
      if (requireLogin() || freezeBusy.value) return

      freezeBusy.value = true

      try {
        await Dialog.confirm({
          message: i18n.t('economy.shop.freeze.confirm', { price: FREEZE_PRICE }),
          confirmButtonText: i18n.t('economy.shop.confirm'),
          cancelButtonText: i18n.t('general.cancel')
        })
      } catch (e) {
        freezeBusy.value = false

        return
      }

      try {
        freezeKey = freezeKey || newIdempotencyKey()

        const { error } = await store.dispatch('economy/buyStreakFreeze', freezeKey)

        if (isDefinitiveResponse(error)) freezeKey = null

        const code = error && error.details && error.details.code
        const key = `economy.errors.${code}`

        if (error) toast(i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic'), false)
        else toast(i18n.t('economy.shop.freeze.bought'), true)
      } finally {
        freezeBusy.value = false
      }
    }

    const setLabel = g => i18n.t('economy.shop.buySet', { price: setPrices.value[g.series].price })

    const loadOwned = () => (loggedIn.value ? store.dispatch('economy/fetchInventory') : null)

    watch(loggedIn, value => {
      if (value) {
        loadOwned()
        store.dispatch('economy/fetchWallet')
      }
    })

    onMounted(async () => {
      loadOwned()

      const { data } = await store.dispatch('economy/fetchVitrin')

      vitrin.value = data
    })

    return {
      TABS,
      MAX_FREEZES,
      loggedIn,
      viewer,
      freezes,
      tabIndex,
      tab,
      visibleCount,
      dialog,
      freezeBusy,
      freezeText,
      ownedSet,
      setPrices,
      groups,
      visibleGroups,
      vitrinCards,
      openItem,
      openSet,
      setLabel,
      buyFreeze,
      loadOwned
    }
  }
})
</script>

<style lang="scss" src="./ShopView.component.scss"></style>
