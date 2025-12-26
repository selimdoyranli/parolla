<template lang="pug">
.trivia-option-list
  template(v-for="option in options")
    .trivia-option-list-item(@click="handleOptionClick(option)")
      span.trivia-option-list-item__text {{ option.text }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'TriviaOptionList',
  props: {
    options: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const handleOptionClick = option => {
      emit('on-option-select', option)
    }

    return {
      handleOptionClick
    }
  }
})
</script>

<style lang="scss" src="./TriviaOptionList.component.scss"></style>
