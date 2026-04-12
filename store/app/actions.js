import WebSocket from 'isomorphic-ws'

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

    // Bağlantı açıldığında client IP'yi gönder
    ws.addEventListener('open', async () => {
      try {
        const response = await fetch('https://ipinfo.io/json')
        const ipData = await response.json()

        if (ipData && ipData.ip && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'set_client_ip',
              ip: ipData.ip
            })
          )
        }
      } catch (error) {
        console.error('Error fetching client IP:', error)
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

    // Chat raporları WS üzerinden gönderilir (IP sunucu tarafında eklenir)
    if (scope === 'chat' && state.ws && state.ws.readyState === WebSocket.OPEN) {
      let parsedAdditional = {}

      try {
        parsedAdditional = additional ? JSON.parse(additional) : {}
      } catch {
        parsedAdditional = {}
      }

      const reportedMessage = parsedAdditional.reportedMessage

      if (!reportedMessage) {
        return { data: null, error: 'Raporlanacak mesaj bulunamadı' }
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
                resolve({ data: null, error: responseData.error || 'Rapor oluşturulamadı' })
              }
            }
          } catch {
            // JSON parse hatası, bu mesaj bizim beklediğimiz değil, yoksay
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

        // 10 saniye timeout
        const timeout = setTimeout(() => {
          state.ws.removeEventListener('message', handler)
          resolve({ data: null, error: 'Zaman aşımı' })
        }, 10000)
      })
    }

    // Diğer raporlar (profile, review) mevcut HTTP akışı ile
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
