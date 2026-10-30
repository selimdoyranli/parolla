<template lang="pug">
mixin panel
  .party-chat__panel
    header.party-chat__head
      .party-card__head-icon
        AppIcon(name="tabler:message-circle" :width="18" :height="18")
      .party-card__head-text
        span.party-card__eyebrow {{ $t('party.lobby.chat.eyebrow') }}
        h3.party-card__title {{ $t('party.lobby.chat.title') }}
    .party-chat__log(ref="logRef")
      .party-chat__empty(v-if="!chat.length")
        AppIcon(name="tabler:message-circle" :width="22" :height="22")
        strong {{ $t('party.lobby.chat.empty') }}
        small {{ $t('party.lobby.chat.emptySub') }}
      .party-chat__msg(v-for="m in chat" :key="`${m.timestamp}-${m.playerId}`" :class="{ 'party-chat__msg--system': m.isSystem }")
        template(v-if="m.isSystem") {{ systemText(m) }}
        template(v-else)
          PlayerAvatar.party-chat__avatar(:user="avatarFor(m)" :size="22")
          .party-chat__body
            strong.party-chat__name(:class="{ 'party-chat__name--me': m.playerId === myId }") {{ m.playerName }}
            span.party-chat__text {{ censorBadwords(m.message) }}
    form.party-chat__input(@submit.prevent="submit")
      input.party-chat__field(
        v-model="text"
        type="text"
        :placeholder="enabled ? $t('party.lobby.chat.placeholder') : $t('party.lobby.chat.off')"
        maxlength="300"
        autocomplete="off"
        spellcheck="false"
        :disabled="!enabled"
      )
      button.party-chat__send(type="submit" :aria-label="$t('party.lobby.chat.send')" :disabled="!enabled || !text.trim()")
        AppIcon(name="tabler:send" :width="18" :height="18")

.party-chat(:class="{ 'party-chat--compact': compact }")
  template(v-if="compact")
    //- mobile: one line with the last message, opens the full chat as a sheet
    button.party-chat__bar(type="button" @click="isSheetOpen = true")
      AppIcon(name="tabler:message-circle" :width="18" :height="18")
      span.party-chat__preview {{ preview }}
      span.party-pill.party-pill--brand(v-if="unread") {{ unread }}
    Popup.party-chat__sheet(v-model="isSheetOpen" position="bottom" round closeable get-container="body" @opened="scrollToEnd")
      +panel
  template(v-else)
    +panel
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, inject, useStore, useContext } from '@nuxtjs/composition-api'
import { Popup } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: { Popup },
  props: {
    compact: { type: Boolean, default: false }
  },
  setup(props) {
    const store = useStore()
    const { i18n } = useContext()
    const send = inject('partySend')
    const { censorBadwords } = useCensorBadwords()
    const text = ref('')
    const logRef = ref(null)
    const isSheetOpen = ref(false)
    const seen = ref(store.state.party.chat.length)

    const chat = computed(() => store.state.party.chat)
    const myId = computed(() => store.state.party.myId)
    const enabled = computed(() => store.getters['party/settings'].chat !== false)
    const unread = computed(() => (props.compact && !isSheetOpen.value ? Math.max(0, chat.value.length - seen.value) : 0))

    // server sends a key + name for system lines; plain `message` is the older format
    const systemText = m => (m.system ? i18n.t(`party.lobby.chat.system.${m.system}`, { name: m.name }) : m.message)

    const preview = computed(() => {
      const last = chat.value[chat.value.length - 1]

      if (!last) return enabled.value ? i18n.t('party.lobby.chat.placeholder') : i18n.t('party.lobby.chat.off')

      return last.isSystem ? systemText(last) : `${last.playerName}: ${censorBadwords(last.message)}`
    })

    const avatarFor = m => {
      const p = store.getters['party/players'].find(x => x.id === m.playerId)

      return p
        ? { id: p.id, username: p.name, diceBear: p.diceBear, profilePhoto: p.profilePhoto, avatarSource: p.avatarSource }
        : { id: m.playerId, username: m.playerName }
    }

    const scrollToEnd = () =>
      nextTick(() => {
        if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight
      })

    watch(() => chat.value.length, scrollToEnd)

    // everything up to now counts as read while the sheet is open (and when it closes)
    watch([isSheetOpen, () => chat.value.length], () => {
      if (isSheetOpen.value || !props.compact) seen.value = chat.value.length
    })

    const submit = () => {
      const message = text.value.trim()

      if (!message || !enabled.value) return

      send(wsTypeEnum.PARTY_CHAT, { message })
      text.value = ''
    }

    return { text, logRef, isSheetOpen, chat, myId, enabled, unread, preview, avatarFor, scrollToEnd, submit, censorBadwords, systemText }
  }
})
</script>

<style lang="scss" src="./PartyChat.component.scss" scoped></style>
