<template lang="pug">
Dialog.dialog.inventory-dialog(
  v-model="state.isOpen"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="handleClosed"
)
  template(#title)
    .inventory-dialog__header
      // the header follows the active tab (Envanter / Mağaza / Görevler)
      AppIcon.inventory-dialog__icon(:name="activeTab.icon" :width="22" :height="22")
      span.inventory-dialog__title {{ $t(`economy.inventory.tabs.${activeTab.key}`) }}
      button.inventory-dialog__balance(v-if="loggedIn" type="button" @click="openHistory")
        GoldAmount(size="sm" :amount="gold")
      button.inventory-dialog__preview(v-if="loggedIn" type="button" @click="isPreviewOpen = true")
        PlayerAvatar(:user="$auth.user" :size="22")
        span {{ $t('economy.collection.previewOpen') }}

  .inventory-dialog__content
    nav.inventory-dialog__tabs
      button.inventory-dialog__tab(
        v-for="t in TABS"
        :key="t.key"
        type="button"
        :class="{ 'is-active': tab === t.key }"
        @click="tab = t.key"
      )
        AppIcon(:name="t.icon" :width="16" :height="16")
        span.inventory-dialog__tab-label {{ $t(`economy.inventory.tabs.${t.key}`) }}

    .inventory-dialog__body
      template(v-if="state.alive")
        // a tab mounts on first visit and then stays, so its loaded state survives a tab switch
        CollectionView(v-if="seen.inventory" v-show="tab === 'inventory'")
        ShopView(v-if="seen.shop" v-show="tab === 'shop'")
        QuestsView(v-if="seen.quests" v-show="tab === 'quests'")

  LazyPreviewDialog(v-if="loggedIn" :isOpen="isPreviewOpen" @closed="isPreviewOpen = false")
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, useContext, useRouter, useStore } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

const TABS = [
  { key: 'inventory', icon: 'tabler:backpack' },
  { key: 'shop', icon: 'tabler:building-store' },
  { key: 'quests', icon: 'tabler:target-arrow' }
]

export default defineComponent({
  components: { Dialog: Dialog.Component },
  props: {
    isOpen: { type: Boolean, required: false, default: false }
  },
  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const { localePath, $auth } = useContext()

    const state = reactive({ isOpen: props.isOpen, alive: props.isOpen })
    const seen = reactive({ inventory: false, shop: false, quests: false })
    const isPreviewOpen = ref(false)
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
      router.push(localePath({ name: 'Activities-GoldHistory' }))
    }

    const activeTab = computed(() => TABS.find(t => t.key === tab.value) || TABS[0])

    return { TABS, state, seen, isPreviewOpen, loggedIn, gold, tab, activeTab, close, handleClosed, openHistory }
  }
})
</script>

<style lang="scss" src="./InventoryDialog.component.scss"></style>
