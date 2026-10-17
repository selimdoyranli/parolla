<template lang="pug">
.page.tour-mode-game-page
  // Game Scene
  TourModeGameScene

  SocketStatusBanner(:status="socketStatus" @reconnect="reconnectNow")
</template>

<script>
import { defineComponent, useContext, useMeta, useStore, onMounted, onBeforeUnmount, ref } from '@nuxtjs/composition-api'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { reconnectDelay, WS_CLOSE_SERVICE_RESTART, WS_CLOSE_IDLE, WS_CLOSE_VOTE_KICKED, WS_CLOSE_GM_KICKED } from '@/helpers/ws-reconnect'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    // TODO: Implement this after tour mode socket channel is implemented
    const store = useStore()

    // null | 'restarting' | 'reconnecting' | 'idle' | 'kicked' | 'gmKicked' — see SocketStatusBanner
    const socketStatus = ref(null)
    let reconnectAttempt = 0
    let reconnectTimer = null
    let isDestroyed = false

    const handleSocketMessage = event => {
      const { type } = JSON.parse(event.data)

      if (type === wsTypeEnum.SERVER_RESTARTING) {
        socketStatus.value = 'restarting'
      }

      if (type === wsTypeEnum.CONNECTED) {
        socketStatus.value = null
        reconnectAttempt = 0
      }
    }

    const handleSocketClose = event => {
      if (isDestroyed) return

      // Dropped on purpose by the server: wait for the player to rejoin
      const manualCloseStatus = { [WS_CLOSE_IDLE]: 'idle', [WS_CLOSE_VOTE_KICKED]: 'kicked', [WS_CLOSE_GM_KICKED]: 'gmKicked' }[event.code]

      if (manualCloseStatus) {
        socketStatus.value = manualCloseStatus

        return
      }

      if (event.code === WS_CLOSE_SERVICE_RESTART) {
        socketStatus.value = 'restarting'
      } else if (socketStatus.value !== 'restarting') {
        socketStatus.value = 'reconnecting'
      }

      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(setupWs, reconnectDelay(reconnectAttempt++))
    }

    const setupWs = async () => {
      const ws = await store.dispatch('app/initWs')

      ws.addEventListener('message', handleSocketMessage)
      ws.addEventListener('close', handleSocketClose)
      await store.dispatch('tour/listenWs', { ws })
    }

    const reconnectNow = () => {
      reconnectAttempt = 0
      socketStatus.value = 'reconnecting'
      setupWs()
    }

    const destroyWs = async () => {
      isDestroyed = true
      clearTimeout(reconnectTimer)
      await store.dispatch('app/closeWs')
    }

    onMounted(async () => {
      await setupWs()
    })

    onBeforeUnmount(async () => {
      await destroyWs()
    })

    useMeta(() => ({
      title: `${i18n.t('seo.tourMode.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.tourMode.description')
        },
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

    return {
      socketStatus,
      reconnectNow
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./TourModeGame.page.scss"></style>
