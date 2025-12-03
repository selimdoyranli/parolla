<template lang="pug">
.scene.game-scene.music-mode-scene(ref="rootRef")
  // Scene Inner
  .scene__inner.game-scene__inner.music-mode-scene__inner
    // Fetch State
    template(v-if="fetchState.pending")
      Empty(:description="$t('gameScene.pendingQuestions')")

    template(v-else-if="fetchState.error")
      Empty(image="error" :description="$t('gameScene.error.fetchQuestions.description')")
        Button(@click="reFetch") {{ $t('gameScene.error.fetchQuestions.action') }}

    template(v-else)
      header.music-mode-scene-header
        h1.music-mode-scene-header-title
          AppIcon.music-mode-scene-header-title__icon(name="emojione:musical-notes")
          span.music-mode-scene-header-title__text {{ $t('musicMode.title') }}

        p.music-mode-scene__subtitle {{ $t('musicMode.subtitle') }}

      form.music-mode-scene-form
        MusicArtistSelect(ref="musicArtistSelectRef" @select="handleArtistSelect" @remove="handleArtistRemove")

      .music-mode-scene-selected-artists
        span.music-mode-scene-selected-artists-title {{ $t('musicMode.selectedArtists.title') }}

        Empty.music-mode-scene-selected-artists-empty(
          v-if="selectedArtists.length === 0"
          :description="$t('musicMode.selectedArtists.empty')"
        )
          template(#image)
            AppIcon(name="emojione:microphone" color="var(--color-icon-01)" :width="100" :height="100")

        .music-mode-scene-selected-artists__list
          .music-mode-scene-selected-artist(v-for="selectedArtist in selectedArtists" :key="selectedArtist.artistId")
            .music-mode-scene-selected-artist-image-wrapper
              img.music-mode-scene-selected-artist-image(
                v-if="selectedArtist.artwork?.artworkUrl"
                :src="selectedArtist.artwork.artworkUrl"
                :alt="selectedArtist.artistName"
              )
              AppIcon.music-mode-scene-selected-artist-icon(v-else name="tabler:music")
              button.music-mode-scene-selected-artist-remove(type="button" @click="handleArtistRemove(selectedArtist)") ×
            span.music-mode-scene-selected-artist-text {{ selectedArtist.artistName }}

      Button.music-mode-scene-play-button(type="button" :disabled="selectedArtists.length === 0" @click="handleClickPlayButton")
        | {{ $t('musicMode.play') }}
</template>

<script>
import { defineComponent, useFetch, useStore, useContext, ref, reactive, computed, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { Button, Empty, Field, Toast } from 'vant'

export default defineComponent({
  components: {
    Button,
    Empty,
    Field
  },
  setup() {
    const rootRef = ref(null)
    const musicArtistSelectRef = ref(null)

    const store = useStore()
    const { i18n } = useContext()

    const artists = ref([])
    const selectedArtists = ref([])

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('music/fetchArtists', { term: 'adamlar' })
    })

    const form = reactive({
      artistKeyword: ''
    })

    const handleArtistSelect = artist => {
      if (artist && !selectedArtists.value.find(a => a.artistId === artist.artistId)) {
        selectedArtists.value.push(artist)
      }
    }

    const handleArtistRemove = artist => {
      if (artist) {
        const index = selectedArtists.value.findIndex(a => a.artistId === artist.artistId)

        if (index > -1) {
          selectedArtists.value.splice(index, 1)
        }

        if (musicArtistSelectRef.value && musicArtistSelectRef.value.selectedArtist) {
          const selectIndex = musicArtistSelectRef.value.selectedArtist.findIndex(a => a.artistId === artist.artistId)

          if (selectIndex > -1) {
            musicArtistSelectRef.value.selectedArtist.splice(selectIndex, 1)
          }
        }
      }
    }

    onMounted(() => {})

    onUnmounted(() => {})
    const reFetch = async () => {
      await fetch()
    }

    return {
      fetch,
      fetchState,
      reFetch,
      rootRef,
      musicArtistSelectRef,
      form,
      artists,
      selectedArtists,
      handleArtistSelect,
      handleArtistRemove
    }
  }
})
</script>

<style lang="scss" src="./MusicModeScene.component.scss"></style>
