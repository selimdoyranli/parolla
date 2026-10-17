import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'
import { fetchClientIp } from '@/helpers/client-ip'
import { reconnectDelay, WS_CLOSE_SERVICE_RESTART } from '@/helpers/ws-reconnect'

// Module-singleton so lobby + room pages share one WS connection across navigation.
let sharedSocket = null
const sharedStatus = ref('idle')
let consumers = 0
let closeTimer = null
// Buffer messages dispatched before the socket finishes connecting. Without
// this, the lobby's onMounted draw_lobby_subscribe fires while readyState is
// still CONNECTING (0) and silently drops, so the snapshot push never lands.
const pendingMessages = []
// The WS server attaches its `ws.on('message')` listener AFTER the async
// handleConnection() resolves (which awaits Strapi auth or a 100 ms guest
// reconnect sleep). Frames sent in the gap between sock.onopen and listener
// attachment are silently dropped by the `ws` lib. We therefore defer flushing
// pendingMessages until the server's CONNECTED handshake — sent at the very
// end of handleConnection, just before the message listener is attached — so
// the first FE-initiated frame (e.g. DRAW_ROOM_JOIN on a direct-link visit)
// can't lose the race.
let serverReady = false

// Defer close on unmount so a route transition (lobby → room) does not
// briefly drop consumers to 0 and tear the socket down between pages.
// If a new consumer mounts within this window the pending close is cancelled.
const CLOSE_DEFER_MS = 500

// null | 'restarting' | 'reconnecting' — drives SocketStatusBanner on draw pages
const reconnectStatus = ref(null)
let reconnectAttempt = 0
let reconnectTimer = null
// Set by close(): an intentional teardown must not trigger auto-reconnect
let closingOnPurpose = false

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
      $store.dispatch('draw/guest/ensure')
      const g = $store.state.draw.guest
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
    closingOnPurpose = false
    const sock = new WebSocket(url)
    sharedSocket = sock

    sock.onopen = () => {
      // Socket is open at the protocol level, but the server's message
      // listener isn't attached yet — wait for CONNECTED in onmessage before
      // flushing pendingMessages and exposing 'connected' status.
    }
    sock.onclose = event => {
      sharedStatus.value = 'disconnected'
      sharedSocket = null
      serverReady = false
      $store.commit('draw/SET_STATUS', 'disconnected')
      // Frames queued for the dead socket (strokes, guesses) are stale once we rejoin
      pendingMessages.length = 0

      if (closingOnPurpose || consumers === 0) return

      if (event.code === WS_CLOSE_SERVICE_RESTART) {
        reconnectStatus.value = 'restarting'
      } else if (reconnectStatus.value !== 'restarting') {
        reconnectStatus.value = 'reconnecting'
      }

      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(open, reconnectDelay(reconnectAttempt++))
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

      if (data.type === 'server_restarting') {
        reconnectStatus.value = 'restarting'
      }

      if (data.type === 'connected') {
        if (data.playerId) $store.commit('draw/SET_MY_ID', data.playerId)
        reconnectStatus.value = null
        reconnectAttempt = 0

        if (!serverReady) {
          serverReady = true
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

          fetchClientIp().then(ip => {
            if (ip && sock.readyState === 1) {
              sock.send(JSON.stringify({ type: 'draw_set_client_ip', ip }))
            }
          })
        }
      }

      $store.dispatch('draw/handleMessage', data)
    }
  }

  const send = (type, payload = {}) => {
    const msg = JSON.stringify({ type, ...payload })

    if (sharedSocket && sharedSocket.readyState === 1 && serverReady) {
      sharedSocket.send(msg)

      return
    }

    // Queue while the socket is still connecting OR the server hasn't sent
    // its CONNECTED handshake yet (its ws.on('message') is attached right
    // after CONNECTED). Flushed in sock.onmessage above. Cap the queue so a
    // never-ready socket can't grow it unbounded.
    if (pendingMessages.length < 32) pendingMessages.push(msg)
  }

  const close = () => {
    closingOnPurpose = true
    clearTimeout(reconnectTimer)
    reconnectStatus.value = null

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
    reconnectStatus,
    open,
    close,
    send
  }
}

export const getDrawSocket = () => sharedSocket
export const isDrawSocketReady = () => !!sharedSocket && sharedSocket.readyState === 1 && serverReady
