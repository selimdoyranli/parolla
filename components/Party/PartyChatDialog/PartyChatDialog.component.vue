<template lang="pug">
//- in-game chat, opened from the AppHeader chat button (tour's online dialog look)
Dialog.dialog.party-chat-dialog(
  :value="isOpen"
  show-cancel-button
  close-on-click-overlay
  get-container="body"
  :class="{ 'chat-osk': isChatFocused }"
  :title="title"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  @input="setOpen"
  @opened="scrollToEnd"
)
  PartyChat(ref="partyChatRef" @focusin.native="isChatFocused = true" @focusout.native="isChatFocused = false")
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

export default defineComponent({
  components: { Dialog: Dialog.Component },
  setup() {
    const store = useStore()
    const { i18n } = useContext()
    const partyChatRef = ref(null)
    const isChatFocused = ref(false)

    const isOpen = computed(() => store.state.party.chatDialogOpen)
    const title = computed(() => `${i18n.t('chat.chat')} (${store.getters['party/players'].length})`)

    const setOpen = open => store.commit('party/SET_CHAT_DIALOG_OPEN', open)
    const scrollToEnd = () => partyChatRef.value?.scrollToEnd()

    // everything counts as read while the dialog is open (the header badge)
    watch([isOpen, () => store.state.party.chat.length], ([open, n]) => {
      if (open) store.commit('party/SET_CHAT_SEEN', n)
    })

    return { partyChatRef, isChatFocused, isOpen, title, setOpen, scrollToEnd }
  }
})
</script>

<style lang="scss" src="./PartyChatDialog.component.scss"></style>
