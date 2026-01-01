<template lang="pug">
.chat-panel(:class="{ 'chat-panel--expanded': isExpanded }")
  .chat-panel__header(@click="collapseChatPanel")
    span.chat-panel__title
      AppIcon(name="tabler:message" color="var(--color-icon-02)")
      | {{ title || $t('chat.chat') }}
    AppIcon(color="var(--color-icon-01)" :name="isExpanded ? 'tabler:arrow-down' : 'tabler:arrow-up'")

  .chat-panel__content
    slot(name="content-prepend")
    Chat(@on-focus="handleFocus" @on-blur="handleBlur")
    slot(name="content-append")
</template>

<script>
import { defineComponent, ref } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ChatPanel',
  props: {
    title: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(_, { emit }) {
    const isExpanded = ref(true)

    const collapseChatPanel = () => {
      isExpanded.value = !isExpanded.value
    }

    const handleFocus = () => {
      emit('on-focus')
    }

    const handleBlur = () => {
      emit('on-blur')
    }

    return {
      isExpanded,
      collapseChatPanel,
      handleFocus,
      handleBlur
    }
  }
})
</script>

<style lang="scss" src="./ChatPanel.component.scss"></style>
