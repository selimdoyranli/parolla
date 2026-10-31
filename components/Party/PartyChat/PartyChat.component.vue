<template lang="pug">
//- party feed through tour's Chat (same list + input); compact = the mobile dock bar that opens it in a sheet
.party-chat(ref="rootRef")
  template(v-if="compact")
    button.party-chat__bar(type="button" @click="isSheetOpen = true")
      AppIcon(name="tabler:message" :width="18" :height="18")
      span.party-chat__preview {{ preview }}
      span.party-pill.party-pill--brand(v-if="unread") {{ unread }}
    Popup.party-chat__sheet(v-model="isSheetOpen" position="bottom" round closeable get-container="body" @opened="scrollToEnd")
      //- ChatPanel's title bar
      .party-chat__sheet-head
        AppIcon(name="tabler:message" color="var(--color-icon-02)")
        | {{ title }}
      Chat(v-bind="chatProps" ref="chatRef" @on-send="submit")
  Chat(v-else v-bind="chatProps" @on-send="submit")
</template>

<script>
import { defineComponent, ref, computed, watch, inject, useStore, useContext } from '@nuxtjs/composition-api'
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
    const chatRef = ref(null)
    const rootRef = ref(null)
    const sfx = useSfx()
    const isSheetOpen = ref(false)
    const seen = ref(store.state.party.chat.length)

    const chat = computed(() => store.state.party.chat)
    const players = computed(() => store.getters['party/players'])
    const enabled = computed(() => store.getters['party/settings'].chat !== false)
    const unread = computed(() => (props.compact && !isSheetOpen.value ? Math.max(0, chat.value.length - seen.value) : 0))
    const title = computed(() => `${i18n.t('chat.chat')} (${players.value.length})`)

    // server sends a key + name for system lines; plain `message` is the older format
    const systemText = m => (m.system ? i18n.t(`party.lobby.chat.system.${m.system}`, { name: m.name }) : m.message)

    // Chat reads tour's message shape: system lines carry their text, avatars come from the player list
    const messages = computed(() =>
      chat.value.map(m => {
        if (m.isSystem) return { ...m, message: systemText(m) }

        const p = players.value.find(x => x.id === m.playerId)

        return p
          ? { ...m, diceBear: p.diceBear, profilePhoto: p.profilePhoto, avatarSource: p.avatarSource, role: p.role, loadout: p.loadout }
          : m
      })
    )

    const chatProps = computed(() => ({
      messages: messages.value,
      disabled: !enabled.value,
      placeholder: enabled.value ? null : i18n.t('party.lobby.chat.off'),
      playerActionsContext: null,
      openPlayerDialogOnClick: true
    }))

    const preview = computed(() => {
      const last = chat.value[chat.value.length - 1]

      if (!last) return enabled.value ? i18n.t('chat.messageField.placeholder') : i18n.t('party.lobby.chat.off')

      return last.isSystem ? systemText(last) : `${last.playerName}: ${censorBadwords(last.message)}`
    })

    const scrollToEnd = () => chatRef.value?.scrollToBottom()

    // everything up to now counts as read while the sheet is open (and when it closes)
    watch([isSheetOpen, () => chat.value.length], () => {
      if (isSheetOpen.value || !props.compact) seen.value = chat.value.length
    })

    // a soft cue for someone else's message while this chat is visible but folded (the dock bar / the collapsed panel);
    // the hidden copy (the other breakpoint's) has no layout box, so only one instance plays
    watch(
      () => chat.value[chat.value.length - 1],
      last => {
        const el = rootRef.value

        if (!last || last.isSystem || last.playerId === store.state.party.myId || isPartySfxQuiet()) return

        if (!el || !el.getClientRects().length) return

        if (props.compact ? !isSheetOpen.value : !el.closest('.chat-panel--expanded')) sfx.play('mention', { volume: 0.4 })
      }
    )

    const submit = message => {
      if (enabled.value) send(wsTypeEnum.PARTY_CHAT, { message })
    }

    return { rootRef, chatRef, isSheetOpen, unread, title, chatProps, preview, scrollToEnd, submit }
  }
})
</script>

<style lang="scss" src="./PartyChat.component.scss" scoped></style>
