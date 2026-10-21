<template lang="pug">
.scene.geoguess-scene(ref="rootRef" :class="[`geoguess-scene--${phase}`, `geoguess-scene--fs-${fullscreenState}`]")
  // Setup (intro)
  .geoguess-scene-setup(v-if="phase === 'setup'")
    QuizCover.geoguess-scene-setup__cover(:label="$t('geoGuessMode.title')" seed="geoguess" :sublabel="$t('geoGuessMode.description')")
      ul.geoguess-scene-setup__stats
        li.geoguess-scene-setup__stat(v-for="stat in introStats" :key="stat.key")
          AppIcon(:name="stat.icon" :width="14" :height="14")
          span {{ stat.text }}

    .geoguess-scene-setup__body
      span.geoguess-scene-setup__label {{ $t('geoGuessMode.chooseRegion') }}
      .geoguess-scene-setup__regions(:style="{ '--region-count': regions.length }")
        button.geoguess-scene-region(
          v-for="item in regions"
          :key="item.key"
          type="button"
          :class="{ 'is-active': item.key === regionKey }"
          :aria-pressed="item.key === regionKey"
          @click="regionKey = item.key"
        )
          AppIcon.geoguess-scene-region__icon(:name="item.icon" :width="30" :height="30")
          span.geoguess-scene-region__title {{ $t(`geoGuessMode.regions.${item.key}.title`) }}
          span.geoguess-scene-region__description {{ $t(`geoGuessMode.regions.${item.key}.description`) }}
          AppIcon.geoguess-scene-region__check(v-if="item.key === regionKey" name="tabler:circle-check-filled" :width="18" :height="18")

      Button.geoguess-scene-setup__play(block round @click="startGame")
        AppIcon(name="tabler:player-play-filled" :width="20" :height="20")
        span {{ $t('geoGuessMode.play') }}

      Collapse.geoguess-scene-setup__rules(v-model="rulesOpen" :border="false")
        CollapseItem(name="rules" icon="question-o" :title="$t('geoGuessMode.howToPlay')")
          HowToPlayGeoGuessModeContent

      DialogAd.geoguess-scene-setup__ad

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
        .geoguess-scene-hud__chip.geoguess-scene-hud__chip--timer(
          v-if="phase === 'guessing'"
          :class="{ 'is-urgent': isHurryUp }"
          :aria-label="`${$t('geoGuessMode.timeLeft')}: ${remainingLabel}`"
        )
          svg.geoguess-scene-hud__ring(viewBox="0 0 24 24" aria-hidden="true")
            circle.geoguess-scene-hud__ringTrack(cx="12" cy="12" r="10")
            circle.geoguess-scene-hud__ringFill(cx="12" cy="12" r="10" :style="{ strokeDashoffset: ringOffset }")
          strong {{ remainingLabel }}
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

      // Mobile: tapping anywhere off the open map sheet closes it
      .geoguess-scene-map-backdrop(v-if="phase === 'guessing' && isMapExpanded" @click="isMapExpanded = false")

      .geoguess-scene-map(:class="{ 'is-expanded': isMapExpanded }")
        GeoMap.geoguess-scene-map__map(
          v-model="guess"
          :interactive="phase === 'guessing'"
          :pairs="mapPairs"
          :view="region.view"
          :pin-labels="{ guess: $t('geoGuessMode.you'), answer: $t('geoGuessMode.target') }"
        )

        .geoguess-scene-map__actions(v-if="phase === 'guessing'")
          Button.geoguess-scene-map__guess(type="primary" round block :disabled="!guess" @click="submitGuess")
            | {{ guess ? $t('geoGuessMode.guess') : $t('geoGuessMode.pickOnMap') }}

        // Mobile: the collapsed mini map is one big button that opens the sheet
        button.geoguess-scene-map__opener(
          v-if="phase === 'guessing' && !isMapExpanded"
          type="button"
          :aria-label="$t('geoGuessMode.openMapHint')"
          @click="isMapExpanded = true"
        )

      button.geoguess-scene-map-close(
        v-if="phase === 'guessing' && isMapExpanded"
        type="button"
        :aria-label="$t('geoGuessMode.closeMap')"
        @click="isMapExpanded = false"
      )
        AppIcon(name="tabler:x" :width="20" :height="20")

      // Round result
      .geoguess-scene-card(v-if="phase === 'revealed'")
        strong.geoguess-scene-card__points +{{ $t('geoGuessMode.points', { score: lastResult.score.toLocaleString($i18n.locale) }) }}
        span.geoguess-scene-card__place(v-if="countryName(currentRound.country)")
          AppIcon(name="tabler:map-pin-filled" :width="14" :height="14")
          | {{ countryName(currentRound.country) }}
        p.geoguess-scene-card__text(v-if="lastResult.guess")
          | {{ $t('geoGuessMode.distance', { distance: formatDistance(lastResult.distance, $i18n.locale) }) }}
        p.geoguess-scene-card__text(v-else) {{ $t('geoGuessMode.timeUp') }}
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
            span {{ result.guess ? formatDistance(result.distance, $i18n.locale) : '—' }}
            strong {{ result.score.toLocaleString($i18n.locale) }}
        .geoguess-scene-card__actions
          Button(color="var(--color-success-01)" icon="share-o" icon-position="right" round @click="shareResults")
            | {{ $t('general.share').toLocaleUpperCase($i18n.locale) }}
          Button(type="primary" round @click="startGame") {{ $t('geoGuessMode.playAgain') }}
        button.geoguess-scene-card__link(type="button" @click="backToSetup") {{ $t('geoGuessMode.changeRegion') }}
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onBeforeUnmount, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Empty, Loading, Collapse, CollapseItem } from 'vant'
import { Howl } from 'howler'
import { findPanorama } from '@/services/streetView.service'
import { distanceKm, locationScore, randomPointInBoxes, formatDistance } from '@/helpers/geo'
import { showToast } from '@/helpers/toast'
import {
  GEOGUESS_REGIONS,
  GEOGUESS_TOTAL_ROUNDS,
  GEOGUESS_MAX_ROUND_SCORE,
  GEOGUESS_PANORAMA_ATTEMPTS,
  GEOGUESS_ROUND_TIME_MS,
  GEOGUESS_HURRY_UP_MS
} from '@/system/geoguess'

// Circumference of the HUD timer ring (r = 10)
const RING_LENGTH = 2 * Math.PI * 10
// Must match the clip-path transition in the scene stylesheet
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
    Loading,
    Collapse,
    CollapseItem
  },
  setup() {
    const { i18n } = useContext()
    const store = useStore()
    const sfx = useSfx()
    const { postToNative } = useNativeBridge()

    // setup → loading → guessing ⇄ revealed → finished
    const phase = ref('setup')
    const regions = computed(() => GEOGUESS_REGIONS.filter(item => item.locales.includes(i18n.locale)))
    const regionKey = ref(regions.value[0].key)
    const region = computed(() => GEOGUESS_REGIONS.find(item => item.key === regionKey.value))
    // The rules start expanded on every screen size — first-time players need them before picking a region
    const rulesOpen = ref(['rules'])

    // Switching language can drop the picked region (Europe/USA are EN-only, Türkiye TR-only)
    watch(regions, list => {
      if (!list.some(item => item.key === regionKey.value)) regionKey.value = list[0].key
    })

    const introStats = computed(() => [
      { key: 'rounds', icon: 'tabler:flag', text: i18n.t('geoGuessMode.stats.rounds', { count: GEOGUESS_TOTAL_ROUNDS }) },
      { key: 'timer', icon: 'tabler:clock', text: i18n.t('geoGuessMode.stats.timer', { minutes: GEOGUESS_ROUND_TIME_MS / 60000 }) },
      {
        key: 'maxScore',
        icon: 'tabler:trophy',
        text: i18n.t('geoGuessMode.stats.maxScore', {
          score: (GEOGUESS_MAX_ROUND_SCORE * GEOGUESS_TOTAL_ROUNDS).toLocaleString(i18n.locale)
        })
      }
    ])

    // Round timer. The tick-tock file is ~6 s, so it loops through the last 10 s; game-scene sounds setting mutes it
    const remainingMs = ref(GEOGUESS_ROUND_TIME_MS)
    let roundDeadline = 0
    let roundTimer = null
    const isGameSoundOn = () => store.getters['app/isActiveGameSceneSoundFx']
    const hurryUpSound = new Howl({ src: ['/sound/fx/tick-tock.wav'], loop: true, volume: 0.35, mute: !isGameSoundOn() })
    const timeUpSound = new Howl({ src: ['/sound/fx/notification1.wav'], mute: !isGameSoundOn() })

    watch(
      () => store.getters['app/isActiveGameSceneSoundFx'],
      value => {
        hurryUpSound.mute(!value)
        timeUpSound.mute(!value)
      }
    )

    const isHurryUp = computed(() => remainingMs.value <= GEOGUESS_HURRY_UP_MS)
    const ringOffset = computed(() => RING_LENGTH * (1 - remainingMs.value / GEOGUESS_ROUND_TIME_MS))
    const remainingLabel = computed(() => {
      const totalSeconds = Math.ceil(remainingMs.value / 1000)

      return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
    })

    const stopRoundTimer = () => {
      clearInterval(roundTimer)
      roundTimer = null
      hurryUpSound.stop()
    }
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
      stopRoundTimer()
      hurryUpSound.unload()
      timeUpSound.unload()
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

    function startRoundTimer() {
      stopRoundTimer()
      roundDeadline = Date.now() + GEOGUESS_ROUND_TIME_MS
      remainingMs.value = GEOGUESS_ROUND_TIME_MS

      roundTimer = setInterval(() => {
        remainingMs.value = Math.max(0, roundDeadline - Date.now())

        if (isHurryUp.value && !hurryUpSound.playing()) hurryUpSound.play()

        if (remainingMs.value === 0) submitGuess({ isTimeUp: true })
      }, 250)
    }

    const startGame = async () => {
      stopRoundTimer()
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
      startRoundTimer()
    }

    // Time's up without a pin → `guess` is null and the round scores 0
    const submitGuess = ({ isTimeUp = false } = {}) => {
      if ((!guess.value && !isTimeUp) || phase.value !== 'guessing') return

      stopRoundTimer()

      const answer = { lat: currentRound.value.lat, lng: currentRound.value.lng }
      const distance = guess.value ? distanceKm(guess.value, answer) : null
      const score = guess.value ? locationScore({ distance, scaleKm: region.value.scaleKm, maxScore: GEOGUESS_MAX_ROUND_SCORE }) : 0

      results.value = [...results.value, { guess: guess.value, answer, distance, score }]
      phase.value = 'revealed'
      isMapExpanded.value = false

      if (isTimeUp) timeUpSound.play()

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
      startRoundTimer()
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
      stopRoundTimer()
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
      regions,
      rulesOpen,
      introStats,
      isHurryUp,
      ringOffset,
      remainingLabel,
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
