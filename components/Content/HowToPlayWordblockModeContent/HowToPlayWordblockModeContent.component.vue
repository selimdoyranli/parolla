<template lang="pug">
.how-to-play-wordblock-mode-content
  .instructions
    p Günün Kelimesini Bul
    p Her tahmin {{ charLength }} harfli doğru bir kelime olmalıdır. Göndermek için enter'a bas.
    p Her tahminden sonra kutucukların renkleri tahmininin yakınlığına göre değişecektir. {{ MAX_ATTEMPTS }} tahmin hakkın var.

    .examples
      p
        strong Örnekler

      .example(v-for="(example, index) in activeExamples" :key="index")
        .row
          .game-tile(
            v-for="(letter, letterIndex) in example.word"
            :key="`${index}-${letterIndex}`"
            :class="getTileClass(example, letterIndex)"
          )
            span {{ letter }}
        p
          strong {{ example.word[example.targetIndex].toLocaleUpperCase('tr-TR') }}
          |
          | {{ example.description }}

    p
      strong Her gün yeni bir kelime gelir!
</template>

<script>
import { defineComponent, useRoute, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const route = useRoute()

    const calculatedCharLength = computed(() => {
      const len = parseInt(route.value.params.charLength)

      return isNaN(len) ? 5 : len
    })

    const { MAX_ATTEMPTS, activeCharLength: charLength } = useWordblock(calculatedCharLength)

    const EXAMPLES_CONFIG = {
      5: [
        { word: 'kalem', targetIndex: 0, state: 'correct', description: 'harfi kelimede var ve doğru yerde.' },
        { word: 'insan', targetIndex: 1, state: 'present', description: 'harfi kelimede var fakat yanlış yerde.' },
        { word: 'çatal', targetIndex: 3, state: 'absent', description: 'harfi kelimede yok.' }
      ],
      6: [
        { word: 'peynir', targetIndex: 0, state: 'correct', description: 'harfi kelimede var ve doğru yerde.' },
        { word: 'zeytin', targetIndex: 1, state: 'present', description: 'harfi kelimede var fakat yanlış yerde.' },
        { word: 'toprak', targetIndex: 4, state: 'absent', description: 'harfi kelimede yok.' }
      ],
      7: [
        { word: 'makarna', targetIndex: 0, state: 'correct', description: 'harfi kelimede var ve doğru yerde.' },
        { word: 'fasulye', targetIndex: 1, state: 'present', description: 'harfi kelimede var fakat yanlış yerde.' },
        { word: 'zafiyet', targetIndex: 5, state: 'absent', description: 'harfi kelimede yok.' }
      ]
    }

    const activeExamples = computed(() => {
      return EXAMPLES_CONFIG[charLength.value] || EXAMPLES_CONFIG[5]
    })

    const getTileClass = (example, letterIndex) => {
      const isTarget = example.targetIndex === letterIndex

      return {
        correct: isTarget && example.state === 'correct',
        present: isTarget && example.state === 'present',
        absent: isTarget && example.state === 'absent',
        reveal: isTarget
      }
    }

    return {
      charLength,
      MAX_ATTEMPTS,
      activeExamples,
      getTileClass
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayWordblockModeContent.component.scss"></style>
