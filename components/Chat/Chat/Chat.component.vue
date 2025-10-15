<template lang="pug">
.chat
  .chat__messages(ref="messagesRef")
    template(v-if="chatMessages?.length > 0")
      .chat__message(v-for="message in chatMessages" :key="message.timestamp" :class="{ 'chat__message--system': message.isSystem }")
        PlayerAvatar(
          v-if="!message.isSystem"
          with-username
          open-player-dialog-on-click
          :user="{ username: message.playerName, id: message.playerId, diceBear: message.diceBear }"
          :size="24"
        )
          template(#append)
            .chat__message-time {{ isoToHumanDate(message.timestamp) }}
        .chat__message-content
          .chat__message-text(v-if="message.isSystem")
            .chat__message-time {{ $t('chat.system') }} - {{ isoToHumanDate(message.timestamp) }}
            | &nbsp;&nbsp;: &nbsp;{{ message.message }}
          .chat__message-text(v-else) : {{ message.message }}

    template(v-else)
      Empty(:description="$t('chat.messagesEmpty')")

  .chat__input(auth-control)
    Field(
      v-model="messageText"
      :placeholder="$t('chat.messageField.placeholder')"
      :border="false"
      :readonly="!$auth.loggedIn"
      @keypress.enter="sendMessage"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#button)
        Button.chat__button.chat__button--send(
          color="var(--color-brand-02)"
          icon="guide-o"
          size="small"
          :inert="messageText.length <= 0"
          :disabled="messageText.length <= 0"
          @click="sendMessage"
        ) {{ $t('general.send') }}
</template>

<script>
import { defineComponent, ref, computed, useStore, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { Field, Button, Empty } from 'vant'
import { wsTypeEnum } from '@/enums'
import useFormatter from '@/composables/useFormatter'

export default defineComponent({
  name: 'Chat',
  components: {
    Field,
    Button,
    Empty
  },
  setup(_, { emit }) {
    const store = useStore()

    const { isoToHumanDate } = useFormatter()

    const messagesRef = ref(null)

    const messageText = ref('')

    const chatMessages = computed(() => store.getters['tour/chatMessages'])

    const ws = store.getters['app/ws']

    const handleWsMessage = data => {
      const { type, chatHistory, playerId, playerName, diceBear, message, isSystem, timestamp } = JSON.parse(data.data)

      if (type === wsTypeEnum.CONNECTED) {
        store.commit('tour/SET_CHAT_MESSAGES', chatHistory)

        setTimeout(() => {
          scrollToBottom()
        }, 0)

        emit('on-connected-ws')
      }

      if (type === wsTypeEnum.CHAT_MESSAGE) {
        const isDuplicate = chatMessages.value.some(msg => msg.timestamp === timestamp)

        if (!isDuplicate) {
          store.commit('tour/SET_CHAT_MESSAGES', [
            ...chatMessages.value,
            {
              isSystem,
              playerId,
              playerName,
              diceBear,
              message,
              timestamp
            }
          ])

          setTimeout(() => {
            scrollToBottom()
          }, 0)
        }

        emit('on-chat-message-ws')
      }
    }

    onMounted(() => {
      if (ws) {
        ws.addEventListener('message', handleWsMessage)

        setTimeout(() => {
          scrollToBottom()
        }, 0)
      }
    })

    const scrollToBottom = () => {
      if (messagesRef.value) {
        setTimeout(() => {
          messagesRef.value.scrollTo({
            top: messagesRef.value.scrollHeight,
            behavior: 'smooth'
          })
        }, 0)
      }
    }

    const sendMessage = () => {
      if (!messageText.value.trim()) return

      ws.send(
        JSON.stringify({
          type: wsTypeEnum.CHAT_MESSAGE,
          message: messageText.value
        })
      )

      messageText.value = ''
    }

    const handleFocus = () => {
      emit('on-focus')
    }

    const handleBlur = () => {
      emit('on-blur')
    }

    return {
      messagesRef,
      messageText,
      chatMessages,
      sendMessage,
      isoToHumanDate,
      scrollToBottom,
      handleFocus,
      handleBlur
    }
  }
})
</script>

<style lang="scss" src="./Chat.component.scss"></style>
