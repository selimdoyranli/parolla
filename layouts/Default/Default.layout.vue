<template lang="pug">
.layout.default-layout(:style="`--vh: ${visualViewport.current.height}px; --init-vh: ${visualViewport.initialize.height}px`")
  // Preloader
  AppPreloader

  .layout__ad.layout__ad--left
    // image_vertical_flex_left
    AppAd(v-if="!isGmPage" :data-ad-slot="2717771834")
    a.layout__ad-banner(href="https://discball3d.com" rel="noopener" title="multiplayer soccer" target="_blank")
      img(src="/img/elements/discball3d_block.jpeg" alt="multiplayer soccer" title="multiplayer soccer")

  // Inner
  .layout__inner
    // App Header
    AppHeader

    // Layout Main
    main.layout__main
      // Router View
      nuxt.router-view

  .layout__ad.layout__ad--right
    // image_vertical_flex_right
    AppAd(v-if="!isGmPage" :data-ad-slot="8500032812")
    a.layout__ad-banner(href="https://discball3d.com" rel="noopener" title="multiplayer soccer" target="_blank")
      img(src="/img/elements/discball3d_block.jpeg" alt="multiplayer soccer" title="multiplayer soccer")

  // Auth Dialog
  AuthDialog

  // Player Dialog
  PlayerDialog

  // Player Actions ("more") Dialog — opened from live room avatars (tour / draw)
  PlayerActionsDialog
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, reactive, computed, useContext, useRoute } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const { getRouteBaseName } = useContext()
    const route = useRoute()

    // No ad slots on the GM panel: it shows moderation data and AI settings
    const isGmPage = computed(() => getRouteBaseName(route.value)?.startsWith('GmPanel'))

    const visualViewport = reactive({
      initialize: {
        height: 0
      },
      current: {
        height: 0
      }
    })

    const setVisualViewportHeight = () => {
      if ('visualViewport' in window) {
        visualViewport.current.height = window.visualViewport.height
      } else {
        visualViewport.current.height = window.innerHeight
      }

      visualViewport.initialize.height = window.innerHeight
    }

    onMounted(() => {
      setTimeout(() => {
        setVisualViewportHeight()
      }, 0)

      if ('visualViewport' in window) {
        window.visualViewport.addEventListener('resize', setVisualViewportHeight)
      }

      window.addEventListener('resize', setVisualViewportHeight)
      window.addEventListener('scroll', setVisualViewportHeight)
    })

    onBeforeUnmount(() => {
      if ('visualViewport' in window) {
        window.visualViewport.removeEventListener('resize', setVisualViewportHeight)
      }

      window.removeEventListener('resize', setVisualViewportHeight)
      window.removeEventListener('scroll', setVisualViewportHeight)
    })

    return {
      visualViewport,
      isGmPage
    }
  }
})
</script>

<style lang="scss" src="./Default.layout.scss"></style>
