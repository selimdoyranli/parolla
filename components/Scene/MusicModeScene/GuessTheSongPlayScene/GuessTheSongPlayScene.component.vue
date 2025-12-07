<template lang="pug">
.scene.game-scene.guess-the-song-play-scene(ref="rootRef")
  // Scene Inner
  .scene__inner.game-scene__inner.guess-the-song-play-scene__inner
    // Fetch State
    template(v-if="fetchState.pending")
      Empty(:description="$t('general.quizPreparing')")

    template(v-else-if="fetchState.error")
      Empty(image="error" :description="$t('error.anErrorOccurred')")
        Button(@click="reFetch") {{ $t('error.tryAgain') }}

    template(v-else)
      header.guess-the-song-play-scene-header
        h1.guess-the-song-play-scene-header-title
          AppIcon.guess-the-song-play-scene-header-title__icon(name="emojione:musical-notes")
          span.guess-the-song-play-scene-header-title__text {{ $t('musicMode.guessTheSong.title') }}

        p.guess-the-song-play-scene__subtitle {{ $t('musicMode.guessTheSong.subtitle') }}

      .guess-the-song-play-scene-rounds
        .guess-the-song-play-scene-round(
          v-for="indicator in roundIndicators"
          :key="indicator.index"
          :class="getRoundIndicatorClass(indicator.index)"
        ) {{ indicator.index + 1 }}

      Empty(v-if="!currentRound" :description="$t('gameScene.pendingQuestions')")

      // Audio Player
      .guess-the-song-play-scene-audio(v-else)
        .guess-the-song-play-scene-audio__info
          .guess-the-song-play-scene-audio__artistAndTrack(v-if="isAnswerLocked")
            span.guess-the-song-play-scene-audio__label {{ currentRound.artistName }}
            span.guess-the-song-play-scene-audio__track {{ currentRound.trackName }}

          .guess-the-song-play-scene-audio-provider-apple-music(v-if="isAnswerLocked")
            AppIcon(name="simple-icons:applemusic" color="var(--color-text-03)" :width="20" :height="20")
            .guess-the-song-play-scene-audio-provider-apple-music-text
              span {{ $t('general.provider') }}
              span {{ $t('musicMode.appleMusic') }}

        .guess-the-song-play-scene-audio__controls
          .guess-the-song-play-scene-audio__timer
            span.guess-the-song-play-scene-audio__elapsed {{ remainingLabel }}

          Button.guess-the-song-play-scene-next-round-button(
            v-if="isAnswerLocked"
            type="button"
            :disabled="!isAnswerLocked"
            @click="goNextRound"
          )
            | {{ statsButtonLabel }}

          Button.guess-the-song-play-scene-audio-toggle-button(
            v-else
            type="button"
            size="small"
            :disabled="!currentRound.previewUrl"
            @click="toggleAudio"
          )
            AppIcon.guess-the-song-play-scene-audio-toggle-button__icon(:name="audioToggleIcon")

          .guess-the-song-play-scene-audio__timer
            span.guess-the-song-play-scene-audio__limit {{ limitLabel }}

        audio(ref="audioEl" :src="currentRound.previewUrl" preload="auto" @timeupdate="handleTimeUpdate" @ended="handleEnded")

      .guess-the-song-play-scene-options(v-if="currentRound")
        span.guess-the-song-play-scene-options__title {{ pickSongLabel }}

        .guess-the-song-play-scene-options__list
          button.guess-the-song-play-scene-option(
            v-for="option in currentRound.options"
            :key="option.trackId"
            type="button"
            :class="getOptionClass(option)"
            :disabled="isAnswerLocked"
            @click="handleSelectOption(option)"
          )
            .guess-the-song-play-scene-option__imageWrapper
              img.guess-the-song-play-scene-option__image(:src="option.artworkUrl100" draggable="false" :alt="option.trackName")
            span.guess-the-song-play-scene-option__name {{ option.trackName }}

  GuessTheSongStatsDialog(
    :is-open="isStatsDialogOpen"
    :stats="stats"
    :selected-artists="selectedArtists"
    :cancel-button-text="$t('general.playAgain')"
    :confirm-button-text="$t('musicMode.guessTheSong.stats.backToMusicMode')"
    @closed="handleStatsClosed"
    @onCancel="handleStatsCancelled"
    @onConfirm="handleStatsConfirmed"
  )
</template>

<script>
import {
  defineComponent,
  useFetch,
  useStore,
  useContext,
  useRoute,
  useRouter,
  ref,
  computed,
  watch,
  onUnmounted,
  nextTick,
  useMeta
} from '@nuxtjs/composition-api'
import { Button, Empty } from 'vant'

export default defineComponent({
  components: {
    Button,
    Empty
  },
  setup() {
    const rootRef = ref(null)

    const store = useStore()
    const { i18n, localePath } = useContext()

    const route = useRoute()
    const router = useRouter()

    const artistIds = computed(() => route.value.query.artistIds)
    const selectedArtistIds = computed(() =>
      (artistIds.value || '')
        .split(',')
        .filter(Boolean)
        .map(id => String(id))
    )

    const TOTAL_ROUNDS = 10
    const OPTIONS_PER_ROUND = 3
    const PREVIEW_LIMIT_MS = 5000
    const songs = ref([])
    const rounds = ref([])
    const roundIndex = ref(0)
    const selectedOptionId = ref(null)
    const isAudioPlaying = ref(false)
    const hasPreviewCompleted = ref(false)
    const audioEl = ref(null)
    const roundResults = ref([])
    const elapsedMs = ref(0)
    const isStatsDialogOpen = ref(false)

    const { fetch, fetchState } = useFetch(async () => {
      const ids = selectedArtistIds.value
      const { data, meta } = await store.dispatch('music/fetchSongs', { artistIds: ids })
      selectedArtists.value = meta?.artists || []

      const previewable = Array.isArray(data) ? data.filter(song => !!song.previewUrl) : []
      songs.value = ids.length === 0 ? previewable : previewable.filter(song => ids.includes(String(song.artistId)))
      rounds.value = buildRounds(songs.value, TOTAL_ROUNDS, ids)
      roundIndex.value = 0
      selectedOptionId.value = null
      roundResults.value = new Array(TOTAL_ROUNDS).fill('pending')
      isStatsDialogOpen.value = false
    })

    const shuffle = list => [...list].sort(() => Math.random() - 0.5)

    const buildRounds = (songList, roundCount, selectedIds = []) => {
      if (!Array.isArray(songList) || songList.length < OPTIONS_PER_ROUND) return []

      const previewable = songList.filter(song => !!song.previewUrl)

      if (previewable.length < OPTIONS_PER_ROUND) return []

      const selectedSet = new Set(selectedIds.map(id => String(id)).filter(Boolean))
      const filtered = selectedSet.size ? previewable.filter(song => selectedSet.has(String(song.artistId))) : previewable

      if (filtered.length < OPTIONS_PER_ROUND) return []

      const songsByArtist = filtered.reduce((acc, song) => {
        const key = String(song.artistId)

        if (!acc[key]) {
          acc[key] = []
        }

        acc[key].push(song)

        return acc
      }, {})

      const artistOrder = selectedIds.length ? selectedIds.map(id => String(id)) : Object.keys(songsByArtist)

      const desiredCounts = () => {
        if (artistOrder.length === 1) {
          return { [artistOrder[0]]: 10 }
        }

        if (artistOrder.length === 2) {
          return { [artistOrder[0]]: 5, [artistOrder[1]]: 5 }
        }

        if (artistOrder.length >= 3) {
          return {
            [artistOrder[0]]: 3,
            [artistOrder[1]]: 3,
            [artistOrder[2]]: 4
          }
        }

        return {}
      }

      const desired = desiredCounts()

      const pools = artistOrder.reduce((acc, id) => {
        acc[id] = shuffle([...(songsByArtist[id] || [])])

        return acc
      }, {})

      const capacity = artistOrder.reduce((acc, id) => {
        acc[id] = Math.floor((pools[id]?.length || 0) / OPTIONS_PER_ROUND)

        return acc
      }, {})

      const target = artistOrder.reduce((acc, id) => {
        const want = desired[id] ?? 0
        const can = capacity[id] ?? 0
        acc[id] = Math.min(want, can)

        return acc
      }, {})

      const sumTargets = artistOrder.reduce((sum, id) => sum + (target[id] || 0), 0)
      let remaining = Math.max(0, roundCount - sumTargets)

      while (remaining > 0) {
        let added = false

        for (const id of artistOrder) {
          const canAdd = (capacity[id] || 0) - (target[id] || 0) > 0

          if (!canAdd) continue

          target[id] = (target[id] || 0) + 1
          remaining -= 1
          added = true

          if (remaining === 0) break
        }

        if (!added) break
      }

      const roundsAcc = []

      for (const artistId of artistOrder) {
        const quota = target[artistId] || 0
        const pool = pools[artistId] || []

        for (let i = 0; i < quota && roundsAcc.length < roundCount; i += 1) {
          if (pool.length < OPTIONS_PER_ROUND) break

          const picks = pool.splice(0, OPTIONS_PER_ROUND)
          const [correctSong, ...alternatives] = picks
          const options = shuffle([correctSong, ...alternatives])

          roundsAcc.push({
            roundId: `${correctSong.trackId}-${roundsAcc.length}`,
            artistId: correctSong.artistId,
            artistName: correctSong.artistName,
            previewUrl: correctSong.previewUrl,
            correctTrackId: correctSong.trackId,
            trackName: correctSong.trackName,
            options
          })
        }
      }

      return roundsAcc
    }

    const currentRound = computed(() => rounds.value[roundIndex.value] || null)
    const isLastRound = computed(() => roundIndex.value === rounds.value.length - 1)
    const isAnswerLocked = computed(() => selectedOptionId.value !== null)
    const roundLabel = computed(() => `${Math.min(roundIndex.value + 1, rounds.value.length)}/${rounds.value.length || TOTAL_ROUNDS}`)
    const roundIndicators = computed(() => Array.from({ length: TOTAL_ROUNDS }, (_, idx) => ({ index: idx })))
    const playLabel = computed(() => i18n.t('musicMode.play'))
    const pauseLabel = computed(() => i18n.t('musicMode.pause'))
    const nextLabel = computed(() => i18n.t('musicMode.nextRound'))
    const finishLabel = computed(() => i18n.t('musicMode.seeResults'))
    const pickSongLabel = computed(() => i18n.t('musicMode.guessTheSong.pickSong'))
    const playHintText = computed(() => i18n.t('musicMode.guessTheSong.playHint'))
    const remainingLabel = computed(() => `${Math.max(0, (PREVIEW_LIMIT_MS - elapsedMs.value) / 1000).toFixed(2)}s`)
    const limitLabel = computed(() => `${(PREVIEW_LIMIT_MS / 1000).toFixed(2)}s`)
    const audioToggleIcon = computed(() => {
      if (hasPreviewCompleted.value && !isAudioPlaying.value) return 'tabler:repeat'

      return isAudioPlaying.value ? 'tabler:pause' : 'tabler:play'
    })

    const correctAnswersCount = computed(() => roundResults.value.filter(result => result === 'correct').length)
    const totalRoundsPlayed = computed(() => rounds.value.length || TOTAL_ROUNDS)
    const stats = computed(() => ({
      correct: correctAnswersCount.value,
      total: totalRoundsPlayed.value
    }))

    const selectedArtists = ref([])

    const statsButtonLabel = computed(() => (isLastRound.value ? finishLabel.value : nextLabel.value))

    const stopAudio = (resetElapsed = true) => {
      if (audioEl.value) {
        audioEl.value.pause()

        if (resetElapsed) {
          audioEl.value.currentTime = 0
        }
      }

      const shouldResetElapsed = resetElapsed || elapsedMs.value >= PREVIEW_LIMIT_MS

      if (shouldResetElapsed) {
        elapsedMs.value = 0
        hasPreviewCompleted.value = false
      }

      isAudioPlaying.value = false
    }

    const playCurrentPreview = async () => {
      stopAudio()

      if (!currentRound.value?.previewUrl) return

      await nextTick()

      if (!audioEl.value) return

      audioEl.value.src = currentRound.value.previewUrl
      audioEl.value.currentTime = 0
      audioEl.value.load()
      hasPreviewCompleted.value = false

      audioEl.value
        .play()
        .then(() => {
          isAudioPlaying.value = true
        })
        .catch(() => {
          isAudioPlaying.value = false
        })
    }

    const toggleAudio = () => {
      if (!audioEl.value || !currentRound.value?.previewUrl) return

      if (audioEl.value.paused) {
        if (elapsedMs.value >= PREVIEW_LIMIT_MS || audioEl.value.currentTime * 1000 >= PREVIEW_LIMIT_MS) {
          audioEl.value.currentTime = 0
          elapsedMs.value = 0
        }

        hasPreviewCompleted.value = false
        audioEl.value.play().then(() => {
          isAudioPlaying.value = true
        })
      } else {
        audioEl.value.pause()
        isAudioPlaying.value = false
      }
    }

    const handleSelectOption = option => {
      if (!currentRound.value || isAnswerLocked.value) return
      selectedOptionId.value = option.trackId
      const isCorrect = option.trackId === currentRound.value.correctTrackId
      const nextResults = [...roundResults.value]
      nextResults[roundIndex.value] = isCorrect ? 'correct' : 'wrong'
      roundResults.value = nextResults
    }

    const resetRoundState = () => {
      selectedOptionId.value = null
      elapsedMs.value = 0
      hasPreviewCompleted.value = false
    }

    const updateElapsedFromAudio = () => {
      if (!audioEl.value) return

      const ms = audioEl.value.currentTime * 1000
      elapsedMs.value = Math.min(PREVIEW_LIMIT_MS, ms)
    }

    const handleTimeUpdate = () => {
      updateElapsedFromAudio()

      if (elapsedMs.value >= PREVIEW_LIMIT_MS && audioEl.value && !audioEl.value.paused) {
        audioEl.value.pause()
        isAudioPlaying.value = false
        hasPreviewCompleted.value = true
      }
    }

    const handleEnded = () => {
      updateElapsedFromAudio()
      isAudioPlaying.value = false
      hasPreviewCompleted.value = true
    }

    const goNextRound = () => {
      if (!isAnswerLocked.value) return

      if (!isLastRound.value) {
        roundIndex.value += 1

        return
      }

      stopAudio()
      isStatsDialogOpen.value = true
    }

    const getOptionClass = option => {
      if (!isAnswerLocked.value) return ''

      if (option.trackId === currentRound.value?.correctTrackId) return 'is-correct'

      if (option.trackId === selectedOptionId.value) return 'is-wrong'

      return ''
    }

    const getRoundIndicatorClass = idx => {
      const status = roundResults.value[idx]

      if (status === 'correct') return 'is-correct'

      if (status === 'wrong') return 'is-wrong'

      if (idx === roundIndex.value) return 'is-active'

      return ''
    }

    watch(
      () => currentRound.value?.roundId,
      () => {
        resetRoundState()
        playCurrentPreview()
      }
    )

    onUnmounted(() => {
      stopAudio()
    })

    const reFetch = async () => {
      await fetch()
    }

    const handleStatsClosed = () => {
      isStatsDialogOpen.value = false
    }

    const playAgain = async () => {
      await fetch()
    }

    const handleStatsCancelled = async () => {
      isStatsDialogOpen.value = false
      await playAgain()
    }

    const handleStatsConfirmed = () => {
      isStatsDialogOpen.value = false
      router.replace(localePath({ name: 'MusicMode-GuessTheSong' }))
    }

    useMeta(() => ({
      title: i18n.t('seo.musicMode.guessTheSongPlay.title', { artists: selectedArtists.value.map(artist => artist.artistName).join(',') }),
      description: i18n.t('seo.musicMode.guessTheSongPlay.description', {
        artists: selectedArtists.value.map(artist => artist.artistName).join(',')
      }),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: i18n.t('seo.musicMode.guessTheSongPlay.title', {
            artists: selectedArtists.value.map(artist => artist.artistName).join(',')
          })
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.musicMode.guessTheSongPlay.description', {
            artists: selectedArtists.value.map(artist => artist.artistName).join(',')
          })
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.musicMode.guessTheSongPlay.description', {
            artists: selectedArtists.value.map(artist => artist.artistName).join(',')
          })
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.musicMode.guessTheSongPlay.keywords')
        }
      ]
    }))

    return {
      fetch,
      fetchState,
      reFetch,
      rootRef,
      rounds,
      currentRound,
      isAnswerLocked,
      isAudioPlaying,
      roundLabel,
      isLastRound,
      playLabel,
      pauseLabel,
      nextLabel,
      finishLabel,
      pickSongLabel,
      playHintText,
      remainingLabel,
      limitLabel,
      audioToggleIcon,
      roundIndicators,
      audioEl,
      toggleAudio,
      handleSelectOption,
      getOptionClass,
      getRoundIndicatorClass,
      handleTimeUpdate,
      handleEnded,
      goNextRound,
      isStatsDialogOpen,
      stats,
      selectedArtists,
      statsButtonLabel,
      handleStatsClosed,
      handleStatsCancelled,
      handleStatsConfirmed
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./GuessTheSongPlayScene.component.scss"></style>
