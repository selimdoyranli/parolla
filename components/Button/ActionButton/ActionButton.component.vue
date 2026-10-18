<template lang="pug">
button.action-button(
  v-on="$listeners"
  type="button"
  :class="[`action-button--${tone}`, { 'is-active': active, 'has-label': label }]"
  :aria-label="label"
  :data-label="label"
)
  span.action-button__icon
    AppIcon(
      :label="badge"
      :name="active && activeIcon ? activeIcon : icon"
      :max99-number="badgeMax99"
      :width="iconSize"
      :height="iconSize"
    )
  // count keeps its slot even when empty so neighbours don't shift when it goes 0 <-> 1
  span.action-button__count(v-if="$slots.default || count !== null")
    slot {{ count > 0 ? count : '' }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    icon: {
      type: String,
      required: true
    },
    // icon used while active, e.g. a filled variant
    activeIcon: {
      type: String,
      required: false,
      default: null
    },
    // default (grey) | brand | info | success | danger
    tone: {
      type: String,
      required: false,
      default: 'default'
    },
    active: {
      type: Boolean,
      required: false,
      default: false
    },
    // null hides the count area; 0 keeps the area but shows no text
    count: {
      type: Number,
      required: false,
      default: null
    },
    // tooltip + aria-label
    label: {
      type: String,
      required: false,
      default: null
    },
    // AppIcon badge (e.g. unread count)
    badge: {
      type: [Number, String],
      required: false,
      default: null
    },
    badgeMax99: {
      type: Boolean,
      required: false,
      default: false
    },
    iconSize: {
      type: Number,
      required: false,
      default: 20
    }
  }
})
</script>

<style lang="scss" src="./ActionButton.component.scss"></style>
