<template lang="pug">
.scene.game-scene.guess-the-song-scene(ref="rootRef")
  // Scene Inner
  .scene__inner.game-scene__inner.guess-the-song-scene__inner
    header.guess-the-song-scene-header
      h1.guess-the-song-scene-header-title
        AppIcon.guess-the-song-scene-header-title__icon(name="emojione:musical-notes" :width="32" :height="32")
        span.guess-the-song-scene-header-title__text {{ $t('musicMode.title') }}

      p.guess-the-song-scene__subtitle {{ $t('musicMode.guessTheSong.subtitle') }}

    form.guess-the-song-scene-form
      MusicArtistSelect(ref="musicArtistSelectRef" @select="handleArtistSelect" @remove="handleArtistRemove")

    .guess-the-song-scene-selected-artists
      span.guess-the-song-scene-selected-artists-title {{ $t('musicMode.selectedArtists.title') }}

      Empty.guess-the-song-scene-selected-artists-empty(
        v-if="selectedArtists.length === 0"
        :description="$t('musicMode.selectedArtists.empty')"
      )
        template(#image)
          AppIcon(name="emojione:microphone" color="var(--color-icon-01)" :width="100" :height="100")

      .guess-the-song-scene-selected-artists__list
        .guess-the-song-scene-selected-artist(v-for="selectedArtist in selectedArtists" :key="selectedArtist.artistId")
          .guess-the-song-scene-selected-artist-image-wrapper
            img.guess-the-song-scene-selected-artist-image(
              v-if="selectedArtist.artwork?.artworkUrl"
              :src="selectedArtist.artwork.artworkUrl"
              :alt="selectedArtist.artistName"
            )
            AppIcon.guess-the-song-scene-selected-artist-icon(v-else name="tabler:music" :width="100" :height="100")
            button.guess-the-song-scene-selected-artist-remove(type="button" @click="handleArtistRemove(selectedArtist)") ×
          span.guess-the-song-scene-selected-artist-text {{ selectedArtist.artistName }}

    Button.guess-the-song-scene-play-button(type="button" :disabled="selectedArtists.length === 0" @click="handleClickPlayButton")
      | {{ $t('musicMode.play') }}
</template>

<script>
import { defineComponent, useContext, useRouter, ref, reactive } from '@nuxtjs/composition-api'
import { Button, Empty, Field } from 'vant'

export default defineComponent({
  components: {
    Button,
    Empty,
    Field
  },
  setup() {
    const rootRef = ref(null)
    const musicArtistSelectRef = ref(null)

    const { localePath } = useContext()
    const router = useRouter()

    const artists = ref([])
    const selectedArtists = ref([])

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

    const handleClickPlayButton = () => {
      router.push(
        localePath({
          name: 'MusicMode-GuessTheSong-Play',
          query: { artistIds: selectedArtists.value.map(artist => artist.artistId).join(',') }
        })
      )
    }

    return {
      rootRef,
      musicArtistSelectRef,
      form,
      artists,
      selectedArtists,
      handleArtistSelect,
      handleArtistRemove,
      handleClickPlayButton
    }
  }
})
</script>

<style lang="scss" src="./GuessTheSongScene.component.scss"></style>
