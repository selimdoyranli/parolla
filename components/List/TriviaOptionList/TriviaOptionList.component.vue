<template lang="pug">
.trivia-option-list
  template(v-for="option in options")
    .trivia-option-list-item(:class="optionClass(option)" @click="handleOptionClick(option)")
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
    },
    // party: the option this player already sent (locked in, not judged yet)
    selected: {
      type: String,
      default: null
    },
    // solo: right after a pick, { picked, correct } paints the correct option green and a wrong pick red
    reveal: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const same = (a, b) =>
      String(a ?? '')
        .trim()
        .toLocaleLowerCase('tr') ===
      String(b ?? '')
        .trim()
        .toLocaleLowerCase('tr')

    const optionClass = option => {
      const r = props.reveal

      return {
        'trivia-option-list-item--selected': props.selected !== null && same(option.text, props.selected),
        'trivia-option-list-item--correct': Boolean(r) && same(option.text, r.correct),
        'trivia-option-list-item--wrong': Boolean(r) && same(option.text, r.picked) && !same(r.picked, r.correct),
        'trivia-option-list-item--revealing': Boolean(r)
      }
    }

    const handleOptionClick = option => {
      if (!props.reveal) emit('on-option-select', option)
    }

    return {
      optionClass,
      handleOptionClick
    }
  }
})
</script>

<style lang="scss" src="./TriviaOptionList.component.scss"></style>
