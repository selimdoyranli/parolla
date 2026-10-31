<template lang="pug">
//- in-game chat, opened from the AppHeader chat button: tour's online dialog (chat, online players, last answers)
Dialog.stats-dialog.dialog.party-chat-dialog(
  :value="isOpen"
  show-cancel-button
  close-on-click-overlay
  get-container="body"
  :class="{ 'chat-osk': isChatFocused }"
  :title="$t('dialog.menu.party')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  @input="setOpen"
  @opened="scrollToEnd"
)
  Tabs.stats-dialog__tabs(v-model="activeTab" :ellipsis="false")
    Tab(name="chat")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:message" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('chat.chat') }}
      PartyChat(ref="partyChatRef" @focusin.native="isChatFocused = true" @focusout.native="isChatFocused = false")

    Tab(name="online")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:users-group" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('tourMode.onlineUsers') }} ({{ onlinePlayers.length }})
      .party-chat-dialog__tab
        PlayerList(:items="onlinePlayers")

    Tab(name="last-answers")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:pencil-question" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('tourMode.lastAnswers.title') }}
      .party-chat-dialog__tab.party-chat-dialog__tab--answers
        //- tour's colours: green right, red wrong (the answer itself stays hidden)
        PlayerList(:items="lastAnswers")
          template(#empty)
            Empty(:description="$t('tourMode.lastAnswers.empty.description')")
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, useStore } from '@nuxtjs/composition-api'
import { Dialog, Tabs, Tab, Empty } from 'vant'
import { usePartyUser } from '@/composables/usePartyUser'

export default defineComponent({
  components: { Dialog: Dialog.Component, Tabs, Tab, Empty },
  setup() {
    const store = useStore()
    const { toUser } = usePartyUser()
    const partyChatRef = ref(null)
    const isChatFocused = ref(false)
    const activeTab = ref('chat')

    const isOpen = computed(() => store.state.party.chatDialogOpen)
    const players = computed(() => store.getters['party/players'])
    const onlinePlayers = computed(() => players.value.filter(p => p.connected).map(toUser))
    const lastAnswers = computed(() =>
      store.state.party.recentAnswers
        .map(r => {
          const p = players.value.find(x => x.id === r.playerId)

          return p && { ...toUser(p), isCorrect: r.correct }
        })
        .filter(Boolean)
    )

    const setOpen = open => store.commit('party/SET_CHAT_DIALOG_OPEN', open)
    const scrollToEnd = () => partyChatRef.value?.scrollToEnd()

    // everything counts as read while the dialog is open (the header badge)
    watch([isOpen, () => store.state.party.chat.length], ([open, n]) => {
      if (open) store.commit('party/SET_CHAT_SEEN', n)
    })

    // back on the chat tab: the list was hidden, land on the latest message
    watch(activeTab, tab => {
      if (tab === 'chat') nextTick(scrollToEnd)
    })

    return { partyChatRef, isChatFocused, activeTab, isOpen, onlinePlayers, lastAnswers, setOpen, scrollToEnd }
  }
})
</script>

<style lang="scss" src="./PartyChatDialog.component.scss"></style>
