<template lang="pug">
.music-artist-select
  // Search field
  .music-artist-select__search(:class="{ 'music-artist-select__search--focused': isFocused }")
    AppIcon.music-artist-select__search-icon(name="tabler:search" :width="22" :height="22")
    input.music-artist-select__search-input(
      ref="inputRef"
      type="text"
      :value="query"
      :placeholder="$t('musicMode.form.searchArtist.placeholder')"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown.enter.prevent="noop"
    )
    .music-artist-select__search-spinner(v-if="isLoading")
    button.music-artist-select__search-clear(v-else-if="query.length" type="button" :aria-label="$t('general.close')" @click="handleClear")
      AppIcon(name="tabler:x" :width="18" :height="18")

  // Results
  transition(name="music-artist-select-results")
    .music-artist-select__results(v-if="isActive")
      // Loading (first search, no prior results)
      .music-artist-select__state(v-if="isLoading && !hasResults")
        .music-artist-select__state-spinner
        span.music-artist-select__state-text {{ $t('musicMode.form.searchArtist.searching') }}

      // No result
      .music-artist-select__state(v-else-if="hasSearched && !hasResults")
        AppIcon.music-artist-select__state-icon(name="tabler:mood-empty" :width="30" :height="30")
        span.music-artist-select__state-text {{ $t('musicMode.form.searchArtist.noResult') }}

      template(v-else)
        // Artists group
        .music-artist-select-group(v-if="artists.length")
          .music-artist-select-group__header
            AppIcon.music-artist-select-group__header-icon(name="tabler:microphone-2" :width="16" :height="16")
            span.music-artist-select-group__header-text {{ $t('musicMode.groups.artists') }}
          .music-artist-select-group__carousel
            .music-artist-select-group__swiper.swiper(ref="artistsSwiperRef")
              .swiper-wrapper
                .swiper-slide.music-artist-select-artist(
                  v-for="artist in artists"
                  :key="artist.key"
                  :class="artistClasses(artist)"
                  @click="handleSelectItem(artist)"
                )
                  .music-artist-select-artist__avatar
                    img.music-artist-select-artist__image(
                      v-if="artist.artworkUrl"
                      :src="artist.artworkUrl"
                      loading="lazy"
                      :alt="artist.displayName"
                    )
                    AppIcon.music-artist-select-artist__placeholder(v-else name="tabler:music" :width="28" :height="28")
                    span.music-artist-select-artist__check
                      AppIcon(name="tabler:check" :width="14" :height="14")
                  span.music-artist-select-artist__name {{ artist.displayName }}
            button.music-artist-select-group__nav.music-artist-select-group__nav--prev(
              ref="artistsPrevRef"
              type="button"
              aria-label="prev"
            )
              AppIcon(name="tabler:chevron-left" :width="20" :height="20")
            button.music-artist-select-group__nav.music-artist-select-group__nav--next(
              ref="artistsNextRef"
              type="button"
              aria-label="next"
            )
              AppIcon(name="tabler:chevron-right" :width="20" :height="20")

        // Playlists group
        .music-artist-select-group.music-artist-select-group--playlists(v-if="playlists.length")
          .music-artist-select-group__header
            AppIcon.music-artist-select-group__header-icon(name="tabler:playlist" :width="16" :height="16")
            span.music-artist-select-group__header-text {{ $t('musicMode.groups.playlists') }}
          .music-artist-select-group__carousel
            .music-artist-select-group__swiper.swiper(ref="playlistsSwiperRef")
              .swiper-wrapper
                .swiper-slide.music-artist-select-playlist(
                  v-for="playlist in playlists"
                  :key="playlist.key"
                  :class="{ 'music-artist-select-playlist--selected': isSelected(playlist.key) }"
                  @click="handleSelectItem(playlist)"
                )
                  .music-artist-select-playlist__art
                    img.music-artist-select-playlist__image(
                      v-if="playlist.artworkUrl"
                      :src="playlist.artworkUrl"
                      loading="lazy"
                      :alt="playlist.displayName"
                    )
                    AppIcon.music-artist-select-playlist__placeholder(v-else name="tabler:playlist" :width="24" :height="24")
                  .music-artist-select-playlist__info
                    span.music-artist-select-playlist__name {{ playlist.displayName }}
                    span.music-artist-select-playlist__meta {{ $t('musicMode.appleMusic') }}
                  span.music-artist-select-playlist__check
                    AppIcon(name="tabler:check" :width="14" :height="14")
            button.music-artist-select-group__nav.music-artist-select-group__nav--prev(
              ref="playlistsPrevRef"
              type="button"
              aria-label="prev"
            )
              AppIcon(name="tabler:chevron-left" :width="20" :height="20")
            button.music-artist-select-group__nav.music-artist-select-group__nav--next(
              ref="playlistsNextRef"
              type="button"
              aria-label="next"
            )
              AppIcon(name="tabler:chevron-right" :width="20" :height="20")
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import Swiper, { Navigation } from 'swiper'
import 'swiper/swiper-bundle.min.css'

export default defineComponent({
  name: 'MusicArtistSelect',
  props: {
    selectedKeys: {
      type: Array,
      default: () => []
    },
    artistsDisabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()

    const query = ref('')
    const isFocused = ref(false)
    const isLoading = ref(false)
    const hasSearched = ref(false)
    const artists = ref([])
    const playlists = ref([])

    const artistsSwiperRef = ref(null)
    const playlistsSwiperRef = ref(null)
    const artistsPrevRef = ref(null)
    const artistsNextRef = ref(null)
    const playlistsPrevRef = ref(null)
    const playlistsNextRef = ref(null)

    let artistsSwiper = null
    let playlistsSwiper = null

    const isActive = computed(() => query.value.trim().length >= 2)
    const hasResults = computed(() => artists.value.length > 0 || playlists.value.length > 0)

    const isSelected = key => props.selectedKeys.includes(key)

    const artistClasses = artist => ({
      'music-artist-select-artist--selected': isSelected(artist.key),
      'music-artist-select-artist--disabled': props.artistsDisabled && !isSelected(artist.key)
    })

    const destroySwiper = instance => {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy(true, true)
      }
    }

    const buildSwiper = (el, prevEl, nextEl) =>
      new Swiper(el, {
        modules: [Navigation],
        cssMode: true,
        slidesPerView: 'auto',
        spaceBetween: 12,
        speed: 500,
        watchOverflow: true,
        navigation: { prevEl, nextEl }
      })

    const refreshCarousels = async () => {
      await nextTick()

      destroySwiper(artistsSwiper)
      destroySwiper(playlistsSwiper)
      artistsSwiper = null
      playlistsSwiper = null

      if (artists.value.length && artistsSwiperRef.value) {
        artistsSwiper = buildSwiper(artistsSwiperRef.value, artistsPrevRef.value, artistsNextRef.value)
      }

      if (playlists.value.length && playlistsSwiperRef.value) {
        playlistsSwiper = buildSwiper(playlistsSwiperRef.value, playlistsPrevRef.value, playlistsNextRef.value)
      }
    }

    const resetResults = () => {
      artists.value = []
      playlists.value = []
      hasSearched.value = false
    }

    const searchMusic = async term => {
      const trimmed = term.trim()

      if (trimmed.length < 2) {
        resetResults()

        return
      }

      isLoading.value = true

      try {
        const [artistsResult, playlistsResult] = await Promise.all([
          store.dispatch('music/fetchArtists', { term: trimmed, locale: i18n.locale }),
          store.dispatch('music/searchPlaylists', { term: trimmed, locale: i18n.locale })
        ])

        artists.value = (artistsResult?.data || []).map(artist => ({
          ...artist,
          type: 'artist',
          key: `artist:${artist.artistId}`,
          displayName: artist.artistName,
          artworkUrl: artist.artwork?.artworkUrl || null
        }))

        playlists.value = (playlistsResult?.data || []).map(playlist => ({
          ...playlist,
          type: 'playlist',
          key: `playlist:${playlist.playlistId}`,
          displayName: playlist.name
        }))
      } catch (error) {
        console.error('Error searching music:', error)
        artists.value = []
        playlists.value = []
      } finally {
        isLoading.value = false
        hasSearched.value = true
      }
    }

    const debouncedSearch = useDebounceFn(searchMusic, 500)

    const handleInput = event => {
      query.value = event.target.value

      if (query.value.trim().length < 2) {
        resetResults()

        return
      }

      debouncedSearch(query.value)
    }

    const handleClear = () => {
      query.value = ''
      resetResults()
    }

    const handleSelectItem = item => {
      emit('select', item)
    }

    const noop = () => {}

    watch([artists, playlists], () => {
      refreshCarousels()
    })

    onBeforeUnmount(() => {
      destroySwiper(artistsSwiper)
      destroySwiper(playlistsSwiper)
    })

    return {
      query,
      isFocused,
      isLoading,
      hasSearched,
      artists,
      playlists,
      isActive,
      hasResults,
      isSelected,
      artistClasses,
      handleInput,
      handleClear,
      handleSelectItem,
      noop,
      artistsSwiperRef,
      playlistsSwiperRef,
      artistsPrevRef,
      artistsNextRef,
      playlistsPrevRef,
      playlistsNextRef
    }
  }
})
</script>

<style lang="scss" src="./MusicArtistSelect.component.scss"></style>
