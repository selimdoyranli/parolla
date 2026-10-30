import { wsTypeEnum } from '@/enums/wsType.enum'
import { showToast } from '@/helpers/toast'

export default {
  handleMessage({ commit }, m) {
    if (!m || !m.type) return

    switch (m.type) {
      case wsTypeEnum.PARTY_ROOM_STATE:
        commit('SET_ROOM_STATE', m.room)
        break
      case wsTypeEnum.PARTY_ROUND_START:
        commit('ROUND_START', m)
        break
      case wsTypeEnum.PARTY_ANSWER_ACK:
        commit('ANSWER_ACK', m.text)
        break
      case wsTypeEnum.PARTY_ANSWER_RETRY:
        commit('ANSWER_RETRY', m)
        break
      case wsTypeEnum.PARTY_PROGRESS:
        commit('SET_PROGRESS', m)
        break
      case wsTypeEnum.PARTY_VOTES:
        commit('SET_VOTES', m)
        break
      case wsTypeEnum.PARTY_ROUND_END:
        commit('ROUND_END', m)
        break
      case wsTypeEnum.PARTY_FINAL:
        commit('FINAL', m)
        break
      case wsTypeEnum.PARTY_CANCELLED:
        commit('CANCELLED', m)
        break
      case wsTypeEnum.PARTY_CLOSED:
        commit('CLOSED', m.reason)
        break
      case wsTypeEnum.PARTY_CHAT:
        commit('PUSH_CHAT', m)
        break
      case wsTypeEnum.PARTY_EMOJI:
        commit('PUSH_EMOJI', m)
        break
      case wsTypeEnum.PARTY_ERROR: {
        commit('SET_ERROR', { code: m.code, message: m.message })
        const key = `party.errors.${m.code}`
        showToast.fail(this.$i18n.te(key) ? this.$i18n.t(key) : m.message || m.code)
        break
      }
      default:
        break
    }
  }
}
