<template lang="pug">
.draw-toolbar
  .draw-toolbar__group
    button.draw-toolbar__tool(
      v-for="t in tools"
      :key="t.id"
      type="button"
      v-html="t.icon"
      :class="{ 'is-active': tool === t.id }"
      :title="t.label"
      @click="$emit('update:tool', t.id)"
    )

  .draw-toolbar__divider

  .draw-toolbar__group
    button.draw-toolbar__size(
      v-for="s in sizes"
      :key="s.key"
      type="button"
      :class="['draw-toolbar__size--' + s.key, { 'is-active': size === s.value }]"
      :title="'Kalınlık ' + s.value"
      @click="$emit('update:size', s.value)"
    )
      i

  .draw-toolbar__divider

  .draw-toolbar__color-current(:style="{ background: color }" :title="color")

  .draw-toolbar__palette
    button.draw-toolbar__swatch(
      v-for="c in palette"
      :key="c"
      type="button"
      :class="{ 'is-active': color === c }"
      :style="{ background: c }"
      :title="c"
      @click="$emit('update:color', c)"
    )

  .draw-toolbar__actions
    button.draw-toolbar__btn(type="button" title="Geri al" @click="$emit('undo')")
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round")
        path(d="M3 7v6h6")
        path(d="M21 17a9 9 0 0 0-15-6.7L3 13")
      span.draw-toolbar__btn-label Geri
    button.draw-toolbar__btn.draw-toolbar__btn--danger(type="button" title="Temizle" @click="$emit('clear')")
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round")
        polyline(points="3 6 5 6 21 6")
        path(d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6")
        path(d="M10 11v6M14 11v6")
      span.draw-toolbar__btn-label Temizle
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

const ICONS = {
  brush:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>',
  line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>',
  rect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>',
  circle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/></svg>',
  fill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11l-7.5-7.5L4 11l7.5 7.5z"/><path d="M5 12l7 7"/><path d="M19 16s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4z"/></svg>',
  eraser:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l5 5L8 21H3v-5z"/><line x1="13" y1="6" x2="18" y2="11"/></svg>'
}

const TOOLS = [
  { id: 'brush', label: 'Fırça', icon: ICONS.brush },
  { id: 'line', label: 'Çizgi', icon: ICONS.line },
  { id: 'rect', label: 'Dikdörtgen', icon: ICONS.rect },
  { id: 'circle', label: 'Daire', icon: ICONS.circle },
  { id: 'fill', label: 'Doldur', icon: ICONS.fill },
  { id: 'eraser', label: 'Silgi', icon: ICONS.eraser }
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
