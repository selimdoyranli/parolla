<template lang="pug">
Dialog.stats-dialog.dialog.tour-mode-online-dialog(
  v-model="state.isOpen"
  :class="[chatOskClass]"
  :title="$t('dialog.tourModeOnline.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :confirm-button-text="confirmButtonText || $t('general.apply')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @cancel="$emit('onCancel')"
  @confirm="$emit('onConfirm')"
)
  // Tabs
  Tabs.stats-dialog__tabs(v-model="activeTab")
    // Chat Tab
    Tab(name="chat")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:message" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('chat.chat') }}
      Chat(
        ref="chatRef"
        @on-connected-ws="onConnectedWs"
        @on-chat-message-ws="onChatMessageWs"
        @on-focus="onChatFocus"
        @on-blur="onChatBlur"
      )

    // Online Tab
    Tab(name="online")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:users-group" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('tourMode.onlineUsers') }} ({{ userList.totalPlayers + userList.totalViewers }})

      .tour-mode-online-dialog__onlineTab
        small {{ userList.totalPlayers }} {{ $t('tourMode.player') }}, {{ userList.totalViewers }} {{ $t('tourMode.viewer') }}
        PlayerList(:items="userList.players" actionable @player-click="actionsPlayer = $event")

    // Last answers Tab
    Tab(name="last-answers")
      template(#title)
        .stats-dialog-tab-title
          AppIcon.stats-dialog-tab-title__icon(name="tabler:pencil-question" :width="20" :height="20")
          span.stats-dialog-tab-title__value {{ $t('tourMode.lastAnswers.title') }}

      .tour-mode-online-dialog__lastAnswersTab
        small {{ $t('tourMode.lastAnswers.title') }}
        PlayerList(:items="tour.recentAnswers")
          template(#empty)
            Empty(:description="$t('tourMode.lastAnswers.empty.description')")

  PlayerActionsDialog(
    :is-open="!!actionsPlayer"
    :player="actionsPlayer"
    :my-id="user && user.id"
    :can-vote-kick="$auth.loggedIn"
    @vote-kick="voteKick"
    @closed="actionsPlayer = null"
  )
</template>

<script>
import { defineComponent, reactive, ref, watch, useContext, useStore, nextTick, computed } from '@nuxtjs/composition-api'
import { Dialog, Tabs, Tab, Cell, Empty } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Tabs,
    Tab,
    Cell,
    Empty
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    tour: {
      type: Object,
      required: true
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    },
    confirmButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const context = useContext()
    const store = useStore()
    const user = store.getters['auth/user']

    const userList = computed(() => store.getters['tour/userList'])

    const state = reactive({
      isOpen: props.isOpen
    })

    const chatRef = ref(null)

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          nextTick(() => {
            chatRef.value?.scrollToBottom()
          })

          setTimeout(() => {
            chatRef.value?.scrollToBottom()
          }, 100)
        }
      }
    )

    const activeTab = ref('chat')

    const actionsPlayer = ref(null)

    // Result (system chat line or "already voted" error toast) comes back over the socket
    const voteKick = player => {
      const ws = store.getters['app/ws']

      if (ws?.readyState === 1) {
        ws.send(JSON.stringify({ type: wsTypeEnum.VOTE_KICK, targetId: player.id }))
      }

      actionsPlayer.value = null
    }

    const onConnectedWs = () => {
      chatRef.value.scrollToBottom()
    }

    const onChatMessageWs = () => {
      if (chatRef.value.isScrollOnBottom()) {
        chatRef.value.scrollToBottom()
      }
    }

    const isChatFocused = ref(false)

    const chatOskClass = computed(() => {
      return context.$auth.loggedIn && isChatFocused.value && 'chat-osk'
    })

    const onChatFocus = () => {
      isChatFocused.value = true
      store.commit('tour/SET_IS_CHAT_FOCUSED', true)
    }

    const onChatBlur = () => {
      isChatFocused.value = false
      store.commit('tour/SET_IS_CHAT_FOCUSED', false)
    }

    return {
      user,
      state,
      chatRef,
      activeTab,
      actionsPlayer,
      voteKick,
      onConnectedWs,
      onChatMessageWs,
      userList,
      chatOskClass,
      onChatFocus,
      onChatBlur
    }
  }
})
</script>

<style lang="scss" src="./TourModeOnlineDialog.component.scss"></style>
