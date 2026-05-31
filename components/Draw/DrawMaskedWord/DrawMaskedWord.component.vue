<template lang="pug">
.draw-masked-word
  span.draw-masked-word__char(v-for="(ch, i) in chars" :key="i" :class="{ separator: ch === ' ' || ch === '-' }") {{ ch }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    mask: { type: Object, default: null },
    plain: { type: String, default: '' }
  },
  setup(props) {
    const chars = computed(() => {
      if (props.plain) return props.plain.split('')

      if (props.mask && props.mask.masked) return props.mask.masked.split('')

      return []
    })

    return { chars }
  }
})
</script>

<style src="./DrawMaskedWord.component.scss" lang="scss" scoped />
