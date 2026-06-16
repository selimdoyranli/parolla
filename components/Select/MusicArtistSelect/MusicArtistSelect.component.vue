<template lang="pug">
.music-artist-select
  span.music-artist-select__label {{ $t('musicMode.form.searchArtist.label') }}
  multiselect(
    v-model="selected"
    label="displayName"
    :placeholder="$t('musicMode.form.searchArtist.placeholder')"
    track-by="key"
    group-label="groupLabel"
    group-values="items"
    :options="groups"
    :group-select="false"
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
      .music-artist-select__option(v-if="option.$isLabel")
        span.music-artist-select__option-group {{ option.$groupLabel }}
      .music-artist-select__option(v-else)
        img.music-artist-select__option-image(v-if="option.artworkUrl" :src="option.artworkUrl" :alt="option.displayName")
        AppIcon.music-artist-select__option-icon(v-else :name="option.type === 'playlist' ? 'tabler:playlist' : 'tabler:music'")
        span.music-artist-select__option-text {{ option.displayName }}
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
import { defineComponent, ref, useStore, useContext } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import Multiselect from 'vue-multiselect'

export default defineComponent({
  name: 'MusicArtistSelect',
  components: {
    Multiselect
  },
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()

    const selected = ref([])
    const groups = ref([])
    const isLoading = ref(false)

    const searchMusic = async searchQuery => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        groups.value = []

        return
      }

      isLoading.value = true

      try {
        const [artistsResult, playlistsResult] = await Promise.all([
          store.dispatch('music/fetchArtists', { term: searchQuery.trim() }),
          store.dispatch('music/searchPlaylists', { term: searchQuery.trim(), locale: i18n.locale })
        ])

        const artistItems = (artistsResult?.data || []).map(artist => ({
          ...artist,
          type: 'artist',
          key: `artist:${artist.artistId}`,
          displayName: artist.artistName,
          artworkUrl: artist.artwork?.artworkUrl || null
        }))

        const playlistItems = (playlistsResult?.data || []).map(playlist => ({
          ...playlist,
          type: 'playlist',
          key: `playlist:${playlist.playlistId}`,
          displayName: playlist.name
        }))

        const nextGroups = []

        if (artistItems.length) {
          nextGroups.push({ groupLabel: i18n.t('musicMode.groups.artists'), items: artistItems })
        }

        if (playlistItems.length) {
          nextGroups.push({ groupLabel: i18n.t('musicMode.groups.playlists'), items: playlistItems })
        }

        groups.value = nextGroups
      } catch (error) {
        console.error('Error searching music:', error)
        groups.value = []
      } finally {
        isLoading.value = false
      }
    }

    const debouncedSearch = useDebounceFn(searchMusic, 500)

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
      selected,
      groups,
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
