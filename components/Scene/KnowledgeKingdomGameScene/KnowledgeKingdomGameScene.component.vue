<template lang="pug">
.scene.tycoon-game-scene(ref="rootRef")
  .scene__inner
    //- Game Info
    .tycoon-game-info
      h2 {{ $t('tycoon.knowledgeKingdom.title') }}

    //- Header & Tap Area (Sticky)
    .tycoon-sticky-top
      .tycoon-header
        .tycoon-header__stats
          .tycoon-stat.tycoon-stat--gold
            AppIcon.tycoon-stat__icon(name="noto:coin" :width="20" :height="20")
            span.tycoon-stat__value {{ formatNumber(gold) }}
          .tycoon-stat.tycoon-stat--gps(v-if="goldPerSecond > 0")
            AppIcon.tycoon-stat__icon(name="noto:coin" :width="16" :height="16")
            span.tycoon-stat__value +{{ formatNumber(goldPerSecond) }}{{ $t('tycoon.knowledgeKingdom.perSecond') }}

      //- Tap Area
      .tycoon-tap-area(ref="tapAreaRef" @click="handleTap")
        .tycoon-tap-area__inner(:class="{ 'tycoon-tap-area__inner--pressed': isTapping }")
          AppIcon.tycoon-tap-area__icon(name="noto:crown" :width="36" :height="36")
          .tycoon-tap-area__content
            span.tycoon-tap-area__label {{ $t('tycoon.knowledgeKingdom.tap') }}
            span.tycoon-tap-area__click-value +{{ formatNumber(goldPerClick) }}
        //- Floating numbers
        transition-group.tycoon-tap-area__floaters(name="float-up" tag="div")
          .tycoon-floater(v-for="floater in floaters" :key="floater.id" :style="floaterStyle(floater)") +{{ formatNumber(goldPerClick) }}

    //- Items List
    .tycoon-items
      h3.tycoon-items__title
        AppIcon(name="noto:package" :width="20" :height="20")
        | &nbsp;{{ $t('tycoon.knowledgeKingdom.items') }}
      .tycoon-items__list(ref="itemsListRef")
        .tycoon-item(
          v-for="item in visibleItems"
          :key="item.id"
          :class="{ 'tycoon-item--affordable': gold >= item.cost, 'tycoon-item--owned': getOwnedCount(item.id) > 0 }"
        )
          .tycoon-item__info
            .tycoon-item__name-row
              span.tycoon-item__icon {{ item.icon }}
              span.tycoon-item__name {{ item.name }}
              span.tycoon-item-tier(:class="'tycoon-item-tier--' + item.tier")
                span.tycoon-item-tier__value LVL {{ item.tier }}
            .tycoon-item__earnings
              AppIcon(name="noto:coin" :width="14" :height="14")
              span +{{ formatNumber(item.goldPerSecond) }}{{ $t('tycoon.knowledgeKingdom.perSecond') }}
          .tycoon-item__actions
            .tycoon-item__owned-badge(v-if="getOwnedCount(item.id) > 0")
              | x{{ getOwnedCount(item.id) }}

            button.tycoon-item__buy-btn.tycoon-item__buy-btn--can-afford(v-if="gold >= item.cost" @click="handleBuy(item.id)")
              AppIcon(name="noto:coin" :width="14" :height="14")
              span {{ formatNumber(item.cost) }}

            button.tycoon-item__buy-btn(v-else)
              AppIcon(name="noto:coin" :width="14" :height="14")
              span {{ formatNumber(item.cost) }}

  // Ad
  AppAd(:data-ad-slot="9964323575")
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
    let floaterId = 0
    let tickInterval = null

    // Store getters
    const gold = computed(() => store.getters['tycoon/knowledge-kingdom/gold'])
    const totalGold = computed(() => store.getters['tycoon/knowledge-kingdom/totalGold'])
    const goldPerSecond = computed(() => store.getters['tycoon/knowledge-kingdom/goldPerSecond'])
    const goldPerClick = computed(() => store.getters['tycoon/knowledge-kingdom/goldPerClick'])
    const items = computed(() => store.getters['tycoon/knowledge-kingdom/items'])
    const ownedItems = computed(() => store.getters['tycoon/knowledge-kingdom/ownedItems'])
    const isLoaded = computed(() => store.getters['tycoon/knowledge-kingdom/isLoaded'])

    // Show items: all items up to the first unaffordable + 3 more
    const visibleItems = computed(() => {
      if (!items.value.length) return []

      // Find the first item the player can't afford based on all-time gold (totalGold)
      const firstUnaffordableIndex = items.value.findIndex(item => item.cost > totalGold.value && !getOwnedCount(item.id))

      // Show up to that index + 3 more items, minimum 5
      const showUpTo = Math.max(5, firstUnaffordableIndex === -1 ? items.value.length : firstUnaffordableIndex + 3)

      return items.value.slice(0, Math.min(showUpTo, items.value.length))
    })

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

      if (num >= 1e15) return (num / 1e15).toFixed(1) + 'Q'

      if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T'

      if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'

      if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'

      if (num >= 1e4) return (num / 1e3).toFixed(1) + 'K'

      return Math.floor(num).toLocaleString('tr-TR')
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

    function handleBuy(itemId) {
      store.dispatch('tycoon/knowledge-kingdom/buyItem', itemId)

      haptic()
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
      isTapping,
      floaters,
      getOwnedCount,
      floaterStyle,
      formatNumber,
      handleTap,
      handleBuy
    }
  }
})
</script>

<style lang="scss" src="./KnowledgeKingdomGameScene.component.scss"></style>
