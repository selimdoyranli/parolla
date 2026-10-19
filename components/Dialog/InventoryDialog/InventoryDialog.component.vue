<template lang="pug">
Popup.inventory-dialog(
  v-model="state.isOpen"
  get-container="body"
  :close-on-click-overlay="false"
  :lock-scroll="true"
  @closed="handleClosed"
)
  header.inventory-dialog__header
    AppIcon.inventory-dialog__icon(name="tabler:backpack" :width="22" :height="22")
    h2.inventory-dialog__title {{ $t('economy.inventory.title') }}
    button.inventory-dialog__balance(v-if="loggedIn" type="button" @click="openHistory")
      GoldAmount(:amount="gold")
    button.inventory-dialog__close(type="button" :aria-label="$t('general.close')" @click="close")
      AppIcon(name="tabler:x" :width="22" :height="22")

  nav.inventory-dialog__tabs
    button.inventory-dialog__tab(v-for="t in TABS" :key="t.key" type="button" :class="{ 'is-active': tab === t.key }" @click="tab = t.key")
      AppIcon(:name="t.icon" :width="18" :height="18")
      span {{ $t(`economy.inventory.tabs.${t.key}`) }}

  .inventory-dialog__body
    template(v-if="state.alive")
      // a tab mounts on first visit and then stays, so an unsaved loadout draft survives a tab switch
      CollectionView(v-if="seen.inventory" v-show="tab === 'inventory'")
      ShopView(v-if="seen.shop" v-show="tab === 'shop'")
      QuestsView(v-if="seen.quests" v-show="tab === 'quests'")
</template>

<script>
import { defineComponent, computed, reactive, watch, useContext, useRouter, useStore } from '@nuxtjs/composition-api'
import { Popup } from 'vant'

const TABS = [
  { key: 'inventory', icon: 'tabler:backpack' },
  { key: 'shop', icon: 'tabler:building-store' },
  { key: 'quests', icon: 'tabler:target-arrow' }
]

export default defineComponent({
  components: { Popup },
  props: {
    isOpen: { type: Boolean, required: false, default: false }
  },
  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const { localePath, $auth } = useContext()

    const state = reactive({ isOpen: props.isOpen, alive: props.isOpen })
    const seen = reactive({ inventory: false, shop: false, quests: false })
    const loggedIn = computed(() => $auth.loggedIn)
    const gold = computed(() => store.state.economy.wallet.gold)
    const tab = computed({
      get: () => store.state.economy.dialog.inventory.tab,
      set: value => store.commit('economy/SET_INVENTORY_DIALOG_TAB', value)
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) state.alive = true
      },
      { immediate: true }
    )
    watch(
      [() => state.isOpen, tab],
      ([open, key]) => {
        if (open) seen[key] = true
      },
      { immediate: true }
    )

    const close = () => (state.isOpen = false)
    const handleClosed = () => {
      state.alive = false
      Object.keys(seen).forEach(k => (seen[k] = false))
      emit('closed')
    }
    const openHistory = () => {
      close()
      router.push(localePath({ name: 'GoldHistory' }))
    }

    return { TABS, state, seen, loggedIn, gold, tab, close, handleClosed, openHistory }
  }
})
</script>

<style lang="scss" src="./InventoryDialog.component.scss"></style>
