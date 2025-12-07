<template lang="pug">
Dialog.dialog.stats-dialog.guess-the-song-stats-dialog(
  v-model="state.isOpen"
  :title="$t('general.stats')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :confirm-button-text="confirmButtonText || $t('general.ok')"
  :show-cancel-button="true"
  :show-confirm-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @cancel="$emit('onCancel')"
  @confirm="$emit('onConfirm')"
)
  .results
    .results__score
      span.results__score-label {{ $t('musicMode.guessTheSong.stats.score') }}
      span.results__score-value {{ correctAnswerCount }}/{{ totalAnswerCount }}

    .results__selected-artists.mb-base(v-if="selectedArtistsList.length")
      span.results__selected-artists-title {{ $t('musicMode.selectedArtists.title') }}
      .results__selected-artists-list
        .results__artist(v-for="artist in selectedArtistsList" :key="artist.artistId")
          img.results__artist-avatar(:src="artist.artworkUrl100" :alt="artist.artistName")
          span.results__artist-name {{ artist.artistName }}

    // Actions
    .stats-dialog__actions
      // Result Sharer
      .result-sharer
        Button.result-sharer__button(color="var(--color-success-01)" icon="share-o" icon-position="right" round @click="shareResults")
          | {{ $t('general.share').toLocaleUpperCase($i18n.locale) }}

      // Ad
      AppAd(:data-ad-slot="9964323575")

    // Footer
    footer.stats-dialog__footer
      i18n.d-flex(path="app.copyright")
        template(#logo)
          FooterBrandLogo
</template>

<script>
import { defineComponent, useContext, reactive, watch, computed } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { Dialog, Button, Toast } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Button
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    },
    confirmButtonText: {
      type: String,
      required: false,
      default: null
    },
    stats: {
      type: Object,
      required: false,
      default: () => ({
        correct: 0,
        total: 0
      })
    },
    selectedArtists: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props) {
    const { i18n } = useContext()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const correctAnswerCount = computed(() => props.stats?.correct || 0)
    const totalAnswerCount = computed(() => props.stats?.total || 0)

    const selectedArtistsList = computed(() => props.selectedArtists || [])

    const shareResults = async () => {
      const shareText = i18n.t('sharer.guessTheSongStats.description', {
        score: `${correctAnswerCount.value}/${totalAnswerCount.value}`,
        artists: selectedArtistsList.value.map(artist => artist.artistName).join(', '),
        url: APP_URL
      })

      window.postMessage({ type: 'sharer', data: shareText })

      try {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('dialog.stats.clipboard.score.callback.success'),
          position: 'bottom'
        })
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('dialog.stats.clipboard.score.callback.success'),
          position: 'bottom'
        })
      }
    }

    return {
      state,
      shareResults,
      correctAnswerCount,
      totalAnswerCount,
      selectedArtistsList
    }
  }
})
</script>

<style lang="scss" src="./GuessTheSongStatsDialog.component.scss"></style>
