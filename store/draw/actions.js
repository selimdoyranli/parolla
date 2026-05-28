import { wsTypeEnum } from '@/enums/wsType.enum'
import { showToast } from '@/helpers/toast'

export default {
  handleMessage({ commit }, message) {
    if (!message || !message.type) return

    switch (message.type) {
      case wsTypeEnum.DRAW_ROOM_LIST_UPDATE:
        commit('SET_PUBLIC_ROOMS', message.rooms)
        break
      case wsTypeEnum.DRAW_ROOM_STATE:
        commit('SET_ROOM_STATE', message)
        break
      case wsTypeEnum.DRAW_WORD_OPTIONS:
        commit('SET_WORD_OPTIONS', message)
        break
      case wsTypeEnum.DRAW_ROUND_START:
        commit('CLEAR_WORD_OPTIONS')
        commit('ROUND_START', message)
        break
      case wsTypeEnum.DRAW_TIME_UPDATE:
        commit('TIME_UPDATE', message.remainingMs)
        break
      case wsTypeEnum.DRAW_STROKE_CHUNK:
        commit('PUSH_STROKE', message)
        break
      case wsTypeEnum.DRAW_STROKE_END:
        commit('STROKE_END', message.strokeId)
        break
      case wsTypeEnum.DRAW_CLEAR:
        commit('CLEAR_STROKES')
        break
      case wsTypeEnum.DRAW_UNDO:
        commit('POP_STROKE')
        break
      case wsTypeEnum.DRAW_STATE_SNAPSHOT:
        commit('APPLY_SNAPSHOT', message)
        break
      case wsTypeEnum.DRAW_CHAT:
        // Preserve server's isSystem / systemKind flags so info / danger
        // system messages (join, leave, kick, pick skipped) render with
        // the right icon + color instead of being forced into player-row UI.
        commit('PUSH_CHAT', message)
        break
      case wsTypeEnum.DRAW_CLOSE_GUESS:
        commit('PUSH_CLOSE_GUESS', message.guess)
        break
      case wsTypeEnum.DRAW_CORRECT_GUESS:
        commit('MARK_GUESSED', message)
        break
      case wsTypeEnum.DRAW_PLAYER_GUESSED:
        commit('MARK_PLAYER_GUESSED', message.playerId)
        commit('PUSH_CHAT', {
          isSystem: true,
          systemKind: 'success',
          message: `${message.playerName} doğru bildi (+${message.scoreEarned})`,
          timestamp: Date.now()
        })
        break
      case wsTypeEnum.DRAW_ROUND_END:
        commit('ROUND_END', message)
        break
      case wsTypeEnum.DRAW_GAME_END:
        commit('GAME_END', message)
        break
      case wsTypeEnum.DRAW_ERROR:
        commit('SET_ERROR', { code: message.code, message: message.message })
        // eslint-disable-next-line no-console
        console.warn('[draw] server error:', message.code, message.message)
        try {
          showToast.fail(message.message || `Hata: ${message.code}`, {
            duration: 5000,
            className: 'rate-limit-toast'
          })
        } catch (_e) {
          /* ignore toast plugin not ready */
        }
        break
      default:
        break
    }
  }
}
