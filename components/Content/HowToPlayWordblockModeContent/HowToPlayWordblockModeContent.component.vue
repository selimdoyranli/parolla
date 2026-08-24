<template lang="pug">
.how-to-play-wordblock-mode-content
  .instructions
    p {{ $t('dialog.howToPlay.wordblock.heading') }}
    p {{ $t('dialog.howToPlay.wordblock.guessRule', { charLength }) }}
    p {{ $t('dialog.howToPlay.wordblock.attemptsRule', { maxAttempts: MAX_ATTEMPTS }) }}

    .examples
      p
        strong {{ $t('dialog.howToPlay.wordblock.examplesLabel') }}

      .example(v-for="(example, index) in activeExamples" :key="index")
        .row
          .game-tile(
            v-for="(letter, letterIndex) in example.word"
            :key="`${index}-${letterIndex}`"
            :class="getTileClass(example, letterIndex)"
          )
            span {{ letter }}
        p
          strong {{ normalizeWord(example.word[example.targetIndex]) }}
          |
          | {{ $t(`dialog.howToPlay.wordblock.example.${example.state}`) }}

    p
      strong {{ $t('dialog.howToPlay.wordblock.footer') }}
</template>

<script>
import { defineComponent, useContext, useRoute, computed } from '@nuxtjs/composition-api'
import { WORDBLOCK_LOCALES, WORDBLOCK_FALLBACK_LOCALE } from '@/system/constant'

// Example words are per-locale on purpose: they have to be real words of the locale the
// player is guessing in, spelled with letters its keyboard actually offers.
const EXAMPLES_CONFIG = {
  tr: {
    5: [
      { word: 'kalem', targetIndex: 0, state: 'correct' },
      { word: 'insan', targetIndex: 1, state: 'present' },
      { word: 'çatal', targetIndex: 3, state: 'absent' }
    ],
    6: [
      { word: 'peynir', targetIndex: 0, state: 'correct' },
      { word: 'zeytin', targetIndex: 1, state: 'present' },
      { word: 'toprak', targetIndex: 4, state: 'absent' }
    ],
    7: [
      { word: 'makarna', targetIndex: 0, state: 'correct' },
      { word: 'fasulye', targetIndex: 1, state: 'present' },
      { word: 'zafiyet', targetIndex: 5, state: 'absent' }
    ]
  },
  en: {
    5: [
      { word: 'plant', targetIndex: 0, state: 'correct' },
      { word: 'brick', targetIndex: 1, state: 'present' },
      { word: 'sound', targetIndex: 3, state: 'absent' }
    ],
    6: [
      { word: 'silver', targetIndex: 0, state: 'correct' },
      { word: 'pocket', targetIndex: 1, state: 'present' },
      { word: 'garden', targetIndex: 4, state: 'absent' }
    ],
    7: [
      { word: 'kitchen', targetIndex: 0, state: 'correct' },
      { word: 'picture', targetIndex: 1, state: 'present' },
      { word: 'diamond', targetIndex: 5, state: 'absent' }
    ]
  }
}

export default defineComponent({
  setup() {
    const route = useRoute()
    const { i18n } = useContext()

    const calculatedCharLength = computed(() => {
      const len = parseInt(route.value.params.charLength)

      return isNaN(len) ? 5 : len
    })

    const { MAX_ATTEMPTS, activeCharLength: charLength, normalizeWord } = useWordblock(calculatedCharLength)

    const localeExamples = computed(() => {
      const locale = WORDBLOCK_LOCALES[i18n.locale] ? i18n.locale : WORDBLOCK_FALLBACK_LOCALE

      return EXAMPLES_CONFIG[locale]
    })

    const activeExamples = computed(() => {
      return localeExamples.value[charLength.value] || localeExamples.value[5]
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
      normalizeWord,
      getTileClass
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayWordblockModeContent.component.scss"></style>
