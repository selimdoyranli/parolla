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
      :class="{ 'is-active': normalize(color) === normalize(c) }"
      :style="{ background: c }"
      :title="c"
      @click="$emit('update:color', c)"
    )
    .draw-toolbar__picker-anchor(ref="anchor")
      button.draw-toolbar__picker-btn(
        type="button"
        title="Daha fazla renk"
        :class="{ 'is-active': pickerOpen }"
        :style="pickerBtnStyle"
        @click="togglePicker"
      )
        AppIcon(name="tabler:palette" color="currentColor" :width="14" :height="14")
      transition(name="draw-toolbar-pop")
        .draw-toolbar__picker(v-if="pickerOpen" v-click-outside="closePicker")
          .draw-toolbar__picker-grid
            button.draw-toolbar__picker-swatch(
              v-for="c in extendedPalette"
              :key="c"
              type="button"
              :class="{ 'is-active': normalize(color) === normalize(c) }"
              :style="{ background: c }"
              :title="c"
              @click="pickColor(c)"
            )
          label.draw-toolbar__picker-native
            input.draw-toolbar__picker-input(type="color" :value="color" @input="onNativePick")
            span.draw-toolbar__picker-native-label
              AppIcon(name="tabler:eye-dropper" :width="13" :height="13")
              | Özel renk

  .draw-toolbar__actions
    button.draw-toolbar__btn(type="button" title="Geri al" @click="$emit('undo')")
      AppIcon(name="tabler:arrow-back-up" :width="14" :height="14")
      span.draw-toolbar__btn-label Geri
    button.draw-toolbar__btn.draw-toolbar__btn--danger(type="button" title="Temizle" @click="$emit('clear')")
      AppIcon(name="tabler:trash" :width="14" :height="14")
      span.draw-toolbar__btn-label Temizle
</template>

<script>
import { defineComponent, ref, computed } from '@nuxtjs/composition-api'

// Visible single-row palette — keep it tight and clearly legible.
const PALETTE = ['#000000', '#ffffff', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#a349a4']

// Bigger palette shown in the picker popup.
const EXTENDED_PALETTE = [
  '#000000',
  '#3a3a3a',
  '#5a5a5a',
  '#888888',
  '#bdbdbd',
  '#ffffff',
  '#88370a',
  '#b97a56',
  '#ed1c24',
  '#ff5ea8',
  '#ff7f27',
  '#ffb74d',
  '#fff200',
  '#fff8a8',
  '#7cc36a',
  '#22b14c',
  '#0aa3a3',
  '#00a2e8',
  '#4d84fa',
  '#3f48cc',
  '#7a5af8',
  '#a349a4',
  '#ff7878',
  '#ffc1c1'
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
  rectFill:
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>',
  circle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/></svg>',
  circleFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="8"/></svg>',
  fill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11l-7.5-7.5L4 11l7.5 7.5z"/><path d="M5 12l7 7"/><path d="M19 16s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4z"/></svg>',
  eraser:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 19h-11l-4 -4a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9 9"/><path d="M18 13.3l-6.3 -6.3"/></svg>'
}

const TOOLS = [
  { id: 'brush', label: 'Fırça', icon: ICONS.brush },
  { id: 'line', label: 'Çizgi', icon: ICONS.line },
  { id: 'rect', label: 'Dikdörtgen', icon: ICONS.rect },
  { id: 'rect-fill', label: 'Dolu Dikdörtgen', icon: ICONS.rectFill },
  { id: 'circle', label: 'Daire', icon: ICONS.circle },
  { id: 'circle-fill', label: 'Dolu Daire', icon: ICONS.circleFill },
  { id: 'fill', label: 'Doldur', icon: ICONS.fill },
  { id: 'eraser', label: 'Silgi', icon: ICONS.eraser }
]

// Click-outside directive — keeps the picker popup tap-anywhere-to-close.
const clickOutside = {
  bind(el, binding) {
    el._clickOutside = e => {
      if (!(el === e.target || el.contains(e.target))) {
        if (typeof binding.value === 'function') binding.value(e)
      }
    }
    document.addEventListener('mousedown', el._clickOutside)
    document.addEventListener('touchstart', el._clickOutside, { passive: true })
  },
  unbind(el) {
    if (el._clickOutside) {
      document.removeEventListener('mousedown', el._clickOutside)
      document.removeEventListener('touchstart', el._clickOutside)
      el._clickOutside = null
    }
  }
}

const normalize = c => (typeof c === 'string' ? c.trim().toLowerCase() : c)

export default defineComponent({
  directives: { clickOutside },
  props: {
    tool: { type: String, default: 'brush' },
    color: { type: String, default: '#000000' },
    size: { type: Number, default: 8 }
  },
  emits: ['update:tool', 'update:color', 'update:size', 'undo', 'clear'],
  setup(props, { emit }) {
    const pickerOpen = ref(false)
    const anchor = ref(null)

    const togglePicker = () => {
      pickerOpen.value = !pickerOpen.value
    }
    const closePicker = () => {
      pickerOpen.value = false
    }

    const pickColor = c => {
      emit('update:color', c)
      pickerOpen.value = false
    }

    const onNativePick = e => {
      const next = e?.target?.value

      if (next) emit('update:color', next)
    }

    // Picker button shows current color as background to act as a live preview.
    const pickerBtnStyle = computed(() => ({
      background: props.color
    }))

    return {
      tools: TOOLS,
      sizes: SIZES,
      palette: PALETTE,
      extendedPalette: EXTENDED_PALETTE,
      pickerOpen,
      anchor,
      togglePicker,
      closePicker,
      pickColor,
      onNativePick,
      pickerBtnStyle,
      normalize
    }
  }
})
</script>

<style src="./DrawToolbar.component.scss" lang="scss" scoped />
