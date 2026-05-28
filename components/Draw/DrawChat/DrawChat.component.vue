<template lang="pug">
.draw-chat
  .draw-chat__log(ref="log")
    .draw-chat__empty(v-if="!chat.length") {{ disabled ? 'Çizim sırasında sohbet kapalı' : 'Tahmininizi yazın…' }}
    .draw-chat__msg(v-for="(m, i) in chat" :key="i" :class="msgClasses(m)")
      template(v-if="m.isSystem")
        span.draw-chat__sys
          AppIcon.draw-chat__sys-icon(:name="iconFor(m)" :width="14" :height="14")
          span.draw-chat__sys-text {{ m.message }}
      template(v-else)
        b.draw-chat__author {{ m.playerName }}
        span.draw-chat__text {{ m.message }}
  .draw-chat__input
    Field.draw-chat__field(v-model="text" :placeholder="placeholder" :maxlength="64" :disabled="disabled" @keyup.enter.native="send")
    Button.draw-chat__send(type="primary" size="small" round :disabled="disabled || !text.trim()" @click="send") Gönder
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from '@nuxtjs/composition-api'
import { Field, Button } from 'vant'

export default defineComponent({
  components: { Field, Button },
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

    const kindOf = m => {
      // Backward-compat: older payloads only had isCloseHint to mark a
      // 'close guess' system message. New code attaches systemKind directly.
      if (m.systemKind) return m.systemKind

      if (m.isCloseHint) return 'warning'

      return 'info'
    }

    const iconFor = m => {
      const kind = kindOf(m)

      if (kind === 'success') return 'tabler:circle-check'

      if (kind === 'warning') return 'tabler:alert-triangle'

      if (kind === 'danger') return 'tabler:alert-octagon'

      return 'tabler:info-circle'
    }

    const msgClasses = m => {
      if (!m.isSystem) return {}
      const kind = kindOf(m)

      return {
        system: true,
        [`system--${kind}`]: true,
        close: !!m.isCloseHint
      }
    }

    const placeholder = computed(() => {
      if (props.iAmDrawer && props.isDrawing) return 'Çizim sırasında yazamazsın'

      if (props.iGuessedCorrectly) return 'Doğru bildin, kazananlarla sohbet et'

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

    return { text, log, disabled, placeholder, send, iconFor, msgClasses }
  }
})
</script>

<style src="./DrawChat.component.scss" lang="scss" scoped />
