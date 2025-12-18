<template lang="pug">
.trivia-option-list
  template(v-for="(option, index) in options")
    .trivia-option-list-item(@click="handleOptionClick(option, index)")
      span.trivia-option-list-item__text {{ option }}
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
    const handleOptionClick = (option, index) => {
      emit('on-option-select', option, index)
    }

    return {
      handleOptionClick
    }
  }
})
</script>

<style lang="scss" src="./TriviaOptionList.component.scss"></style>
