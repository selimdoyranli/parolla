<template lang="pug">
.draw-chat
  .draw-chat__log(ref="log")
    .draw-chat__msg(v-for="(m, i) in chat" :key="i" :class="{ system: m.isSystem, close: m.isCloseHint }")
      template(v-if="m.isSystem")
        span.draw-chat__sys {{ m.message }}
      template(v-else)
        b {{ m.playerName }}:
        span {{ m.message }}
  .draw-chat__input
    input(v-model="text" :placeholder="placeholder" maxlength="64" :disabled="disabled" @keyup.enter="send")
    button(:disabled="disabled || !text.trim()" @click="send") Gönder
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    chat: { type: Array, default: () => [] },
    iAmDrawer: { type: Boolean, default: false },
    iGuessedCorrectly: { type: Boolean, default: false },
    isDrawing: { type: Boolean, default: false }
  },
  emits: ['send'],
  setup(props, { emit }) {
    const text = ref('')
    const log = ref(null)

    const disabled = computed(() => props.iAmDrawer && props.isDrawing)

    const placeholder = computed(() => {
      if (props.iAmDrawer && props.isDrawing) return 'Çizim sırasında yazamazsın'

      if (props.iGuessedCorrectly) return 'Doğru bildin, diğer winnerlarla sohbet et'

      return 'Tahmin et / sohbet et…'
    })

    const send = () => {
      const t = text.value.trim()

      if (!t) return
      emit('send', t)
      text.value = ''
    }

    watch(
      () => props.chat.length,
      async () => {
        await nextTick()

        if (log.value) log.value.scrollTop = log.value.scrollHeight
      }
    )

    return { text, log, disabled, placeholder, send }
  }
})
</script>

<style src="./DrawChat.component.scss" lang="scss" scoped />
