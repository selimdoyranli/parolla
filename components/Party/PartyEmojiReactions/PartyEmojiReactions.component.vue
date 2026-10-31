<template lang="pug">
.party-emoji-reactions
  //- floating reactions from everyone (the server echoes our own back too)
  .party-emoji-reactions__floats(aria-hidden="true")
    span.party-emoji-reactions__float(
      v-for="item in floats"
      :key="item.key"
      :style="{ left: `${item.left}%` }"
      @animationend="remove(item.key)"
    )
      | {{ item.emoji }}
      small.party-emoji-reactions__name(v-if="item.name")
        | {{ item.name }}
        span.gm-username-extra(v-if="item.isGm") &nbsp;(GM)

  .party-emoji-reactions__dock(v-if="canSend")
    //- after a burst the server holds reactions for a while: every button shows the time left as a draining ring
    .party-emoji-reactions__picker(v-if="isOpen")
      button.party-emoji-reactions__pick(
        v-for="emoji in emojis"
        :key="emoji"
        type="button"
        :class="{ 'is-cooling': cooling }"
        :disabled="cooling"
        @click="sendEmoji(emoji)"
      )
        | {{ emoji }}
        svg.party-emoji-reactions__ring(v-if="cooling" viewBox="0 0 36 36" aria-hidden="true")
          circle(cx="18" cy="18" r="16" pathLength="100" :stroke-dashoffset="100 - left * 100")
    button.party-emoji-reactions__toggle(
      type="button"
      :class="{ 'is-cooling': cooling }"
      :aria-label="$t('party.emoji.open')"
      :aria-expanded="String(isOpen)"
      @click="isOpen = !isOpen"
    )
      AppIcon(:name="isOpen ? 'tabler:x' : 'tabler:mood-smile'" :width="20" :height="20")
      svg.party-emoji-reactions__ring(v-if="cooling" viewBox="0 0 36 36" aria-hidden="true")
        circle(cx="18" cy="18" r="16" pathLength="100" :stroke-dashoffset="100 - left * 100")
</template>

<script>
import { defineComponent, ref, computed, watch, inject, onBeforeUnmount, useStore } from '@nuxtjs/composition-api'
import { wsTypeEnum } from '@/enums/wsType.enum'

// same list the server accepts (parolla-ws messageHandler PARTY_EMOJIS)
const PARTY_EMOJIS = ['👏', '😂', '🔥', '😮', '😢', '❤️']

export default defineComponent({
  setup() {
    const store = useStore()
    const send = inject('partySend')
    const isOpen = ref(false)
    // reactions sent in the lobby would otherwise all float at once when the game starts
    const startKey = Math.max(0, ...store.state.party.emojis.map(e => e.key))
    // always on (chat setting or not); the short cancelled screen needs the corner for its own content
    const canSend = computed(() => !store.state.party.cancelled)

    // the sender's nickname from the room (a player who left meanwhile just gets no label)
    const playerOf = id => store.getters['party/players'].find(p => p.id === id)
    const floats = computed(() =>
      store.state.party.emojis
        .filter(e => e.key > startKey)
        .map(e => {
          const p = playerOf(e.playerId)

          return { ...e, name: p?.name || '', isGm: p?.role?.name === 'GM', left: 8 + ((e.key * 37) % 84) }
        })
    )

    const remove = key => store.commit('party/REMOVE_EMOJI', key)

    // server cooldown (party_error emoji_cooldown): `left` runs 1 → 0 while it lasts
    const cooldown = computed(() => store.state.party.emojiCooldown)
    const now = ref(Date.now())
    let ticker = null

    const left = computed(() => (cooldown.value ? Math.max(0, cooldown.value.until - now.value) / cooldown.value.ms : 0))
    const cooling = computed(() => left.value > 0)

    watch(
      cooldown,
      value => {
        clearInterval(ticker)
        now.value = Date.now()

        if (!value) return

        ticker = setInterval(() => {
          now.value = Date.now()

          if (now.value >= value.until) {
            clearInterval(ticker)
            store.commit('party/SET_EMOJI_COOLDOWN', null)
          }
        }, 100)
      },
      { immediate: true }
    )

    onBeforeUnmount(() => clearInterval(ticker))

    const sendEmoji = emoji => {
      if (!cooling.value) send(wsTypeEnum.PARTY_EMOJI, { emoji })
    }

    return { emojis: PARTY_EMOJIS, isOpen, canSend, floats, remove, cooling, left, sendEmoji }
  }
})
</script>

<style lang="scss" src="./PartyEmojiReactions.component.scss" scoped></style>
