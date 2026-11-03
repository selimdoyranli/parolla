import { useStore } from '@nuxtjs/composition-api'

const idOf = p => (p.playerId !== undefined ? p.playerId : p.id)
const isGuest = p => Boolean(p.isGuest) || String(idOf(p)).startsWith('guest_')

/** A party player / leaderboard row as the app's user shape (PlayerAvatar, PlayerList, Leaderboard). */
export const partyToUser = p => ({
  id: idOf(p),
  username: p.name,
  diceBear: p.diceBear,
  profilePhoto: p.profilePhoto,
  avatarSource: p.avatarSource,
  role: p.role,
  loadout: p.loadout,
  isGuest: isGuest(p)
})

/**
 * Party players / leaderboard rows (`id` or `playerId`, `name`) as the app's user shape, plus the GM mark
 * and the player dialog every user in party opens. Guests (`guest_<uuid>` ids) have no profile to open.
 */
export const usePartyUser = () => {
  const store = useStore()
  const toUser = partyToUser

  const isGm = p => p.role?.name === 'GM'

  // same commits as PlayerAvatar's own dialog opener
  const openPlayer = p => {
    if (isGuest(p)) return

    store.commit('profile/SET_PLAYER_ID', idOf(p))
    store.commit('profile/SET_PLAYER_USERNAME', p.name)
    store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
  }

  // the live-room "more" menu (profile / report / kick), as PlayerAvatar opens it; a guest's own row has nothing to offer
  const openPlayerActions = p => {
    const { id, username, diceBear } = partyToUser(p)

    if (isGuest(p) && String(id) === String(store.state.party.myId)) return

    store.commit('profile/SET_PLAYER_ACTIONS_DIALOG', {
      isOpen: true,
      player: { id, username, diceBear, isGuest: isGuest(p) },
      context: 'party'
    })
  }

  return { toUser, isGuest, isGm, openPlayer, openPlayerActions }
}
