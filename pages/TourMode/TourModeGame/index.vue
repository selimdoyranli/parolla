<template lang="pug">
.page.tour-mode-game-page
  // Game Scene
  TourModeGameScene
</template>

<script>
import { defineComponent, useContext, useMeta, useStore, onMounted, onBeforeUnmount } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    // TODO: Implement this after tour mode socket channel is implemented
    /* const store = useStore()

    const setupWs = async () => {
      await store.dispatch('app/initWs')
      await store.dispatch('tour/listenWs', { ws: store.getters['app/ws'] })
    }

    const destroyWs = async () => {
      await store.dispatch('app/closeWs')
    }

    onMounted(async () => {
      await setupWs()
    })

    onBeforeUnmount(async () => {
      await destroyWs()
    }) */

    useMeta(() => ({
      title: `${i18n.t('seo.tourMode.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.tourMode.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.tourMode.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.tourMode.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.tourMode.description')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./TourModeGame.page.scss"></style>
