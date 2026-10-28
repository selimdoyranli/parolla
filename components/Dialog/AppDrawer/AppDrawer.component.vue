<template lang="pug">
Popup.app-drawer(v-model="state.isOpen" position="left" @closed="$emit('closed')")
  span.app-drawer__title {{ $t('dialog.menu.menu') }}
  CellGroup.app-drawer-nav
    Cell.app-drawer-nav__item(
      v-for="item in items"
      :key="item.key"
      size="large"
      is-link
      :class="{ 'is-active': item.route && isActive(item.route) }"
      @click.native="item.route ? navigate(item.route) : openShop()"
    )
      template(#icon)
        AppIcon.app-drawer-nav__icon(:name="item.icon" :width="22" :height="22")
      template(#title)
        span {{ $t(item.title) }}
        span.app-drawer-nav__gold-badge(v-if="!item.route && $auth.loggedIn")
          GoldAmount(size="sm" :amount="gold")

  MenuMoreNav(
    :with-communities="false"
    @clickedHowToPlay="$emit('clickedHowToPlay')"
    @clickedHowToCalculateStats="$emit('clickedHowToCalculateStats')"
    @clickedCredits="$emit('clickedCredits')"
    @clickedDonate="$emit('clickedDonate')"
    @clickedContact="$emit('clickedContact')"
    @clickedSwitchLocale="$emit('clickedSwitchLocale')"
    @clickedReviewRoom="$emit('clickedReviewRoom')"
    @close="state.isOpen = false"
  )

  small.app-drawer__copyright &copy; parolla
</template>

<script>
import { defineComponent, useRoute, useRouter, useContext, useStore, reactive, computed, watch } from '@nuxtjs/composition-api'
import { Popup, CellGroup, Cell } from 'vant'

// the shop has no route: it opens the inventory dialog on its shop tab
const ITEMS = [
  { key: 'home', route: 'Main', title: 'dialog.menu.home', icon: 'fluent-emoji-flat:house' },
  {
    key: 'communities',
    route: 'Community-CommunityList',
    title: 'dialog.menu.communities',
    icon: 'streamline-color:user-multiple-group-flat'
  },
  { key: 'shop', title: 'dialog.menu.shop', icon: 'streamline-ultimate-color:shop-sale-1' },
  { key: 'quizzes', route: 'CreatorMode-CreatorModeRooms', title: 'dialog.menu.quizzes', icon: 'twemoji:pencil' }
]

export default defineComponent({
  components: { Popup, CellGroup, Cell },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const { localePath, getRouteBaseName } = useContext()

    const state = reactive({ isOpen: props.isOpen })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const isActive = name => getRouteBaseName(route.value) === name

    const navigate = name => {
      state.isOpen = false

      // the current page (e.g. home from home) reloads instead of a no-op push
      if (isActive(name)) return window.location.reload()

      router.push(localePath({ name }))
    }

    const gold = computed(() => store.state.economy.wallet.gold)

    const openShop = () => {
      state.isOpen = false
      store.commit('economy/OPEN_INVENTORY_DIALOG', 'shop')
    }

    return { items: ITEMS, state, gold, isActive, navigate, openShop }
  }
})
</script>

<style lang="scss" src="./AppDrawer.component.scss"></style>
