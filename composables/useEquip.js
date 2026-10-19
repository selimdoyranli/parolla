import { useContext, useStore } from '@nuxtjs/composition-api'
import { Notify } from 'vant'

const SLOT = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  nameplate: 'nameplate',
  name_color: 'nameColor',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

// Equips one owned cosmetic. PUT /loadout replaces the whole loadout, so the current one is
// refetched first and the item's slot merged in; saveLoadout also updates the auth user (header avatar).
export default () => {
  const store = useStore()
  const { i18n } = useContext()

  const notify = (message, ok) =>
    Notify({
      message,
      color: 'var(--color-text-04)',
      background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
      duration: 2500
    })

  // resolves true on success; on failure toasts unless the caller shows its own message
  const equip = async (item, { toastError = true } = {}) => {
    const inv = await store.dispatch('economy/fetchInventory')
    // never PUT without the real current loadout: it replaces the whole thing
    const { error } = inv.error
      ? inv
      : await store.dispatch('economy/saveLoadout', { ...(store.state.economy.inventory.loadout || {}), [SLOT[item.category]]: item.key })

    if (error) {
      if (toastError) notify(i18n.t('economy.errors.generic'), false)

      return false
    }

    notify(i18n.t('economy.shop.equipped'), true)

    return true
  }

  return { equip }
}
