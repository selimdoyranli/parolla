<template lang="pug">
Dialog.dialog.purchase-dialog(
  v-model="state.isOpen"
  :title="title"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="!busy"
  @closed="$emit('closed')"
)
  .purchase-dialog__body(v-if="target")
    CosmeticCard(v-if="target.item" preview-only :variants="[target.item]" :viewer="viewer")
    p.purchase-dialog__set(v-else) {{ $t('economy.shop.setContent', { count: target.count }) }}

    .purchase-dialog__row
      span {{ $t('economy.shop.price') }}
      b
        s(v-if="target.original") {{ target.original }}
        | {{ target.price }}
    .purchase-dialog__row
      span {{ $t('economy.shop.balance') }}
      b {{ balance }}
    .purchase-dialog__row(v-if="phase !== 'success'")
      span {{ $t('economy.shop.balanceAfter') }}
      b(:class="{ 'purchase-dialog__negative': missing > 0 }") {{ balance - target.price }}

    p.purchase-dialog__message(v-if="isShort") {{ $t('economy.shop.insufficient', { balance, missing }) }}
    p.purchase-dialog__message(v-else-if="phase === 'error'") {{ errorText }}
    p.purchase-dialog__message.purchase-dialog__message--ok(v-else-if="phase === 'success'") {{ $t('economy.shop.purchased') }}

    .purchase-dialog__actions
      template(v-if="phase === 'success'")
        Button(v-if="target.item" type="primary" block round :loading="busy" @click="equip") {{ $t('economy.shop.equip') }}
        Button(block round @click="state.isOpen = false") {{ $t('general.close') }}
      template(v-else)
        Button(type="primary" block round :loading="busy" :disabled="missing > 0" @click="confirm") {{ $t('economy.shop.confirm') }}
        Button(block round :disabled="busy" @click="state.isOpen = false") {{ $t('general.cancel') }}
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, Button, Notify } from 'vant'

const SLOT = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  nameplate: 'nameplate',
  name_color: 'nameColor',
  title: 'title',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

export default defineComponent({
  components: { Dialog: Dialog.Component, Button },
  props: {
    isOpen: { type: Boolean, default: false },
    // { item, price, original, fromVitrin } or { series, name, count, price }
    target: { type: Object, default: null }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const busy = ref(false)
    const phase = ref('confirm') // confirm | insufficient | error | success
    const errorText = ref('')

    const balance = computed(() => store.state.economy.wallet.jeton)
    const missing = computed(() => (props.target ? Math.max(0, props.target.price - balance.value) : 0))
    const isShort = computed(() => phase.value === 'insufficient' || (phase.value === 'confirm' && missing.value > 0))
    const viewer = computed(() => ($auth.loggedIn ? $auth.user : null))
    const title = computed(() => (props.target && props.target.item ? props.target.item.name : props.target && props.target.name))

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          phase.value = 'confirm'
          errorText.value = ''
        }
      }
    )

    const fail = error => {
      const code = error.details && error.details.code

      if (code === 'insufficient-jeton' || error.code === 402) {
        phase.value = 'insufficient'

        return
      }

      const key = `economy.errors.${code}`

      errorText.value = i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic')
      phase.value = 'error'
    }

    const confirm = async () => {
      if (busy.value) return
      busy.value = true

      try {
        const { target } = props
        const { error } = target.item
          ? await store.dispatch('economy/purchase', { itemKey: target.item.key, fromVitrin: Boolean(target.fromVitrin) })
          : await store.dispatch('economy/purchaseSet', target.series)

        if (error) return fail(error)

        phase.value = 'success'
        await store.dispatch('economy/fetchInventory')
        emit('purchased')
      } finally {
        busy.value = false
      }
    }

    // PUT replaces the whole loadout, so send the current one plus the new slot
    const equip = async () => {
      if (busy.value) return
      busy.value = true

      try {
        await store.dispatch('economy/fetchInventory')

        const current = (store.state.economy.inventory && store.state.economy.inventory.loadout) || {}
        const { data, error } = await store.dispatch('economy/saveLoadout', {
          ...current,
          [SLOT[props.target.item.category]]: props.target.item.key
        })

        if (error) return fail(error)

        store.commit('auth/SET_USER', { ...$auth.user, loadout: data.loadout })
        Notify({
          message: i18n.t('economy.shop.equipped'),
          color: 'var(--color-text-04)',
          background: 'var(--color-success-01)',
          duration: 2500
        })
        state.isOpen = false
      } finally {
        busy.value = false
      }
    }

    return { state, busy, phase, errorText, balance, missing, isShort, viewer, title, confirm, equip }
  }
})
</script>

<style lang="scss" src="./PurchaseDialog.component.scss"></style>
