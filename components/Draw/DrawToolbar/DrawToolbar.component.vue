<template lang="pug">
.draw-toolbar
  .draw-toolbar__group
    button.draw-toolbar__tool(
      v-for="t in tools"
      :key="t.id"
      :class="{ 'is-active': tool === t.id }"
      :title="t.label"
      @click="$emit('update:tool', t.id)"
    ) {{ t.icon }}
  .draw-toolbar__group
    button.draw-toolbar__size(
      v-for="s in sizes"
      :key="s.key"
      :class="{ 'is-active': size === s.value }"
      @click="$emit('update:size', s.value)"
    )
      i(:style="{ width: s.value + 'px', height: s.value + 'px' }")
  .draw-toolbar__palette
    button.draw-toolbar__swatch(
      v-for="c in palette"
      :key="c"
      :class="{ 'is-active': color === c }"
      :style="{ background: c }"
      @click="$emit('update:color', c)"
    )
  .draw-toolbar__actions
    button.btn.btn-sm(@click="$emit('undo')") Geri
    button.btn.btn-sm.btn-danger(@click="$emit('clear')") Temizle
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

const PALETTE = [
  '#000000',
  '#5a5a5a',
  '#a0a0a0',
  '#ffffff',
  '#88370a',
  '#ed1c24',
  '#ff7f27',
  '#fff200',
  '#22b14c',
  '#0aa3a3',
  '#00a2e8',
  '#3f48cc',
  '#a349a4',
  '#ff5ea8',
  '#ffc1c1',
  '#7a5af8'
]
const SIZES = [
  { key: 's', value: 3 },
  { key: 'm', value: 8 },
  { key: 'l', value: 18 }
]
const TOOLS = [
  { id: 'brush', label: 'Fırça', icon: '✏️' },
  { id: 'eraser', label: 'Silgi', icon: '🧽' }
]

export default defineComponent({
  props: {
    tool: { type: String, default: 'brush' },
    color: { type: String, default: '#000000' },
    size: { type: Number, default: 8 }
  },
  emits: ['update:tool', 'update:color', 'update:size', 'undo', 'clear'],
  setup() {
    return { tools: TOOLS, sizes: SIZES, palette: PALETTE }
  }
})
</script>

<style src="./DrawToolbar.component.scss" lang="scss" scoped />
