<template lang="pug">
.collection-view
  .collection-view__login(v-if="!loggedIn")
    p {{ $t('economy.collection.loginPrompt') }}
    Button(color="var(--color-brand-02)" round @click="openLogin") {{ $t('economy.collection.login') }}

  template(v-else)
    .collection-view__error(v-if="failed")
      p {{ $t('economy.errors.generic') }}
      Button(round :loading="retrying" @click="load") {{ $t('economy.retry') }}

    .collection-view__empty(v-if="loaded && !groups.length")
      p {{ $t('economy.collection.empty') }}
      Button(color="var(--color-brand-02)" round @click="$store.commit('economy/SET_INVENTORY_DIALOG_TAB', 'shop')")
        | {{ $t('economy.collection.goShop') }}

    InlineAd(v-if="loaded && !groups.length")

    template(v-for="(g, i) in groups")
      section.collection-view__group(:key="g.category")
        h2.collection-view__heading {{ $t(`economy.shop.categories.${g.category}`) }}
        .collection-view__grid
          .collection-view__tile(v-for="item in g.items" :key="item.key")
            CosmeticCard(preview-only :variants="[item]" :viewer="viewer")
            b.collection-view__name {{ item.name }}
            Button(
              :color="isOn(item) ? undefined : 'var(--color-brand-02)'"
              size="small"
              round
              :loading="item.key === togglingKey"
              @click="toggle(item)"
            )
              | {{ $t(isOn(item) ? 'economy.collection.unequip' : 'economy.collection.equip') }}
      InlineAd(:key="`ad-${g.category}`" v-if="i === 0")
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Button } from 'vant'

// catalog category -> loadout slot, in display order
const SLOTS = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  name_color: 'nameColor',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const { $auth } = useContext()
    const { equip, unequip } = useEquip()

    const loggedIn = computed(() => $auth.loggedIn)
    const viewer = computed(() => ($auth.loggedIn ? $auth.user : null))
    const loaded = ref(false)
    const failed = ref(false)
    const retrying = ref(false)
    const togglingKey = ref(null)

    const catalogMap = computed(() => store.getters['economy/catalogMap'])
    const inventory = computed(() => store.state.economy.inventory)
    const loadout = computed(() => (inventory.value && inventory.value.loadout) || {})

    const groups = computed(() => {
      const items = ((inventory.value && inventory.value.owned) || []).map(o => catalogMap.value[o.itemKey]).filter(Boolean)

      return Object.keys(SLOTS)
        .map(category => ({ category, items: items.filter(i => i.category === category) }))
        .filter(g => g.items.length)
    })

    const isOn = item => loadout.value[SLOTS[item.category]] === item.key

    // applies at once; useEquip blocks overlapping and too-fast changes
    const toggle = async item => {
      togglingKey.value = item.key

      try {
        await (isOn(item) ? unequip(item) : equip(item))
      } finally {
        togglingKey.value = null
      }
    }

    const load = async () => {
      if (!loggedIn.value) return

      retrying.value = true

      try {
        // catalog first (cached = instant): filtering against a still-empty catalog would drop every key
        const [{ error }] = await Promise.all([store.dispatch('economy/fetchInventory'), store.dispatch('economy/fetchCatalog')])

        failed.value = Boolean(error)
        loaded.value = !error
      } finally {
        retrying.value = false
      }
    }

    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    watch(loggedIn, load)
    onMounted(load)

    return { loggedIn, viewer, loaded, failed, retrying, load, groups, isOn, toggle, togglingKey, openLogin }
  }
})
</script>

<style lang="scss" src="./CollectionView.component.scss"></style>
