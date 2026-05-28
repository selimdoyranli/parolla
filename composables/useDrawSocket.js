import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'

export const useDrawSocket = () => {
  const ws = ref(null)
  const status = ref('idle')
  const vm = getCurrentInstance().proxy
  const $auth = vm.$auth
  const $store = vm.$store
  const wsBase = process.env.WS_URL || 'wss://0.0.0.0:1881'

  const open = () => {
    if (ws.value && ws.value.readyState === 1) return
    const token = ($auth && $auth.strategy && $auth.strategy.token && $auth.strategy.token.get()) || ''
    const cleanToken = String(token).replace(/^Bearer\s+/i, '')
    const url = `${wsBase}?token=${encodeURIComponent(cleanToken)}&channel=draw`
    status.value = 'connecting'
    const sock = new WebSocket(url)
    ws.value = sock

    sock.onopen = () => {
      status.value = 'connected'
      $store.commit('draw/SET_STATUS', 'connected')
    }
    sock.onclose = () => {
      status.value = 'disconnected'
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
    if (!ws.value || ws.value.readyState !== 1) return
    ws.value.send(JSON.stringify({ type, ...payload }))
  }

  const close = () => {
    if (ws.value) {
      try {
        ws.value.close()
      } catch (_e) {
        /* ignore */
      }
      ws.value = null
    }
  }

  onMounted(() => open())
  onBeforeUnmount(() => close())

  return { ws, status, open, close, send }
}
