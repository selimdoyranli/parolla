<template lang="pug">
.intro-button(role="button" tabindex="1")
  .intro-button__header
    AppIcon.intro-button__icon(color="var(--color-text-01)" :name="icon" :width="24" :height="24")
    span.intro-button-title
      | {{ title }}

    .head-label(v-if="headLabel.title?.length > 0")
      AppIcon.head-label__icon(v-if="headLabel.icon?.length > 0" :name="headLabel.icon" :width="16" :height="16")
      span.head-label__title(v-if="headLabel.title?.length > 0") {{ headLabel.title }}
      span.head-label__pulse(v-if="headLabel.pulse")

  .intro-button-body(v-if="$slots.body")
    .intro-button-body__content
      slot(name="body")

  p.intro-button__description(v-if="description?.length > 0") {{ description }}

  .intro-button__footer
    NuxtLink.play-now-button(role="button" :to="to" :title="title" :aria-label="title") {{ $t('general.play') }}

    .avatar-group(v-if="playerList?.length > 4")
      PlayerAvatar(
        v-for="player in playerList.slice(0, 4)"
        :key="player.id"
        :user="{ username: player.username, diceBear: player.diceBear }"
      )
      .avatar-group__moreCount(v-if="$slots.avatarsMoreCount")
        slot(name="avatarsMoreCount")

  .append
    label.intro-button__label(v-if="label?.length > 0")
      AppIcon(name="tabler:sparkles" :width="16" :height="16")
      | {{ label }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    to: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false,
      default: ''
    },
    description: {
      type: String,
      required: false,
      default: ''
    },
    label: {
      type: String,
      required: false,
      default: ''
    },
    icon: {
      type: String,
      required: false,
      default: ''
    },
    headLabel: {
      type: Object,
      required: false,
      default: () => ({
        title: '',
        icon: '',
        pulse: false
      })
    },
    playerList: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props) {}
})
</script>

<style lang="scss" src="./IntroButton.component.scss"></style>
