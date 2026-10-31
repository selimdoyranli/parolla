import { useStore } from '@nuxtjs/composition-api'

/**
 * Party players / leaderboard rows (`id` or `playerId`, `name`) as the app's user shape, plus the GM mark
 * and the player dialog every user in party opens. Guests (`guest_<uuid>` ids) have no profile to open.
 */
export const usePartyUser = () => {
  const store = useStore()

  const idOf = p => (p.playerId !== undefined ? p.playerId : p.id)
  const isGuest = p => Boolean(p.isGuest) || String(idOf(p)).startsWith('guest_')

  const toUser = p => ({
    id: idOf(p),
    username: p.name,
    diceBear: p.diceBear,
    profilePhoto: p.profilePhoto,
    avatarSource: p.avatarSource,
    role: p.role,
    loadout: p.loadout,
    isGuest: isGuest(p)
  })

  const isGm = p => p.role?.name === 'GM'

  // same commits as PlayerAvatar's own dialog opener
  const openPlayer = p => {
    if (isGuest(p)) return

    store.commit('profile/SET_PLAYER_ID', idOf(p))
    store.commit('profile/SET_PLAYER_USERNAME', p.name)
    store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
  }

  return { toUser, isGuest, isGm, openPlayer }
}
