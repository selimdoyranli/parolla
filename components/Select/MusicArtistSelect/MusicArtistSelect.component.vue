<template lang="pug">
.music-artist-select
  span.music-artist-select__label {{ $t('musicMode.form.searchArtist.label') }}
  multiselect(
    v-model="selectedArtist"
    label="artistName"
    :placeholder="$t('musicMode.form.searchArtist.placeholder')"
    track-by="artistId"
    :options="artists"
    :searchable="true"
    :multiple="true"
    :internal-search="false"
    :close-on-select="true"
    :clear-on-select="false"
    :show-labels="false"
    :reset-after="true"
    :max="3"
    :loading="isLoading"
    @search-change="handleSearchChange"
    @select="handleSelect"
    @remove="handleRemove"
  )
    template(#placeholder)
      .placeholder
        AppIcon.placeholder__icon(name="tabler:search" :width="20" :height="20")
        span.placeholder__text {{ $t('musicMode.form.searchArtist.placeholder') }}
    template(slot="option" slot-scope="{ option }")
      .music-artist-select__option
        img.music-artist-select__option-image(v-if="option.artwork?.artworkUrl" :src="option.artwork.artworkUrl" :alt="option.artistName")
        AppIcon.music-artist-select__option-icon(v-else name="tabler:music")
        span.music-artist-select__option-text {{ option.artistName }}
        span.music-artist-select__option-genre(v-if="option.primaryGenreName") {{ option.primaryGenreName }}
    template(slot="noResult")
      .music-artist-select__no-result
        span {{ $t('musicMode.form.searchArtist.noResult') }}
    template(slot="noOptions")
      .music-artist-select__no-options
        span {{ $t('musicMode.form.searchArtist.noOptions') }}
    template(slot="maxElements")
      .music-artist-select__max-elements
        span {{ $t('musicMode.form.searchArtist.maxElements') }}
</template>

<script>
import { defineComponent, ref, useStore } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import Multiselect from 'vue-multiselect'

export default defineComponent({
  name: 'MusicArtistSelect',
  components: {
    Multiselect
  },
  setup(props, { emit }) {
    const store = useStore()

    const selectedArtist = ref([])
    const artists = ref([])
    const isLoading = ref(false)

    const searchArtists = async searchQuery => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        artists.value = []

        return
      }

      isLoading.value = true

      try {
        const { data, error } = await store.dispatch('music/fetchArtists', {
          term: searchQuery.trim()
        })

        if (data?.length) {
          artists.value = data || []
        }

        if (error) {
          console.error('Error fetching artists:', error)
          artists.value = []
        }
      } catch (error) {
        console.error('Error fetching artists:', error)
        artists.value = []
      } finally {
        isLoading.value = false
      }
    }

    const debouncedSearch = useDebounceFn(searchArtists, 500)

    const handleSearchChange = searchQuery => {
      debouncedSearch(searchQuery)
    }

    const handleSelect = selectedOption => {
      emit('select', selectedOption)
    }

    const handleRemove = removedOption => {
      emit('remove', removedOption)
    }

    return {
      selectedArtist,
      artists,
      isLoading,
      handleSearchChange,
      handleSelect,
      handleRemove
    }
  }
})
</script>

<style lang="scss" src="./MusicArtistSelect.component.scss"></style>
<style lang="scss">
@import 'vue-multiselect/dist/vue-multiselect.min.css';
</style>
