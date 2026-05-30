import { computed, getCurrentInstance } from '@nuxtjs/composition-api'

export const useGuestIdentity = () => {
  const vm = getCurrentInstance().proxy
  const $store = vm.$store
  const $auth = vm.$auth

  const isGuest = computed(() => !($auth && $auth.loggedIn))

  const identity = computed(() => ({
    id: $store.state.draw.guest.id,
    name: $store.state.draw.guest.name,
    avatarSeed: $store.state.draw.guest.avatarSeed
  }))

  const ensureIdentity = () => {
    $store.dispatch('draw/guest/ensure')
  }

  const regenerateName = () => {
    $store.dispatch('draw/guest/regenerateName')
  }

  const regenerateAvatar = () => {
    $store.dispatch('draw/guest/regenerateAvatar')
  }

  const regenerateAll = () => {
    $store.dispatch('draw/guest/regenerateAll')
  }

  const setName = name => $store.dispatch('draw/guest/setName', name)

  return {
    isGuest,
    identity,
    ensureIdentity,
    regenerateName,
    regenerateAvatar,
    regenerateAll,
    setName
  }
}
