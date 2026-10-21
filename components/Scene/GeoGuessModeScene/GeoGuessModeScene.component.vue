<template lang="pug">
.scene.geoguess-scene(ref="rootRef" :class="[`geoguess-scene--${phase}`, `geoguess-scene--fs-${fullscreenState}`]")
  // Setup
  .geoguess-scene-setup(v-if="phase === 'setup'")
    .geoguess-scene-setup__hero
      AppIcon.geoguess-scene-setup__icon(name="noto:world-map" :width="44" :height="44")
      h1.geoguess-scene-setup__title {{ $t('geoGuessMode.title') }}
      p.geoguess-scene-setup__description {{ $t('geoGuessMode.description') }}

    span.geoguess-scene-setup__label {{ $t('geoGuessMode.chooseRegion') }}
    .geoguess-scene-setup__regions
      button.geoguess-scene-region(
        v-for="item in regions"
        :key="item.key"
        type="button"
        :class="{ 'is-active': item.key === regionKey }"
        :aria-pressed="item.key === regionKey"
        @click="regionKey = item.key"
      )
        AppIcon.geoguess-scene-region__icon(:name="item.icon" :width="28" :height="28")
        span.geoguess-scene-region__title {{ $t(`geoGuessMode.regions.${item.key}.title`) }}
        span.geoguess-scene-region__description {{ $t(`geoGuessMode.regions.${item.key}.description`) }}

    ul.geoguess-scene-setup__rules
      li
        AppIcon(name="tabler:map-pin" :width="16" :height="16")
        | {{ $t('geoGuessMode.rules.rounds', { count: totalRounds }) }}
      li
        AppIcon(name="tabler:trophy" :width="16" :height="16")
        | {{ $t('geoGuessMode.rules.maxScore', { score: maxRoundScore.toLocaleString($i18n.locale) }) }}
      li
        AppIcon(name="tabler:walk" :width="16" :height="16")
        | {{ $t('geoGuessMode.rules.explore') }}

    Button.geoguess-scene-setup__start(type="primary" round block @click="startGame")
      | {{ $t('geoGuessMode.start') }}

  // Loading / Error
  Empty.geoguess-scene__state(v-else-if="phase === 'loading'" :description="$t('geoGuessMode.preparing')")
    Loading(type="spinner" color="var(--color-brand-02)")

  Empty.geoguess-scene__state(v-else-if="phase === 'error'" image="error" :description="$t('geoGuessMode.notEnoughLocations')")
    Button(round @click="startGame") {{ $t('error.tryAgain') }}

  // Game
  template(v-else)
    .geoguess-scene-stage
      StreetViewPanorama.geoguess-scene-stage__panorama(:pano-id="currentRound.panoId" :heading="currentRound.heading")

      header.geoguess-scene-hud
        button.geoguess-scene-hud__chip.geoguess-scene-hud__chip--region(type="button" @click="backToSetup")
          AppIcon(:name="region.icon" :width="16" :height="16")
          span {{ $t(`geoGuessMode.regions.${region.key}.title`) }}
        .geoguess-scene-hud__chip
          span.geoguess-scene-hud__chipLabel {{ $t('geoGuessMode.round') }}
          strong {{ roundIndex + 1 }}/{{ rounds.length }}
        .geoguess-scene-hud__chip
          span.geoguess-scene-hud__chipLabel {{ $t('geoGuessMode.score') }}
          strong {{ totalScore.toLocaleString($i18n.locale) }}
        button.geoguess-scene-hud__chip.geoguess-scene-hud__chip--icon(
          type="button"
          :aria-label="isFullscreen ? $t('geoGuessMode.exitFullscreen') : $t('geoGuessMode.fullscreen')"
          :title="isFullscreen ? $t('geoGuessMode.exitFullscreen') : $t('geoGuessMode.fullscreen')"
          @click="toggleFullscreen"
        )
          AppIcon(:name="isFullscreen ? 'tabler:minimize' : 'tabler:maximize'" :width="18" :height="18")

      .geoguess-scene-map(:class="{ 'is-expanded': isMapExpanded }")
        GeoMap.geoguess-scene-map__map(v-model="guess" :interactive="phase === 'guessing'" :pairs="mapPairs" :view="region.view")

        .geoguess-scene-map__actions(v-if="phase === 'guessing'")
          Button.geoguess-scene-map__guess(type="primary" round block :disabled="!guess" @click="submitGuess")
            | {{ guess ? $t('geoGuessMode.guess') : $t('geoGuessMode.pickOnMap') }}

      button.geoguess-scene-map-toggle(
        v-if="phase === 'guessing'"
        type="button"
        :class="{ 'is-active': isMapExpanded }"
        :aria-label="isMapExpanded ? $t('geoGuessMode.closeMap') : $t('geoGuessMode.openMap')"
        @click="isMapExpanded = !isMapExpanded"
      )
        AppIcon(:name="isMapExpanded ? 'tabler:x' : 'tabler:map-2'" :width="24" :height="24")

      // Round result
      .geoguess-scene-card(v-if="phase === 'revealed'")
        strong.geoguess-scene-card__points +{{ lastResult.score.toLocaleString($i18n.locale) }}
        span.geoguess-scene-card__place(v-if="countryName(currentRound.country)")
          AppIcon(name="tabler:map-pin-filled" :width="14" :height="14")
          | {{ countryName(currentRound.country) }}
        p.geoguess-scene-card__text {{ $t('geoGuessMode.distance', { distance: formatDistance(lastResult.distance, $i18n.locale) }) }}
        .geoguess-scene-card__bar
          span(:style="{ width: `${(lastResult.score / maxRoundScore) * 100}%` }")
        Button.geoguess-scene-card__button(type="primary" round block @click="nextRound")
          | {{ isLastRound ? $t('geoGuessMode.seeResults') : $t('geoGuessMode.next') }}

      // Summary
      .geoguess-scene-card.geoguess-scene-card--summary(v-if="phase === 'finished'")
        span.geoguess-scene-card__label {{ $t('geoGuessMode.totalScore') }}
        strong.geoguess-scene-card__points
          | {{ totalScore.toLocaleString($i18n.locale) }}
          small &nbsp;/ {{ (maxRoundScore * rounds.length).toLocaleString($i18n.locale) }}
        ol.geoguess-scene-card__rounds
          li(v-for="(result, index) in results" :key="index")
            span {{ index + 1 }}.
            span {{ formatDistance(result.distance, $i18n.locale) }}
            strong {{ result.score.toLocaleString($i18n.locale) }}
        .geoguess-scene-card__actions
          Button(color="var(--color-success-01)" icon="share-o" icon-position="right" round @click="shareResults")
            | {{ $t('general.share').toLocaleUpperCase($i18n.locale) }}
          Button(type="primary" round @click="startGame") {{ $t('geoGuessMode.playAgain') }}
        button.geoguess-scene-card__link(type="button" @click="backToSetup") {{ $t('geoGuessMode.changeRegion') }}
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onBeforeUnmount, useContext } from '@nuxtjs/composition-api'
import { Button, Empty, Loading } from 'vant'
import { findPanorama } from '@/services/streetView.service'
import { distanceKm, locationScore, randomPointInBoxes, formatDistance } from '@/helpers/geo'
import { showToast } from '@/helpers/toast'
import { GEOGUESS_REGIONS, GEOGUESS_TOTAL_ROUNDS, GEOGUESS_MAX_ROUND_SCORE, GEOGUESS_PANORAMA_ATTEMPTS } from '@/system/geoguess'

// Must match the inset transition in the scene stylesheet
const FULLSCREEN_TRANSITION_MS = 450
// On <html> while fullscreen: turns the app header into a floating glass bar (styles live in the scene stylesheet)
const IMMERSIVE_HTML_CLASS = 'geoguess-immersive'

// One random panorama inside the region, or null after the attempts run out (open sea, no coverage)
const pickPanorama = async region => {
  for (let attempt = 0; attempt < GEOGUESS_PANORAMA_ATTEMPTS; attempt += 1) {
    const panorama = await findPanorama({ ...randomPointInBoxes(region.boxes), radius: region.searchRadius })

    if (panorama && (!region.country || panorama.country === region.country)) return panorama
  }

  return null
}

export default defineComponent({
  components: {
    Button,
    Empty,
    Loading
  },
  setup() {
    const { i18n } = useContext()
    const sfx = useSfx()
    const { postToNative } = useNativeBridge()

    // setup → loading → guessing ⇄ revealed → finished
    const phase = ref('setup')
    const regionKey = ref(GEOGUESS_REGIONS[0].key)
    const region = computed(() => GEOGUESS_REGIONS.find(item => item.key === regionKey.value))
    const rounds = ref([])
    const roundIndex = ref(0)
    const results = ref([])
    const guess = ref(null)
    const isMapExpanded = ref(false)
    // Covers the whole viewport, header included. off → entering → on → leaving → off.
    // The scene is full-size for the whole ride and only a clip-path mask animates, pinned to the in-layout rect at
    // entering/leaving — resizing the panorama iframe and Leaflet every frame is what made it flicker
    const rootRef = ref(null)
    const fullscreenState = ref('off')
    const isFullscreen = computed(() => ['entering', 'on'].includes(fullscreenState.value))
    let fullscreenTimer = null

    const pinToLayoutRect = () => {
      // The page wrapper keeps the scene's slot in the layout while the scene itself is fixed
      const rect = rootRef.value.parentElement.getBoundingClientRect()
      const { style } = rootRef.value

      style.setProperty('--fs-top', `${rect.top}px`)
      style.setProperty('--fs-left', `${rect.left}px`)
      style.setProperty('--fs-right', `${window.innerWidth - rect.right}px`)
      style.setProperty('--fs-bottom', `${window.innerHeight - rect.bottom}px`)
    }

    const enterFullscreen = () => {
      clearTimeout(fullscreenTimer)
      pinToLayoutRect()
      fullscreenState.value = 'entering'
      document.documentElement.classList.add(IMMERSIVE_HTML_CLASS)
      sfx.play('page-enter', { volume: 0.25 })
      // Two frames: let the pinned rect paint before transitioning away from it
      requestAnimationFrame(() => requestAnimationFrame(() => (fullscreenState.value = 'on')))
    }

    const exitFullscreen = async () => {
      clearTimeout(fullscreenTimer)
      // Header back in the flow first, so the rect we shrink into is the real one under it
      document.documentElement.classList.remove(IMMERSIVE_HTML_CLASS)
      await nextTick()
      pinToLayoutRect()
      fullscreenState.value = 'leaving'
      sfx.play('page-exit', { volume: 0.25 })
      fullscreenTimer = setTimeout(() => (fullscreenState.value = 'off'), FULLSCREEN_TRANSITION_MS)
    }

    const toggleFullscreen = () => (isFullscreen.value ? exitFullscreen() : enterFullscreen())

    const handleKeydown = event => {
      if (event.key === 'Escape' && isFullscreen.value) exitFullscreen()
    }

    window.addEventListener('keydown', handleKeydown)

    onBeforeUnmount(() => {
      clearTimeout(fullscreenTimer)
      window.removeEventListener('keydown', handleKeydown)
      document.documentElement.classList.remove(IMMERSIVE_HTML_CLASS)
    })

    const currentRound = computed(() => rounds.value[roundIndex.value])
    const isLastRound = computed(() => roundIndex.value === rounds.value.length - 1)
    const lastResult = computed(() => results.value[results.value.length - 1])
    const totalScore = computed(() => results.value.reduce((sum, result) => sum + result.score, 0))

    const mapPairs = computed(() => {
      if (phase.value === 'revealed') return [{ guess: lastResult.value.guess, answer: lastResult.value.answer }]

      if (phase.value === 'finished') return results.value.map(({ guess: point, answer }) => ({ guess: point, answer }))

      return []
    })

    const startGame = async () => {
      phase.value = 'loading'
      results.value = []
      roundIndex.value = 0
      guess.value = null
      isMapExpanded.value = false
      sfx.play('confirm')

      const playedRegion = region.value
      const panoramas = (await Promise.all(Array.from({ length: GEOGUESS_TOTAL_ROUNDS }, () => pickPanorama(playedRegion)))).filter(Boolean)

      // The player may have backed out while panoramas were loading
      if (phase.value !== 'loading') return

      if (!panoramas.length) {
        phase.value = 'error'
        sfx.play('error')

        return
      }

      rounds.value = panoramas
      phase.value = 'guessing'
      sfx.play('page-enter')
    }

    const submitGuess = () => {
      if (!guess.value || phase.value !== 'guessing') return

      const answer = { lat: currentRound.value.lat, lng: currentRound.value.lng }
      const distance = distanceKm(guess.value, answer)
      const score = locationScore({ distance, scaleKm: region.value.scaleKm, maxScore: GEOGUESS_MAX_ROUND_SCORE })

      results.value = [...results.value, { guess: guess.value, answer, distance, score }]
      phase.value = 'revealed'
      isMapExpanded.value = false

      if (score >= GEOGUESS_MAX_ROUND_SCORE * 0.8) {
        sfx.play('success')
      } else if (score >= GEOGUESS_MAX_ROUND_SCORE * 0.3) {
        sfx.play('ding')
      } else {
        sfx.play('denied')
      }
    }

    const nextRound = () => {
      guess.value = null

      if (isLastRound.value) {
        phase.value = 'finished'
        sfx.play('complete')
        postToNative('end-game', true)

        return
      }

      roundIndex.value += 1
      phase.value = 'guessing'
      sfx.play('page-enter', { volume: 0.3 })
    }

    const countryName = code => {
      if (!code) return ''

      try {
        return new Intl.DisplayNames([i18n.locale], { type: 'region' }).of(code)
      } catch {
        return code
      }
    }

    const backToSetup = () => {
      phase.value = 'setup'
      rounds.value = []
    }

    // Dropping / moving the pin
    watch(guess, value => {
      if (value && phase.value === 'guessing') sfx.play('pop', { volume: 0.5 })
    })

    const shareResults = async () => {
      const shareText = i18n.t('sharer.geoGuessStats.description', {
        score: `${totalScore.value.toLocaleString(i18n.locale)}/${(GEOGUESS_MAX_ROUND_SCORE * rounds.value.length).toLocaleString(
          i18n.locale
        )}`,
        region: i18n.t(`geoGuessMode.regions.${region.value.key}.title`),
        url: window.location.href
      })

      postToNative('sharer', shareText)

      try {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('dialog.stats.clipboard.score.callback.success'))
        await navigator.share({ title: 'parolla', text: shareText })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('dialog.stats.clipboard.score.callback.success'))
      }
    }

    return {
      phase,
      regions: GEOGUESS_REGIONS,
      regionKey,
      region,
      rounds,
      roundIndex,
      results,
      guess,
      isMapExpanded,
      rootRef,
      fullscreenState,
      isFullscreen,
      toggleFullscreen,
      countryName,
      currentRound,
      isLastRound,
      lastResult,
      totalScore,
      mapPairs,
      totalRounds: GEOGUESS_TOTAL_ROUNDS,
      maxRoundScore: GEOGUESS_MAX_ROUND_SCORE,
      formatDistance,
      startGame,
      submitGuess,
      nextRound,
      backToSetup,
      shareResults
    }
  }
})
</script>

<style lang="scss" src="./GeoGuessModeScene.component.scss"></style>
