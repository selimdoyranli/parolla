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
    .party-emoji-reactions__picker(v-if="isOpen")
      button.party-emoji-reactions__pick(v-for="emoji in emojis" :key="emoji" type="button" @click="sendEmoji(emoji)") {{ emoji }}
    button.party-emoji-reactions__toggle(
      type="button"
      :aria-label="$t('party.emoji.open')"
      :aria-expanded="String(isOpen)"
      @click="isOpen = !isOpen"
    )
      AppIcon(:name="isOpen ? 'tabler:x' : 'tabler:mood-smile'" :width="20" :height="20")
</template>

<script>
import { defineComponent, ref, computed, inject, useStore } from '@nuxtjs/composition-api'
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
    // the server drops emojis while chat is off; the final / cancelled screens need the corner for their own content
    const canSend = computed(
      () => Boolean(store.getters['party/settings'].chat) && store.getters['party/game']?.phase !== 'final' && !store.state.party.cancelled
    )

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

    const sendEmoji = emoji => send(wsTypeEnum.PARTY_EMOJI, { emoji })

    return { emojis: PARTY_EMOJIS, isOpen, canSend, floats, remove, sendEmoji }
  }
})
</script>

<style lang="scss" src="./PartyEmojiReactions.component.scss" scoped></style>
