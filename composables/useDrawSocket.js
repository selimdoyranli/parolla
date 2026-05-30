import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'

// Module-singleton so lobby + room pages share one WS connection across navigation.
let sharedSocket = null
const sharedStatus = ref('idle')
let consumers = 0
let closeTimer = null
// Buffer messages dispatched before the socket finishes connecting. Without
// this, the lobby's onMounted draw_lobby_subscribe fires while readyState is
// still CONNECTING (0) and silently drops, so the snapshot push never lands.
const pendingMessages = []

// Defer close on unmount so a route transition (lobby → room) does not
// briefly drop consumers to 0 and tear the socket down between pages.
// If a new consumer mounts within this window the pending close is cancelled.
const CLOSE_DEFER_MS = 500

export const useDrawSocket = () => {
  const vm = getCurrentInstance().proxy
  const $auth = vm.$auth
  const $store = vm.$store
  const wsBase = process.env.WS_URL || 'wss://0.0.0.0:1881'

  const open = () => {
    if (sharedSocket && sharedSocket.readyState === 1) return

    if (sharedSocket && sharedSocket.readyState === 0) return // already connecting

    const isGuest = !($auth && $auth.loggedIn)
    let urlParams

    if (isGuest) {
      // Make sure the persisted identity exists before we hand it to the server.
      $store.dispatch('guest/ensure')
      const g = $store.state.guest
      urlParams = new URLSearchParams({
        channel: 'draw',
        guestId: g.id || '',
        guestName: g.name || '',
        guestAvatarSeed: g.avatarSeed || ''
      })
    } else {
      const token = ($auth && $auth.strategy && $auth.strategy.token && $auth.strategy.token.get()) || ''
      const cleanToken = String(token).replace(/^Bearer\s+/i, '')
      urlParams = new URLSearchParams({
        channel: 'draw',
        token: cleanToken
      })
    }
    const url = `${wsBase}?${urlParams.toString()}`

    sharedStatus.value = 'connecting'
    const sock = new WebSocket(url)
    sharedSocket = sock

    sock.onopen = () => {
      sharedStatus.value = 'connected'
      $store.commit('draw/SET_STATUS', 'connected')

      while (pendingMessages.length) {
        const m = pendingMessages.shift()
        try {
          sock.send(m)
        } catch (_e) {
          /* ignore */
        }
      }
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
    const msg = JSON.stringify({ type, ...payload })

    if (sharedSocket && sharedSocket.readyState === 1) {
      sharedSocket.send(msg)

      return
    }

    // Queue while the socket is still connecting (or before it's been
    // open()'d at all). Flushed in sock.onopen above. Cap the queue so a
    // never-opening socket can't grow it unbounded.
    if (pendingMessages.length < 32) pendingMessages.push(msg)
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

    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }

    open()
  })

  onBeforeUnmount(() => {
    consumers = Math.max(0, consumers - 1)

    if (consumers !== 0) return

    if (closeTimer) clearTimeout(closeTimer)

    closeTimer = setTimeout(() => {
      closeTimer = null

      if (consumers === 0) close()
    }, CLOSE_DEFER_MS)
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
