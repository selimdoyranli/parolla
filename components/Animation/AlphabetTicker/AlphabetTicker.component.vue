<template lang="pug">
.alphabet-ticker(aria-hidden="true" :class="rootClasses")
  .alphabet-ticker__viewport
    .alphabet-ticker__track(:style="trackStyle")
      .alphabet-ticker__slot(v-for="(item, index) in sequence" :key="item.letter")
        transition(name="alphabet-ticker-badge")
          span.alphabet-ticker__badge(v-if="badge && badge.index === index" :class="`alphabet-ticker__badge--${badge.outcome}`")
            | {{ item.letter }} · {{ outcomeLabels[badge.outcome] }}
        span.alphabet-ticker__item(:class="itemClass(index)") {{ item.letter }}
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, useContext } from '@nuxtjs/composition-api'

const OUTCOME_BY_CODE = Object.freeze({
  c: 'correct',
  w: 'wrong',
  p: 'passed'
})

/**
 * Turkish alphabet paired with one outcome per letter (c: correct, w: wrong, p: passed).
 * Hand authored rather than randomised so the loop keeps the same rhythm on every visit.
 * "I" and "Ğ" are left out, matching the letters a round can actually land on.
 */
const SEQUENCE = Object.freeze(
  'Ac Bc Cw Çc Dc Ec Fp Gc Hc İc Jp Kc Lc Mw Nc Oc Öc Pc Rw Sc Şp Tc Uc Üc Vc Yw Zc'.split(' ').map(pair => ({
    letter: pair[0],
    outcome: OUTCOME_BY_CODE[pair[1]]
  }))
)

// Holds on "V" while the "Ü · Doğru" badge is still up — the frame the loop is composed around.
// Derived from the letter so editing SEQUENCE cannot leave this pointing somewhere else.
const STATIC_ACTIVE_INDEX = SEQUENCE.findIndex(item => item.letter === 'V')

// Time the track spends faded out between the last letter and the restart
const RESET_DURATION = 320

export default defineComponent({
  props: {
    interval: {
      type: Number,
      required: false,
      default: 900
    }
  },
  setup(props) {
    const { i18n } = useContext()

    const activeIndex = ref(0)
    const isResetting = ref(false)
    const isStatic = ref(false)

    let timer = null

    const outcomeLabels = computed(() => ({
      correct: i18n.t('gameScene.correct'),
      wrong: i18n.t('gameScene.wrong'),
      passed: i18n.t('gameScene.pass')
    }))

    const rootClasses = computed(() => ({
      'alphabet-ticker--static': isStatic.value,
      'alphabet-ticker--resetting': isResetting.value
    }))

    // Clamped so the last beat keeps "Z" centered instead of over scrolling one stride past it
    const trackStyle = computed(() => ({
      '--alphabet-ticker-active': Math.min(activeIndex.value, SEQUENCE.length - 1)
    }))

    const badge = computed(() => {
      const index = activeIndex.value - 1

      if (isResetting.value || index < 0 || index >= SEQUENCE.length) {
        return null
      }

      return {
        index,
        outcome: SEQUENCE[index].outcome
      }
    })

    const itemClass = index => {
      if (index === activeIndex.value) {
        return 'alphabet-ticker__item--selected'
      }

      if (index < activeIndex.value) {
        return `alphabet-ticker__item--${SEQUENCE[index].outcome}`
      }

      return null
    }

    const stop = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const run = delay => {
      stop()

      timer = setTimeout(() => {
        if (isResetting.value) {
          activeIndex.value = 0
          isResetting.value = false
          run(props.interval)

          return
        }

        if (activeIndex.value >= SEQUENCE.length) {
          isResetting.value = true
          run(RESET_DURATION)

          return
        }

        activeIndex.value += 1
        run(props.interval)
      }, delay)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop()

        return
      }

      run(props.interval)
    }

    onMounted(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        isStatic.value = true
        activeIndex.value = STATIC_ACTIVE_INDEX

        return
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // A tab opened in the background gets no animation frames, so Vue could never resolve
      // the badge leave transitions and they would pile up. Wait until the page is really visible.
      if (!document.hidden) {
        run(props.interval)
      }
    })

    onBeforeUnmount(() => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })

    return {
      sequence: SEQUENCE,
      rootClasses,
      trackStyle,
      badge,
      outcomeLabels,
      itemClass
    }
  }
})
</script>

<style lang="scss" src="./AlphabetTicker.component.scss"></style>
