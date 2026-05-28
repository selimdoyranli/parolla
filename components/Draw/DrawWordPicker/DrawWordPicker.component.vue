<template lang="pug">
.draw-word-picker
  .draw-word-picker__backdrop
  .draw-word-picker__panel
    h3 Çizmek için bir kelime seç
    .draw-word-picker__opts
      button.draw-word-picker__opt(v-for="w in words" :key="w" @click="$emit('pick', w)") {{ w }}
    p.draw-word-picker__hint {{ secondsLeft }}s içinde seçim yapmazsan otomatik seçilir.
</template>

<script>
import { defineComponent, ref, watch, onUnmounted } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    words: { type: Array, default: () => [] },
    timeoutMs: { type: Number, default: 10000 }
  },
  emits: ['pick'],
  setup(props) {
    const secondsLeft = ref(Math.ceil(props.timeoutMs / 1000))
    const startedAt = Date.now()
    const tick = () => {
      const left = Math.max(0, Math.ceil((props.timeoutMs - (Date.now() - startedAt)) / 1000))
      secondsLeft.value = left
    }
    const interval = setInterval(tick, 250)
    onUnmounted(() => clearInterval(interval))
    watch(() => props.timeoutMs, tick)

    return { secondsLeft }
  }
})
</script>

<style src="./DrawWordPicker.component.scss" lang="scss" scoped />
