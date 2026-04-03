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
          .chat__message-text(v-else v-longpress="() => openReport(message)")
            | : {{ censorBadwords(message.message) }}
            span.chat__message-report(auth-control @click="openReport(message)")
              AppIcon(name="tabler:flag" color="var(--color-text-03)" :width="12" :height="12")

    template(v-else)
      Empty(:description="$t('chat.messagesEmpty')")

  MountingPortal(mount-to="body" append)
    ReportDialog(
      :is-open="isOpenReportDialog"
      :scope="reportTypeEnum.CHAT"
      :additional="reportAdditional"
      @closed="isOpenReportDialog = false"
    )

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
import { defineComponent, ref, computed, useStore, onMounted, onUnmounted, watch, useContext } from '@nuxtjs/composition-api'
import { Field, Button, Empty } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { reportTypeEnum } from '@/enums/report-type.enum'

const longpressDirective = {
  bind(el, binding) {
    let timer = null
    const delay = 500

    const start = e => {
      if (e.type === 'click' && e.button !== 0) return

      timer = setTimeout(() => {
        if (typeof binding.value === 'function') {
          binding.value(e)
        }
      }, delay)
    }

    const cancel = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchmove', cancel)

    el._longpressCleanup = () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchend', cancel)
      el.removeEventListener('touchmove', cancel)
    }
  },
  unbind(el) {
    if (el._longpressCleanup) {
      el._longpressCleanup()
    }
  }
}

export default defineComponent({
  name: 'Chat',
  directives: {
    longpress: longpressDirective
  },
  components: {
    Field,
    Button,
    Empty
  },
  setup(_, { emit }) {
    const { $auth } = useContext()
    const store = useStore()

    const { isoToHumanDate } = useFormatter()

    const { censorBadwords } = useCensorBadwords()

    const messagesRef = ref(null)

    const messageText = ref('')

    const chatMessages = computed(() => store.getters['tour/chatMessages'])

    const ws = computed(() => store.getters['app/ws'])
    const currentWs = ref(null)

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
            if (isScrollOnBottom()) {
              scrollToBottom()
            }
          }, 0)
        }

        emit('on-chat-message-ws')
      }
    }

    const attachWsListener = socket => {
      if (currentWs.value) {
        currentWs.value.removeEventListener('message', handleWsMessage)
      }

      currentWs.value = socket

      if (socket) {
        socket.addEventListener('message', handleWsMessage)

        setTimeout(() => {
          scrollToBottom()
        }, 0)
      }
    }

    onMounted(() => {
      attachWsListener(ws.value)
    })

    watch(
      ws,
      newSocket => {
        attachWsListener(newSocket)
      },
      { immediate: true }
    )

    const isScrollOnBottom = () => {
      if (!messagesRef.value) return false

      const threshold = 50

      return messagesRef.value.scrollTop + messagesRef.value.clientHeight >= messagesRef.value.scrollHeight - threshold
    }

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

      ws.value.send(
        JSON.stringify({
          type: wsTypeEnum.CHAT_MESSAGE,
          message: messageText.value
        })
      )

      messageText.value = ''
    }

    const isOpenReportDialog = ref(false)
    const reportAdditional = ref(null)

    const openReport = message => {
      if (!$auth.loggedIn && !$auth.user) {
        return
      }

      reportAdditional.value = JSON.stringify({
        reportedMessage: {
          playerId: message.playerId,
          playerName: message.playerName,
          diceBear: message.diceBear,
          message: message.message,
          timestamp: message.timestamp
        },
        chatHistory: chatMessages.value.map(m => ({
          playerId: m.playerId,
          playerName: m.playerName,
          message: m.message,
          timestamp: m.timestamp
        }))
      })
      isOpenReportDialog.value = true
    }

    const handleFocus = () => {
      emit('on-focus')
    }

    const handleBlur = () => {
      emit('on-blur')
    }

    onUnmounted(() => {
      if (currentWs.value) {
        currentWs.value.removeEventListener('message', handleWsMessage)
      }
    })

    return {
      reportTypeEnum,
      censorBadwords,
      messagesRef,
      messageText,
      chatMessages,
      sendMessage,
      isoToHumanDate,
      scrollToBottom,
      handleFocus,
      handleBlur,
      isScrollOnBottom,
      isOpenReportDialog,
      reportAdditional,
      openReport
    }
  }
})
</script>

<style lang="scss" src="./Chat.component.scss"></style>
