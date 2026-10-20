import { useContext, useStore } from '@nuxtjs/composition-api'
import { Notify } from 'vant'

const SLOT = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  name_color: 'nameColor',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

// G4-1: one change at a time, then a short cooldown (the server also rate-limits loadout changes).
// Module-level so the shop and the inventory share one gate.
const COOLDOWN_MS = 700
let busy = false
let lastOk = 0

// Equips/unequips one owned cosmetic. PUT /loadout replaces the whole loadout, so the current one is
// refetched first and the item's slot merged in; saveLoadout also updates the auth user (header avatar).
export default () => {
  const store = useStore()
  const { i18n } = useContext()
  const { play } = useSfx()

  const notify = (message, ok) =>
    Notify({
      message,
      color: 'var(--color-text-04)',
      background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
      duration: 2500
    })

  const errorText = error => {
    const key = `economy.errors.${error.details && error.details.code}`

    return i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic')
  }

  // key null unequips; resolves true on success; on failure toasts unless the caller shows its own message
  const setSlot = async (item, key, { toastError = true } = {}) => {
    if (busy || Date.now() - lastOk < COOLDOWN_MS) {
      if (toastError) notify(i18n.t('economy.errors.loadout-too-fast'), false)

      return false
    }

    busy = true

    try {
      const inv = await store.dispatch('economy/fetchInventory')
      // never PUT without the real current loadout: it replaces the whole thing
      const { error } = inv.error
        ? inv
        : await store.dispatch('economy/saveLoadout', { ...(store.state.economy.inventory.loadout || {}), [SLOT[item.category]]: key })

      if (error) {
        if (toastError) notify(errorText(error), false)

        return false
      }

      lastOk = Date.now()
      play('confirm')
      notify(i18n.t(key ? 'economy.shop.equipped' : 'economy.collection.unequipped'), true)

      return true
    } finally {
      busy = false
    }
  }

  const equip = (item, options) => setSlot(item, item.key, options)
  const unequip = (item, options) => setSlot(item, null, options)

  return { equip, unequip, slotOf: item => SLOT[item.category] }
}
