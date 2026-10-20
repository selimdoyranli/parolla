<template lang="pug">
Dialog.dialog.purchase-dialog(
  v-model="state.isOpen"
  get-container="body"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="!busy"
  @closed="$emit('closed')"
)
  .purchase-dialog__body(v-if="target")
    .purchase-dialog__preview(v-if="target.item")
      CosmeticCard(preview-only :variants="[target.item]" :viewer="viewer")
    .purchase-dialog__set-icon(v-else)
      AppIcon(name="tabler:packages" :width="40" :height="40")

    .purchase-dialog__head
      b.purchase-dialog__name {{ title }}
      Tag.cosmetic-card__rarity(v-if="target.item" round :class="`cosmetic-card__rarity--${target.item.rarity}`")
        | {{ $t(`economy.shop.rarity.${target.item.rarity}`) }}
      p.purchase-dialog__set(v-else) {{ $t('economy.shop.setContent', { count: target.count }) }}

    .purchase-dialog__rows
      .purchase-dialog__row
        span {{ $t('economy.shop.price') }}
        span.purchase-dialog__price
          GoldAmount(v-if="target.original" size="sm" strike muted :amount="target.original")
          GoldAmount(:amount="target.price")
      .purchase-dialog__row
        span {{ $t('economy.shop.balance') }}
        GoldAmount(:amount="balance")
      .purchase-dialog__row(v-if="phase !== 'success'")
        span {{ $t('economy.shop.balanceAfter') }}
        GoldAmount(:class="{ 'purchase-dialog__negative': missing > 0 }" :amount="balance - target.price")

    i18n.purchase-dialog__message(v-if="isShort" tag="p" path="economy.shop.insufficient")
      template(#balance)
        GoldAmount(size="sm" :amount="balance")
      template(#missing)
        GoldAmount(size="sm" :amount="missing")
    p.purchase-dialog__message(v-else-if="phase === 'error'") {{ errorText }}
    p.purchase-dialog__message.purchase-dialog__message--ok(v-else-if="phase === 'success'")
      AppIcon(name="tabler:circle-check" :width="18" :height="18")
      span {{ $t('economy.shop.purchased') }}
    p.purchase-dialog__message(v-if="phase === 'success' && equipError") {{ $t('economy.shop.equipFailed') }}

    .purchase-dialog__actions
      template(v-if="phase === 'success'")
        button.shop-buy.shop-buy--block(v-if="target.item" type="button" :disabled="busy" @click="equip")
          Loading(v-if="busy" color="currentColor" size="16")
          span(v-else) {{ $t('economy.shop.equip') }}
        button.shop-buy.shop-buy--neutral.shop-buy--block(type="button" @click="state.isOpen = false") {{ $t('general.close') }}
      template(v-else)
        button.shop-buy.shop-buy--block(type="button" :disabled="busy || missing > 0" @click="confirm")
          Loading(v-if="busy" color="currentColor" size="16")
          template(v-else)
            span {{ $t('economy.shop.confirm') }}
            GoldAmount(size="sm" :amount="target.price")
        button.shop-buy.shop-buy--neutral.shop-buy--block(type="button" :disabled="busy" @click="isPreviewOpen = true")
          AppIcon(name="tabler:eye" :width="16" :height="16")
          span {{ $t('economy.collection.previewOpen') }}
        button.shop-buy.shop-buy--neutral.shop-buy--block(type="button" :disabled="busy" @click="state.isOpen = false") {{ $t('general.cancel') }}

  LazyPreviewDialog(v-if="viewer" :isOpen="isPreviewOpen" :patch="previewPatch" @closed="isPreviewOpen = false")
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, Tag, Loading } from 'vant'
import { newIdempotencyKey, isDefinitiveResponse } from '@/store/economy/actions'

export default defineComponent({
  components: { Dialog: Dialog.Component, Tag, Loading },
  props: {
    isOpen: { type: Boolean, default: false },
    // { item, price, original, fromVitrin } or { series, name, count, price, items }
    target: { type: Object, default: null }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { play } = useSfx()
    const { i18n, $auth } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const busy = ref(false)
    const phase = ref('confirm') // confirm | insufficient | error | success
    const errorText = ref('')
    const equipError = ref(false)
    const isPreviewOpen = ref(false)
    let attemptKey = null // reused across retries of an ambiguous failure, reset after a definitive response

    const balance = computed(() => store.state.economy.wallet.gold)
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
          equipError.value = false
          attemptKey = null
        }
      }
    )

    const fail = error => {
      const code = error.details && error.details.code

      play('error')

      if (code === 'insufficient-gold' || error.code === 402) {
        phase.value = 'insufficient'
        store.dispatch('economy/fetchWallet')

        return
      }

      if (code === 'already-owned' || code === 'nothing-to-buy') store.dispatch('economy/fetchInventory')

      if (code === 'vitrin-expired') emit('vitrin-expired')

      const key = `economy.errors.${code}`

      errorText.value = i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic')
      phase.value = 'error'
    }

    const confirm = async () => {
      if (busy.value) return
      busy.value = true

      try {
        const { target } = props

        attemptKey = attemptKey || newIdempotencyKey()

        const { error } = target.item
          ? await store.dispatch('economy/purchase', {
              itemKey: target.item.key,
              fromVitrin: Boolean(target.fromVitrin),
              idempotencyKey: attemptKey
            })
          : await store.dispatch('economy/purchaseSet', { series: target.series, idempotencyKey: attemptKey })

        // an error with an HTTP status is a definitive answer; without one (network) the next try reuses the key
        if (isDefinitiveResponse(error)) attemptKey = null

        if (error) return fail(error)

        phase.value = 'success'
        play('success')
        await store.dispatch('economy/fetchInventory')
        emit('purchased')
      } finally {
        busy.value = false
      }
    }

    const { equip: equipItem, slotOf } = useEquip()

    // the item (or every item of the set) put on its slot over the current loadout
    const previewPatch = computed(() => {
      const t = props.target
      const items = t ? (t.item ? [t.item] : t.items || []) : []

      return Object.fromEntries(items.map(i => [slotOf(i), i.key]))
    })

    const equip = async () => {
      if (busy.value) return
      busy.value = true

      equipError.value = false

      try {
        if (await equipItem(props.target.item, { toastError: false })) state.isOpen = false
        else equipError.value = true
      } finally {
        busy.value = false
      }
    }

    return {
      state,
      busy,
      phase,
      errorText,
      equipError,
      isPreviewOpen,
      previewPatch,
      balance,
      missing,
      isShort,
      viewer,
      title,
      confirm,
      equip
    }
  }
})
</script>

<style lang="scss" src="./PurchaseDialog.component.scss"></style>
