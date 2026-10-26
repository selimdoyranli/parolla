<template lang="pug">
Dialog.dialog.gift-dialog(
  v-model="state.isOpen"
  get-container="body"
  :title="$t('gift.title')"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="!busy"
  @closed="$emit('closed')"
)
  .gift-dialog__body
    .gift-dialog__head
      PlayerAvatar(v-if="recipient" with-username :user="recipient" :size="40")
      button.gift-dialog__change(v-if="recipient && !player" type="button" :disabled="busy" @click="recipient = null")
        AppIcon(name="tabler:x" :width="16" :height="16")
      //- from the shop there is no profile in context: find the player by username
      Field.gift-dialog__recipient(
        v-if="!recipient"
        v-model="username"
        :placeholder="$t('gift.usernamePlaceholder')"
        :error-message="lookupError"
        :disabled="looking"
        @keyup.enter="lookup"
      )
        template(#button)
          button.shop-buy(type="button" :disabled="looking || !username.trim()" @click="lookup")
            Loading(v-if="looking" color="currentColor" size="14")
            span(v-else) {{ $t('gift.find') }}

    .gift-dialog__item(v-if="target")
      CosmeticCard(preview-only :variants="[target.item]" :viewer="recipient")
      b {{ target.item.name }}

    .gift-dialog__rows
      .gift-dialog__row(v-if="target")
        span {{ $t('economy.shop.price') }}
        GoldAmount(:amount="cost")
      .gift-dialog__row(v-else)
        span {{ $t('gift.amount') }}
        Stepper(v-model="amount" integer input-width="64px" :min="GIFT_MIN" :max="GIFT_MAX" :step="10" :disabled="busy")
      .gift-dialog__row
        span {{ $t('economy.shop.balance') }}
        GoldAmount(:amount="balance")
      .gift-dialog__row
        span {{ $t('economy.shop.balanceAfter') }}
        GoldAmount(:class="{ 'gift-dialog__negative': isShort }" :amount="balance - cost")

    Field.gift-dialog__note(
      v-model="note"
      type="textarea"
      :placeholder="$t('gift.notePlaceholder')"
      show-word-limit
      rows="2"
      autosize
      :maxlength="GIFT_NOTE_MAX"
      :disabled="busy"
    )

    i18n.gift-dialog__message(v-if="isShort" tag="p" path="economy.shop.insufficient")
      template(#balance)
        GoldAmount(size="sm" :amount="balance")
      template(#missing)
        GoldAmount(size="sm" :amount="cost - balance")

    .gift-dialog__actions
      button.shop-buy.shop-buy--block(type="button" :disabled="busy || isShort || !recipient" @click="send")
        Loading(v-if="busy" color="currentColor" size="16")
        template(v-else)
          AppIcon(name="tabler:gift" :width="16" :height="16")
          span {{ $t('gift.send') }}
          GoldAmount(size="sm" :amount="cost")
      button.shop-buy.shop-buy--neutral.shop-buy--block(type="button" :disabled="busy" @click="state.isOpen = false") {{ $t('general.cancel') }}
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, Stepper, Field, Loading, Notify } from 'vant'
import { newIdempotencyKey, isDefinitiveResponse } from '@/store/economy/actions'
import { userTransformer } from '@/transformers'

// mirrors parolla-strapi src/economy/gift.ts
const GIFT_MIN = 10
const GIFT_MAX = 5000
const GIFT_NOTE_MAX = 256

export default defineComponent({
  components: { Dialog: Dialog.Component, Stepper, Field, Loading },
  props: {
    isOpen: { type: Boolean, default: false },
    // fixed recipient (profile); without it the dialog asks for a username
    player: { type: Object, default: null },
    // shop item to buy as the gift: { item, price, fromVitrin }; without it the gift is gold
    target: { type: Object, default: null }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { play } = useSfx()
    const { i18n, $appFetch } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const busy = ref(false)
    const amount = ref(100)
    const note = ref('')
    let attemptKey = null // reused across retries of an ambiguous failure, reset after a definitive response

    const balance = computed(() => store.state.economy.wallet.gold)
    const cost = computed(() => (props.target ? props.target.price : Number(amount.value)))
    const isShort = computed(() => cost.value > balance.value)

    const recipient = ref(props.player)
    const username = ref('')
    const looking = ref(false)
    const lookupError = ref('')

    const lookup = async () => {
      const name = username.value.trim()

      if (!name || looking.value) return
      looking.value = true
      lookupError.value = ''

      const { data } = await $appFetch({ path: `users/by-username/${encodeURIComponent(name)}` })

      looking.value = false

      if (!data || !data.id) lookupError.value = i18n.t('gift.userNotFound')
      else if (store.getters['auth/user'] && data.id === store.getters['auth/user'].id)
        lookupError.value = i18n.t('economy.errors.self-gift')
      else recipient.value = userTransformer(data)
    }

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          amount.value = 100
          note.value = ''
          recipient.value = props.player
          username.value = ''
          lookupError.value = ''
          attemptKey = null
          store.dispatch('economy/fetchWallet')
        }
      }
    )

    const notify = (message, ok, duration = 3000) =>
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
        duration
      })

    const send = async () => {
      if (busy.value) return
      busy.value = true

      try {
        attemptKey = attemptKey || newIdempotencyKey()

        const { error } = props.target
          ? await store.dispatch('economy/giftItem', {
              toUserId: recipient.value.id,
              itemKey: props.target.item.key,
              fromVitrin: Boolean(props.target.fromVitrin),
              note: note.value,
              idempotencyKey: attemptKey
            })
          : await store.dispatch('economy/sendGift', {
              toUserId: recipient.value.id,
              amount: Number(amount.value),
              note: note.value,
              idempotencyKey: attemptKey
            })

        if (isDefinitiveResponse(error)) attemptKey = null

        if (error) {
          const key = `economy.errors.${error.details && error.details.code}`

          play('error')
          notify(i18n.te(key) ? i18n.t(key) : i18n.t('gift.error'), false)

          if (error.code === 402) store.dispatch('economy/fetchWallet')

          if (error.details && error.details.code === 'vitrin-expired') emit('vitrin-expired')

          return
        }

        play('success')
        // item gifts close the purchase dialog too, so the toast is the only confirmation left: keep it longer
        notify(i18n.t('gift.success', { username: recipient.value.username }), true, props.target ? 6000 : 3000)
        state.isOpen = false
        emit('sent')
      } finally {
        busy.value = false
      }
    }

    return {
      GIFT_MIN,
      GIFT_MAX,
      GIFT_NOTE_MAX,
      state,
      busy,
      amount,
      note,
      balance,
      cost,
      isShort,
      recipient,
      username,
      looking,
      lookupError,
      lookup,
      send
    }
  }
})
</script>

<style lang="scss" src="./GiftDialog.component.scss"></style>
