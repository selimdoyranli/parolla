<template lang="pug">
.draw-masked-word
  span.draw-masked-word__char(
    v-for="(ch, i) in chars"
    :key="i"
    :class="{ separator: isSeparator(ch), revealed: isMask && !isSeparator(ch) && ch !== '_' }"
  ) {{ ch }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    mask: { type: Object, default: null },
    plain: { type: String, default: '' }
  },
  setup(props) {
    // Mask mode letters can be opened one at a time by the drawer's hint
    // button, so the ones already revealed get their own highlight.
    const isMask = computed(() => !props.plain && !!(props.mask && props.mask.masked))
    const isSeparator = ch => ch === ' ' || ch === '-'

    const chars = computed(() => {
      if (props.plain) return props.plain.split('')

      if (props.mask && props.mask.masked) return props.mask.masked.split('')

      return []
    })

    return { chars, isMask, isSeparator }
  }
})
</script>

<style src="./DrawMaskedWord.component.scss" lang="scss" scoped />
