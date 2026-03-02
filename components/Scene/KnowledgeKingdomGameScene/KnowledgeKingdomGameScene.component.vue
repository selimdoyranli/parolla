<template lang="pug">
.scene.tycoon-game-scene(ref="rootRef")
  .scene__inner
    //- Sticky Top Section (Dashboard & Tap Area)
    .tycoon-sticky-top
      .tycoon-dashboard
        .tycoon-dashboard__header
          .tycoon-dashboard__title {{ $t('tycoon.knowledgeKingdom.title') }}
          .tycoon-dashboard__tier(:class="'tycoon-tier-' + currentTier") LVL {{ currentTier }}
        .tycoon-dashboard__stats
          .tycoon-stat.tycoon-stat--gold
            AppIcon.tycoon-stat__icon(name="noto:coin" :width="24" :height="24")
            .tycoon-stat__content
              span.tycoon-stat__label Bakiye
              span.tycoon-stat__value {{ formatNumber(gold) }}
          .tycoon-stat.tycoon-stat--gps(v-if="goldPerSecond > 0")
            AppIcon.tycoon-stat__icon(name="noto:coin" :width="16" :height="16")
            span.tycoon-stat__value +{{ formatNumber(goldPerSecond) }} / sn

      //- Compact Tap Area
      .tycoon-tap-container
        .tycoon-tap-area(ref="tapAreaRef" :class="{ 'is-tapping': isTapping }" @click="handleTap")
          .tycoon-tap-area__ring
          .tycoon-tap-area__inner
            AppIcon.tycoon-tap-area__icon(name="noto:coin" :width="28" :height="28")
            span.tycoon-tap-area__hint-text D O K U N
            span.tycoon-tap-area__click-value
              | +{{ formatNumber(goldPerClick) }}

          transition-group.tycoon-floaters(name="float-up" tag="div")
            .tycoon-floater(v-for="floater in floaters" :key="floater.id" :style="floaterStyle(floater)")
              span
                | +{{ formatNumber(goldPerClick) }}
                AppIcon(name="noto:coin" :width="16" :height="16")

    //- Shop / Items List
    .tycoon-shop
      .tycoon-shop__header
        h3.tycoon-shop__title
          AppIcon(name="noto:package" :width="24" :height="24")
          | &nbsp;{{ $t('tycoon.knowledgeKingdom.items') }}

      .tycoon-shop__list(ref="itemsListRef")
        .tycoon-item(
          v-for="item in visibleItems"
          :key="item.id"
          :class="{ 'is-affordable': gold >= getItemCost(item.id), 'is-owned': getOwnedCount(item.id) > 0 }"
        )
          .tycoon-item__icon-wrapper
            span.tycoon-item__icon {{ item.icon }}
            .tycoon-item__owned-badge(v-if="getOwnedCount(item.id) > 0") {{ getOwnedCount(item.id) }}

          .tycoon-item__info
            .tycoon-item__name-row
              span.tycoon-item__name {{ item.name }}
              span.tycoon-item__tier-badge(:class="'tycoon-tier-' + item.tier") LVL {{ item.tier }}
            .tycoon-item__earnings
              AppIcon(name="noto:coin" :width="12" :height="12")
              span +{{ formatNumber(item.goldPerSecond) }} / {{ item.tickSeconds > 1 ? item.tickSeconds + 'sn' : 'sn' }}

          .tycoon-item__action
            button.tycoon-button.tycoon-button--buy.is-affordable(v-if="gold >= getItemCost(item.id)" @click="handleBuy(item, $event)")
              .tycoon-button__inner
                AppIcon(
                  name="noto:coin"
                  :class="gold < getItemCost(item.id) ? 'tycoon-button__coin--disabled' : ''"
                  :width="16"
                  :height="16"
                )
                span {{ formatNumber(getItemCost(item.id)) }}

            button.tycoon-button.tycoon-button--buy.disabled(v-else)
              .tycoon-button__inner
                AppIcon(
                  name="noto:coin"
                  :class="gold < getItemCost(item.id) ? 'tycoon-button__coin--disabled' : ''"
                  :width="16"
                  :height="16"
                )
                span {{ formatNumber(getItemCost(item.id)) }}

      transition-group.tycoon-floaters.tycoon-floaters--expense(name="float-up" tag="div")
        .tycoon-floater.tycoon-floater--expense(v-for="floater in expenseFloaters" :key="floater.id" :style="floaterStyle(floater)")
          span
            | -{{ formatNumber(floater.val) }}
            AppIcon(name="noto:coin" :width="16" :height="16")

      // Ad
      .tycoon-game-scene__ad
        AppAd(:data-ad-slot="9964323575")

      // Debug Button
      button.tycoon-debug-btn(@click="handleDebugCheat") DEBUG

      .tycoon-economy-version economy version: {{ economyVersion }}
</template>

<script>
import { defineComponent, useStore, onMounted, onBeforeUnmount, computed, ref } from '@nuxtjs/composition-api'
import { haptic } from 'ios-haptics'

export default defineComponent({
  setup() {
    const store = useStore()
    const rootRef = ref(null)
    const tapAreaRef = ref(null)
    const itemsListRef = ref(null)
    const isTapping = ref(false)
    const floaters = ref([])
    const expenseFloaters = ref([])
    let floaterId = 0
    let tickInterval = null

    // Store getters
    const gold = computed(() => store.getters['tycoon/knowledge-kingdom/gold'])
    const goldPerSecond = computed(() => store.getters['tycoon/knowledge-kingdom/goldPerSecond'])
    const goldPerClick = computed(() => store.getters['tycoon/knowledge-kingdom/goldPerClick'])
    const items = computed(() => store.getters['tycoon/knowledge-kingdom/items'])
    const ownedItems = computed(() => store.getters['tycoon/knowledge-kingdom/ownedItems'])
    const isLoaded = computed(() => store.getters['tycoon/knowledge-kingdom/isLoaded'])
    const debugUnlockAll = computed(() => store.getters['tycoon/knowledge-kingdom/debugUnlockAll'])
    const economyVersion = computed(() => (store.getters['tycoon/knowledge-kingdom/economyVersion'] || '').toLowerCase())

    const currentTier = computed(() => {
      let maxTier = 0

      for (const id in ownedItems.value) {
        if (ownedItems.value[id] > 0) {
          const item = items.value.find(i => i.id === parseInt(id))

          if (item && item.tier > maxTier) {
            maxTier = item.tier
          }
        }
      }

      return maxTier
    })

    // Show items in groups of 3; debug: all items
    const visibleItems = computed(() => {
      if (!items.value.length) return []

      if (debugUnlockAll.value) return items.value

      let highestOwnedId = 0

      for (const id in ownedItems.value) {
        if (ownedItems.value[id] > 0) {
          const numId = parseInt(id, 10)

          if (numId > highestOwnedId) highestOwnedId = numId
        }
      }

      const maxVisibleId = Math.max(3, Math.ceil((highestOwnedId + 1) / 3) * 3)

      return items.value.filter(item => item.id <= maxVisibleId)
    })

    function getItemCost(itemId) {
      return store.getters['tycoon/knowledge-kingdom/itemCost'](itemId)
    }

    function getOwnedCount(itemId) {
      return ownedItems.value[itemId] || 0
    }

    function floaterStyle(floater) {
      return {
        left: floater.x + 'px',
        top: floater.y + 'px'
      }
    }

    function formatNumber(num) {
      if (num === undefined || num === null) return '0'

      const n = Number(num)

      if (!Number.isFinite(n) || n < 0) return '0'

      if (n >= 1e18) {
        return n.toExponential(2).replace('+', '')
      }

      if (n >= 1e15) return (n / 1e15).toFixed(1) + 'Q'

      if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'

      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'

      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'

      if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K'

      if (n < 0.001) return n.toFixed(5)

      if (n < 0.1) return n.toFixed(3)

      if (n < 1) return n.toFixed(2)

      if (n < 1000 && !Number.isInteger(n)) return n.toFixed(1)

      return Math.floor(n).toLocaleString('tr-TR')
    }

    function handleDebugCheat() {
      store.dispatch('tycoon/knowledge-kingdom/debugCheat')
    }

    function handleTap(event) {
      store.dispatch('tycoon/knowledge-kingdom/tapGold')

      // Visual feedback
      isTapping.value = true
      setTimeout(() => {
        isTapping.value = false
      }, 100)

      // Floating number
      const rect = tapAreaRef.value?.getBoundingClientRect()

      if (rect) {
        const x = event.clientX - rect.left - 20
        const y = event.clientY - rect.top - 20

        const id = ++floaterId

        floaters.value.push({ id, x, y })

        setTimeout(() => {
          floaters.value = floaters.value.filter(f => f.id !== id)
        }, 800)
      }

      haptic()
    }

    function handleBuy(item, event) {
      const cost = getItemCost(item.id)

      if (gold.value >= cost) {
        store.dispatch('tycoon/knowledge-kingdom/buyItem', item.id)

        // Floating number for expenses
        const rect = rootRef.value?.getBoundingClientRect()

        if (rect && event) {
          const x = event.clientX - rect.left - 20
          const y = event.clientY - rect.top - 20

          const id = ++floaterId

          expenseFloaters.value.push({ id, x, y, val: cost })

          setTimeout(() => {
            expenseFloaters.value = expenseFloaters.value.filter(f => f.id !== id)
          }, 800)
        }

        haptic()
      }
    }

    onMounted(async () => {
      await store.dispatch('tycoon/knowledge-kingdom/loadItems')

      // Start tick interval (1 second)
      tickInterval = setInterval(() => {
        store.dispatch('tycoon/knowledge-kingdom/tick')
      }, 1000)

      document.querySelector('.layout__main').scrollTo({ top: 0, behavior: 'smooth' })
    })

    onBeforeUnmount(() => {
      if (tickInterval) {
        clearInterval(tickInterval)
        tickInterval = null
      }
    })

    return {
      rootRef,
      tapAreaRef,
      itemsListRef,
      gold,
      goldPerSecond,
      goldPerClick,
      items,
      ownedItems,
      isLoaded,
      visibleItems,
      economyVersion,
      isTapping,
      floaters,
      expenseFloaters,
      currentTier,
      getOwnedCount,
      floaterStyle,
      formatNumber,
      handleTap,
      handleBuy,
      handleDebugCheat,
      getItemCost
    }
  }
})
</script>

<style lang="scss" src="./KnowledgeKingdomGameScene.component.scss"></style>
