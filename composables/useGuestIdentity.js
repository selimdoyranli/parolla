import { computed, getCurrentInstance } from '@nuxtjs/composition-api'

export const useGuestIdentity = () => {
  const vm = getCurrentInstance().proxy
  const $store = vm.$store
  const $auth = vm.$auth

  const isGuest = computed(() => !($auth && $auth.loggedIn))

  const identity = computed(() => ({
    id: $store.state.guest.id,
    name: $store.state.guest.name,
    avatarSeed: $store.state.guest.avatarSeed
  }))

  const ensureIdentity = () => {
    $store.dispatch('guest/ensure')
  }

  const regenerateName = () => {
    $store.dispatch('guest/regenerateName')
  }

  const regenerateAvatar = () => {
    $store.dispatch('guest/regenerateAvatar')
  }

  const regenerateAll = () => {
    $store.dispatch('guest/regenerateAll')
  }

  const setName = name => $store.dispatch('guest/setName', name)

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
