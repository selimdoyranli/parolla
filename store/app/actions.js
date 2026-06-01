import WebSocket from 'isomorphic-ws'
import { getDrawSocket, isDrawSocketReady } from '@/composables/useDrawSocket'
import { fetchClientIp } from '@/helpers/client-ip'

export default {
  initWs({ commit, rootState, state }) {
    // Check if WebSocket already exists and is connecting or open
    if (state.ws) {
      const readyState = state.ws.readyState

      if (readyState === WebSocket.CONNECTING || readyState === WebSocket.OPEN) {
        console.log('WebSocket already exists, skipping initialization')

        return state.ws
      }
    }

    // Try to get token from multiple sources
    const token =
      this.$auth.strategy.token.get() || this.$cookies.get('auth._token.google') || (rootState.nuxtAuth && rootState.nuxtAuth.token)

    console.log('Initializing WebSocket with token:', token ? 'Token found' : 'No token (viewer mode)')

    // Build WebSocket URL with token if available
    const wsUrl = token ? `${process.env.WS_URL}?token=${token}` : process.env.WS_URL

    // Create WebSocket instance
    const ws = new WebSocket(wsUrl)

    ws.addEventListener('open', async () => {
      const ip = await fetchClientIp()

      if (ip && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'set_client_ip', ip }))
      }
    })

    commit('SET_WS', ws)

    return ws
  },

  closeWs({ commit, state }) {
    if (state.ws) {
      state.ws.close(1000, 'Client disconnecting')
    }

    commit('SET_WS', null)
  },

  async fetchAnnouncements({ commit }) {
    const { data, error } = await this.$appFetch({
      path: 'announcements',
      query: {
        locale: this.$i18n.locale,
        sort: 'createdAt:desc'
      }
    })

    return {
      data,
      error
    }
  },

  async report({ commit, state }, params) {
    const { scope, detail, additional } = params

    if (scope === 'drawChat' && isDrawSocketReady()) {
      let parsedAdditional = {}

      try {
        parsedAdditional = additional ? JSON.parse(additional) : {}
      } catch {
        parsedAdditional = {}
      }

      const reportedMessage = parsedAdditional.reportedMessage

      if (!reportedMessage) {
        return { data: null, error: 'Reported message not found' }
      }

      const drawSocket = getDrawSocket()

      return new Promise(resolve => {
        const handler = event => {
          try {
            const responseData = JSON.parse(event.data)

            if (responseData.type === 'draw_report_chat_message_result') {
              drawSocket.removeEventListener('message', handler)
              clearTimeout(timeout)

              if (responseData.success) {
                resolve({ data: { data: { id: responseData.reportId } }, error: null })
              } else {
                resolve({ data: null, error: responseData.error || 'Failed to create report' })
              }
            }
          } catch {
            // Not JSON or not our message — keep listening.
          }
        }

        drawSocket.addEventListener('message', handler)

        drawSocket.send(
          JSON.stringify({
            type: 'draw_report_chat_message',
            messageTimestamp: reportedMessage.timestamp,
            messagePlayerId: reportedMessage.playerId,
            detail: detail
          })
        )

        const timeout = setTimeout(() => {
          drawSocket.removeEventListener('message', handler)
          resolve({ data: null, error: 'Request timeout' })
        }, 10000)
      })
    }

    // Chat reports are sent through WS (IP is added server-side)
    if (scope === 'chat' && state.ws && state.ws.readyState === WebSocket.OPEN) {
      let parsedAdditional = {}

      try {
        parsedAdditional = additional ? JSON.parse(additional) : {}
      } catch {
        parsedAdditional = {}
      }

      const reportedMessage = parsedAdditional.reportedMessage

      if (!reportedMessage) {
        return { data: null, error: 'Reported message not found' }
      }

      return new Promise(resolve => {
        const handler = event => {
          try {
            const responseData = JSON.parse(event.data)

            if (responseData.type === 'report_chat_message_result') {
              state.ws.removeEventListener('message', handler)
              clearTimeout(timeout)

              if (responseData.success) {
                resolve({ data: { data: { id: responseData.reportId } }, error: null })
              } else {
                resolve({ data: null, error: responseData.error || 'Failed to create report' })
              }
            }
          } catch {
            // JSON parse error, not the message we're waiting for, ignore
          }
        }

        state.ws.addEventListener('message', handler)

        state.ws.send(
          JSON.stringify({
            type: 'report_chat_message',
            messageTimestamp: reportedMessage.timestamp,
            messagePlayerId: reportedMessage.playerId,
            detail: detail
          })
        )

        // 10 second timeout
        const timeout = setTimeout(() => {
          state.ws.removeEventListener('message', handler)
          resolve({ data: null, error: 'Request timeout' })
        }, 10000)
      })
    }

    // Other reports (profile, review) go through existing HTTP flow
    const user = this.$auth.user
    let parsedAdditional = {}

    try {
      parsedAdditional = additional ? JSON.parse(additional) : {}
    } catch {
      parsedAdditional = additional ? { raw: additional } : {}
    }

    const mergedAdditional = JSON.stringify({
      reportFromUser: user ? { id: user.id, username: user.username, email: user.email } : null,
      ...parsedAdditional
    })

    const { data, error } = await this.$appFetch({
      path: `reports`,
      method: 'POST',
      data: {
        data: {
          scope,
          detail,
          additional: mergedAdditional.slice(0, 5012)
        }
      }
    })

    return {
      data,
      error
    }
  },

  async uploadReportMedia({ commit }, { file, path, ref, refId, field }) {
    const token = this.$auth.strategy.token.get()

    const formData = new FormData()

    formData.append('files', file)
    formData.append('path', path)
    formData.append('ref', ref)
    formData.append('refId', refId)
    formData.append('field', field)

    const { data, error } = await this.$appFetch({
      path: `reports/upload-media`,
      method: 'POST',
      data: formData,
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return {
      data,
      error
    }
  }
}
