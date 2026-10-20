<template lang="pug">
.shop-view
  // Vitrin
  section.shop-view__section(v-if="vitrinCards.length")
    h3.shop-view__heading {{ $t('economy.shop.vitrin') }}
    .shop-view__strip-wrap(:class="{ 'is-end': stripAtEnd }")
      .shop-view__strip(ref="strip" @scroll.passive="measureStrip")
        CosmeticCard.shop-view__strip-card(
          v-for="c in vitrinCards"
          :key="`v-${c.item.key}`"
          :variants="[c.item]"
          :equipping="c.item.key === equippingKey"
          :vitrin-price="c.price"
          :owned-keys="ownedSet"
          :equipped-keys="equippedSet"
          :balance="balance"
          :viewer="viewer"
          :logged-in="loggedIn"
          @buy="openItem"
          @equip="equipItem"
        )

  // phones: a title + category dropdown instead of the tab strip
  .shop-view__mobile-head
    h3.shop-view__heading {{ $t('economy.shop.products') }}
    FilterDropdown(:options="tabOptions" :selected="selectedTabOption" @on-select-option="o => (tab = o.key)")

  Tabs.shop-view__tabs(v-model="tab" line-width="20px" line-height="2px" :ellipsis="false" :swipe-threshold="3" :swipeable="false")
    Tab(v-for="t in TABS" :key="t.key" :name="t.key")
      template(#title)
        span.shop-view__tab
          AppIcon(:name="t.icon" :width="15" :height="15")
          span {{ $t(`economy.shop.categories.${t.key}`) }}

  // Only the active category is rendered (one tab is ~35 cards; all 450 at once is too heavy on mobile)
  .shop-view__grid(v-if="tab !== 'sets'")
    CosmeticCard(
      v-for="e in entries"
      :key="e[0].key"
      reserve
      :variants="e"
      :equipping="e.some(v => v.key === equippingKey)"
      :owned-keys="ownedSet"
      :equipped-keys="equippedSet"
      :balance="balance"
      :viewer="viewer"
      :logged-in="loggedIn"
      @buy="openItem"
      @equip="equipItem"
    )

  // Sets: one compact row per series, tap to expand its items
  .shop-view__sets(v-else)
    section.shop-view__set(v-for="s in seriesList" :key="s.series" :class="{ 'is-open': openSeries === s.series }")
      .shop-view__set-row
        button.shop-view__set-toggle(type="button" :aria-expanded="String(openSeries === s.series)" @click="toggleSeries(s.series)")
          AppIcon(:name="openSeries === s.series ? 'tabler:chevron-down' : 'tabler:chevron-right'" :width="16" :height="16")
          span.shop-view__set-name {{ s.name }}
          span.shop-view__set-count {{ s.owned }}/{{ s.total }}
        button.shop-buy(v-if="setPrices[s.series]" type="button" @click="openSet(s)")
          span {{ $t(loggedIn ? 'economy.shop.buySet' : 'economy.shop.login') }}
          GoldAmount(v-if="loggedIn" size="sm" :amount="setPrices[s.series].price")
        button.shop-buy.shop-buy--owned(v-else type="button" disabled)
          AppIcon(name="tabler:check" :width="14" :height="14")
          span {{ $t('economy.shop.owned') }}
      .shop-view__grid(v-if="openSeries === s.series")
        CosmeticCard(
          v-for="e in s.entries"
          :key="e[0].key"
          reserve
          :variants="e"
          :equipping="e.some(v => v.key === equippingKey)"
          :owned-keys="ownedSet"
          :equipped-keys="equippedSet"
          :balance="balance"
          :viewer="viewer"
          :logged-in="loggedIn"
          @buy="openItem"
          @equip="equipItem"
        )

  LazyPurchaseDialog(
    :is-open="dialog.isOpen"
    :target="dialog.target"
    @closed="dialog.isOpen = false"
    @purchased="loadOwned"
    @vitrin-expired="loadVitrin"
  )
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, onMounted, nextTick, useContext, useStore } from '@nuxtjs/composition-api'
import { Tabs, Tab } from 'vant'

const TABS = [
  { key: 'avatar_frame', icon: 'tabler:circle-dashed' },
  { key: 'avatar_decoration', icon: 'tabler:crown' },
  { key: 'profile_effect', icon: 'tabler:sparkles' },
  { key: 'profile_frame', icon: 'tabler:frame' },
  { key: 'profile_cover', icon: 'tabler:photo' },
  { key: 'name_color', icon: 'tabler:palette' },
  { key: 'sets', icon: 'tabler:packages' }
]

export default defineComponent({
  components: { Tabs, Tab },
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const loggedIn = computed(() => $auth.loggedIn)
    const viewer = computed(() => ($auth.loggedIn ? $auth.user : null))
    const balance = computed(() => store.state.economy.wallet.gold)

    const tab = ref(TABS[0].key)
    const openSeries = ref(null)

    const vitrin = ref(null)
    const dialog = reactive({ isOpen: false, target: null })

    // season and achievement items (price null) are never listed
    const forSale = computed(() => store.state.economy.catalog.items.filter(i => i.price != null && i.rarity !== 'sezon'))
    const catalogMap = computed(() => store.getters['economy/catalogMap'])
    const inventory = computed(() => store.state.economy.inventory || {})
    const ownedSet = computed(() => new Set((inventory.value.owned || []).map(o => o.itemKey)))
    const equippedSet = computed(() => new Set(Object.values(inventory.value.loadout || {})))

    const variantsOf = computed(() => {
      const map = {}

      for (const i of forSale.value) if (i.variantOf) (map[i.variantOf] = map[i.variantOf] || []).push(i)

      return map
    })

    // [base, ...variants] per base item, cheapest first (ties by name)
    const allEntries = computed(() =>
      forSale.value
        .filter(i => !i.variantOf)
        .map(i => [i, ...(variantsOf.value[i.key] || [])])
        .sort((a, b) => a[0].price - b[0].price || (a[0].name || '').localeCompare(b[0].name || '', i18n.locale))
    )

    const entries = computed(() => allEntries.value.filter(e => e[0].category === tab.value))

    // set price: 75% of the not-owned base items, rounded to 100 (server is authoritative)
    const setPrices = computed(() => {
      const sums = {}

      for (const [i] of allEntries.value) {
        if (ownedSet.value.has(i.key)) continue

        const s = (sums[i.series] = sums[i.series] || { full: 0, count: 0 })

        s.full += i.price
        s.count++
      }

      return Object.fromEntries(
        Object.entries(sums).map(([k, s]) => [k, { count: s.count, price: Math.round((s.full * 0.75) / 100) * 100 }])
      )
    })

    const seriesList = computed(() => {
      const bySeries = new Map()

      for (const e of allEntries.value) {
        const [i] = e

        if (!bySeries.has(i.series))
          bySeries.set(i.series, { series: i.series, name: i.seriesName, entries: [], owned: 0, total: 0, full: 0 })

        const s = bySeries.get(i.series)

        s.entries.push(e)
        s.total++
        s.full += i.price

        if (ownedSet.value.has(i.key)) s.owned++
      }

      // a set is one item per slot: same-category packs (the ozel name colours) are sold item by item only
      const isRealSet = s => new Set(s.entries.map(([i]) => i.category)).size === s.entries.length

      // cheapest set first by its full price (stable while the user owns some), ties by name
      return [...bySeries.values()]
        .filter(isRealSet)
        .sort((a, b) => a.full - b.full || (a.name || '').localeCompare(b.name || '', i18n.locale))
    })

    const toggleSeries = series => (openSeries.value = openSeries.value === series ? null : series)

    const tabOptions = computed(() => TABS.map(t => ({ key: t.key, icon: t.icon, label: i18n.t(`economy.shop.categories.${t.key}`) })))
    const selectedTabOption = computed(() => tabOptions.value.find(o => o.key === tab.value))

    // hides the right-edge fade once the vitrin strip is scrolled to its end
    const strip = ref(null)
    const stripAtEnd = ref(false)
    const measureStrip = () => {
      const el = strip.value

      // clientWidth 0 = tab hidden; keep the fade until it can be measured
      if (el && el.clientWidth) stripAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    }

    const vitrinCards = computed(() =>
      ((vitrin.value && vitrin.value.items) || []).map(v => ({ item: catalogMap.value[v.key], price: v.price })).filter(c => c.item)
    )

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

    const openSet = s => {
      if (requireLogin()) return

      dialog.target = {
        series: s.series,
        name: s.name,
        count: setPrices.value[s.series].count,
        price: setPrices.value[s.series].price,
        items: s.entries.map(e => e[0])
      }
      dialog.isOpen = true
    }

    const { equip } = useEquip()
    const equippingKey = ref(null)

    const equipItem = async item => {
      if (equippingKey.value) return

      equippingKey.value = item.key

      try {
        await equip(item)
      } finally {
        equippingKey.value = null
      }
    }

    const loadOwned = () => (loggedIn.value ? store.dispatch('economy/fetchInventory') : null)

    // a strip that fits without scrolling needs no fade
    watch(vitrinCards, () => nextTick(measureStrip), { immediate: true })

    watch(loggedIn, value => {
      if (value) {
        loadOwned()
        store.dispatch('economy/fetchWallet')
      }
    })

    const loadVitrin = async () => {
      const { data } = await store.dispatch('economy/fetchVitrin')

      vitrin.value = data
    }

    onMounted(() => {
      loadOwned()
      loadVitrin()
    })

    return {
      TABS,
      loggedIn,
      viewer,
      balance,
      tab,
      openSeries,
      dialog,
      ownedSet,
      equippedSet,
      setPrices,
      entries,
      seriesList,
      vitrinCards,
      tabOptions,
      selectedTabOption,
      strip,
      stripAtEnd,
      measureStrip,
      toggleSeries,
      loadVitrin,
      openItem,
      equippingKey,
      equipItem,
      openSet,
      loadOwned
    }
  }
})
</script>

<style lang="scss" src="./ShopView.component.scss"></style>
