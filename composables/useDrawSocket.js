import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'

// Module-singleton so lobby + room pages share one WS connection across navigation.
let sharedSocket = null
const sharedStatus = ref('idle')
let consumers = 0

export const useDrawSocket = () => {
  const vm = getCurrentInstance().proxy
  const $auth = vm.$auth
  const $store = vm.$store
  const wsBase = process.env.WS_URL || 'wss://0.0.0.0:1881'

  const open = () => {
    if (sharedSocket && sharedSocket.readyState === 1) return

    if (sharedSocket && sharedSocket.readyState === 0) return // already connecting

    const token = ($auth && $auth.strategy && $auth.strategy.token && $auth.strategy.token.get()) || ''
    const cleanToken = String(token).replace(/^Bearer\s+/i, '')
    const url = `${wsBase}?token=${encodeURIComponent(cleanToken)}&channel=draw`

    sharedStatus.value = 'connecting'
    const sock = new WebSocket(url)
    sharedSocket = sock

    sock.onopen = () => {
      sharedStatus.value = 'connected'
      $store.commit('draw/SET_STATUS', 'connected')
    }
    sock.onclose = () => {
      sharedStatus.value = 'disconnected'
      sharedSocket = null
      $store.commit('draw/SET_STATUS', 'disconnected')
    }
    sock.onerror = e => {
      // eslint-disable-next-line no-console
      console.error('[draw ws]', e)
    }
    sock.onmessage = evt => {
      let data = null

      try {
        data = JSON.parse(evt.data)
      } catch (_e) {
        return
      }

      if (!data) return

      if (data.type === 'connected' && data.playerId) {
        $store.commit('draw/SET_MY_ID', data.playerId)
      }

      $store.dispatch('draw/handleMessage', data)
    }
  }

  const send = (type, payload = {}) => {
    if (!sharedSocket || sharedSocket.readyState !== 1) return
    sharedSocket.send(JSON.stringify({ type, ...payload }))
  }

  const close = () => {
    if (sharedSocket) {
      try {
        sharedSocket.close()
      } catch (_e) {
        /* ignore */
      }
      sharedSocket = null
    }
  }

  onMounted(() => {
    consumers++
    open()
  })

  onBeforeUnmount(() => {
    consumers = Math.max(0, consumers - 1)

    if (consumers === 0) close()
  })

  return {
    ws: {
      get value() {
        return sharedSocket
      }
    },
    status: sharedStatus,
    open,
    close,
    send
  }
}
