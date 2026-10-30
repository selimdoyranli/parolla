import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'
import { reconnectDelay, WS_CLOSE_SERVICE_RESTART, WS_CLOSE_VOTE_KICKED } from '@/helpers/ws-reconnect'
import { wsTypeEnum } from '@/enums/wsType.enum'

// Same lifecycle as useDrawSocket (module singleton, queue until `connected`).
// A page uses either the player or the remote socket, never both in one tab.
let sharedSocket = null
const sharedStatus = ref('idle')
let consumers = 0
let closeTimer = null
const pendingMessages = []
let serverReady = false
const CLOSE_DEFER_MS = 500
const reconnectStatus = ref(null)
let reconnectAttempt = 0
let reconnectTimer = null
let closingOnPurpose = false
// Last join frame, replayed after an auto-reconnect so the server restores the seat
let joinFrame = null
let sharedRemote = false
const JOIN_DEAD_CODES = ['room_not_found', 'bad_password', 'room_full', 'room_locked', 'login_required']

export const usePartySocket = ({ remote = false } = {}) => {
  const vm = getCurrentInstance().proxy
  const $auth = vm.$auth
  const $store = vm.$store
  const wsBase = process.env.WS_URL || 'wss://0.0.0.0:1881'

  const open = () => {
    if (sharedSocket && (sharedSocket.readyState === 1 || sharedSocket.readyState === 0)) {
      if (sharedRemote === remote) return

      // Page switched player <-> remote inside the close-defer window: reconnect in the new mode
      detach()
    }

    const isGuest = !($auth && $auth.loggedIn)
    const params = { channel: 'party' }

    if (isGuest) {
      $store.dispatch('draw/guest/ensure')
      const g = $store.state.draw.guest
      Object.assign(params, { guestId: g.id || '', guestName: g.name || '', guestAvatarSeed: g.avatarSeed || '' })
    } else {
      const token = ($auth.strategy && $auth.strategy.token && $auth.strategy.token.get()) || ''
      params.token = String(token).replace(/^Bearer\s+/i, '')
    }

    if (remote) params.remote = '1'

    sharedStatus.value = 'connecting'
    sharedRemote = remote
    closingOnPurpose = false
    const sock = new WebSocket(`${wsBase}?${new URLSearchParams(params).toString()}`)
    sharedSocket = sock

    sock.onclose = event => {
      if (sharedSocket !== sock) return

      sharedStatus.value = 'disconnected'
      sharedSocket = null
      serverReady = false
      $store.commit('party/SET_STATUS', 'disconnected')
      pendingMessages.length = 0

      if (closingOnPurpose || consumers === 0) return

      // 4003 = don't reconnect (party: login_required); the error frame already told the page
      if (event.code === WS_CLOSE_VOTE_KICKED) {
        reconnectStatus.value = null

        return
      }

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
      console.error('[party ws]', e)
    }
    sock.onmessage = evt => {
      if (sharedSocket !== sock) return

      let data = null
      try {
        data = JSON.parse(evt.data)
      } catch (_e) {
        return
      }

      if (!data) return

      if (data.type === 'server_restarting') reconnectStatus.value = 'restarting'

      // A dead join must not be replayed after a later drop
      if (
        data.type === wsTypeEnum.PARTY_CLOSED ||
        (data.type === wsTypeEnum.PARTY_ERROR && (JOIN_DEAD_CODES.includes(data.code) || (sharedRemote && data.code === 'not_host')))
      ) {
        joinFrame = null
      }

      // Seated (the host got here via PARTY_CREATE): a reconnect rejoins by code; seated members skip the password.
      // Same string as the page's own join frame, so the replay dedupe still drops a queued copy.
      if (data.type === wsTypeEnum.PARTY_ROOM_STATE && data.room && !sharedRemote) {
        joinFrame = JSON.stringify({ type: wsTypeEnum.PARTY_JOIN, code: data.room.code })
      }

      if (data.type === 'connected') {
        if (data.playerId) $store.commit('party/SET_MY_ID', data.playerId)
        reconnectStatus.value = null
        reconnectAttempt = 0

        if (!serverReady) {
          serverReady = true
          sharedStatus.value = 'connected'
          $store.commit('party/SET_STATUS', 'connected')

          // Replay the join (first connect failed or reconnect); drop a queued copy so it isn't sent twice
          if (joinFrame) {
            const dup = pendingMessages.indexOf(joinFrame)

            if (dup !== -1) pendingMessages.splice(dup, 1)

            pendingMessages.unshift(joinFrame)
          }

          while (pendingMessages.length) {
            try {
              sock.send(pendingMessages.shift())
            } catch (_e) {
              /* ignore */
            }
          }
        }
      }

      $store.dispatch('party/handleMessage', data)
    }
  }

  const send = (type, payload = {}) => {
    const msg = JSON.stringify({ type, ...payload })

    if (type === wsTypeEnum.PARTY_JOIN || type === wsTypeEnum.PARTY_REMOTE_JOIN) joinFrame = msg

    if (type === wsTypeEnum.PARTY_LEAVE) joinFrame = null

    if (sharedSocket && sharedSocket.readyState === 1 && serverReady) {
      sharedSocket.send(msg)

      return
    }

    if (pendingMessages.length < 32) pendingMessages.push(msg)
  }

  // Close the live socket on purpose; its late onclose/onmessage are ignored by the guards above
  const detach = () => {
    closingOnPurpose = true
    clearTimeout(reconnectTimer)
    reconnectStatus.value = null
    serverReady = false
    pendingMessages.length = 0

    if (sharedSocket) {
      try {
        sharedSocket.close()
      } catch (_e) {
        /* ignore */
      }
      sharedSocket = null
    }
  }

  const close = () => {
    joinFrame = null
    detach()
    sharedStatus.value = 'disconnected'
    $store.commit('party/SET_STATUS', 'disconnected')
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

  return { status: sharedStatus, reconnectStatus, open, close, send }
}
