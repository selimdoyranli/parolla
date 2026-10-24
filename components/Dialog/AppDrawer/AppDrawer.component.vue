<template lang="pug">
Popup.app-drawer(v-model="state.isOpen" position="left" @closed="$emit('closed')")
  span.app-drawer__title {{ $t('dialog.menu.menu') }}
  CellGroup.app-drawer-nav
    Cell.app-drawer-nav__item(
      v-for="item in items"
      :key="item.route"
      size="large"
      is-link
      :title="$t(item.title)"
      :class="{ 'is-active': isActive(item.route) }"
      @click.native="navigate(item.route)"
    )
      template(#icon)
        AppIcon.app-drawer-nav__icon(:name="item.icon" :width="22" :height="22")

  MenuMoreNav(
    :with-communities="false"
    @clickedHowToPlay="$emit('clickedHowToPlay')"
    @clickedHowToCalculateStats="$emit('clickedHowToCalculateStats')"
    @clickedCredits="$emit('clickedCredits')"
    @clickedContact="$emit('clickedContact')"
    @clickedSwitchLocale="$emit('clickedSwitchLocale')"
    @clickedReviewRoom="$emit('clickedReviewRoom')"
    @close="state.isOpen = false"
  )
</template>

<script>
import { defineComponent, useRoute, useRouter, useContext, reactive, watch } from '@nuxtjs/composition-api'
import { Popup, CellGroup, Cell } from 'vant'

const ITEMS = [
  { route: 'Main', title: 'dialog.menu.home', icon: 'fluent-emoji-flat:house' },
  { route: 'Community-CommunityList', title: 'dialog.menu.communities', icon: 'fluent-emoji-flat:people-hugging' }
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

      if (!isActive(name)) router.push(localePath({ name }))
    }

    return { items: ITEMS, state, isActive, navigate }
  }
})
</script>

<style lang="scss" src="./AppDrawer.component.scss"></style>
