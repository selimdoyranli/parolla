import { USERNAME_REGEX } from '@/system/constant'
import { generateGuestIdentity, generateGuestUsername, uuidV4 } from '@/helpers/guest-identity'

export default {
  ensure({ commit, state }) {
    if (state.id && state.name && state.avatarSeed) return
    const fresh = generateGuestIdentity()
    commit('SET_IDENTITY', {
      id: state.id || fresh.id,
      name: state.name || fresh.name,
      avatarSeed: state.avatarSeed || fresh.avatarSeed
    })
  },
  regenerateName({ commit }) {
    commit('SET_IDENTITY', { name: generateGuestUsername() })
  },
  regenerateAvatar({ commit }) {
    commit('SET_IDENTITY', { avatarSeed: uuidV4() })
  },
  regenerateAll({ commit, state }) {
    commit('SET_IDENTITY', {
      id: state.id || uuidV4(),
      name: generateGuestUsername(),
      avatarSeed: uuidV4()
    })
  },
  setName({ commit }, name) {
    if (!USERNAME_REGEX.test(String(name || ''))) {
      return { ok: false, error: 'common.invalidUsername' }
    }
    commit('SET_IDENTITY', { name })

    return { ok: true, error: null }
  },
  setAvatarSeed({ commit }, seed) {
    if (!seed || typeof seed !== 'string') return { ok: false, error: 'invalid' }
    commit('SET_IDENTITY', { avatarSeed: seed })

    return { ok: true, error: null }
  },
  clear({ commit }) {
    commit('CLEAR_IDENTITY')
  }
}
