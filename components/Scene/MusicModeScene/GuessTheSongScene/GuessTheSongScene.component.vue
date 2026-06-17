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
      MusicArtistSelect(
        ref="musicArtistSelectRef"
        :selected-keys="selectedKeys"
        :artists-disabled="selectedArtists.length >= 3"
        @select="handleSelect"
        @remove="handleArtistRemove"
      )

    .guess-the-song-scene-selected-artists(v-if="selectedArtists.length")
      span.guess-the-song-scene-selected-artists-title {{ $t('musicMode.selectedArtists.title') }}

      .guess-the-song-scene-selected-artists__list
        .guess-the-song-scene-selected-artist(v-for="selectedArtist in selectedArtists" :key="selectedArtist.artistId")
          .guess-the-song-scene-selected-artist-image-wrapper
            img.guess-the-song-scene-selected-artist-image(
              v-if="selectedArtist.artwork?.artworkUrl"
              :src="selectedArtist.artwork.artworkUrl"
              :alt="selectedArtist.artistName"
            )
            AppIcon.guess-the-song-scene-selected-artist-icon(v-else name="tabler:music" :width="60" :height="60")
            button.guess-the-song-scene-selected-artist-remove(type="button" @click="handleArtistRemove(selectedArtist)") ×
          span.guess-the-song-scene-selected-artist-text {{ selectedArtist.artistName }}

    .guess-the-song-scene-selected-playlist(v-if="selectedPlaylist")
      span.guess-the-song-scene-selected-artists-title {{ $t('musicMode.selectedPlaylist.title') }}
      .guess-the-song-scene-selected-playlist-card
        img.guess-the-song-scene-selected-playlist-image(
          v-if="selectedPlaylist.artworkUrl"
          :src="selectedPlaylist.artworkUrl"
          :alt="selectedPlaylist.name"
        )
        AppIcon.guess-the-song-scene-selected-playlist-icon(v-else name="tabler:playlist" :width="60" :height="60")
        span.guess-the-song-scene-selected-playlist-text {{ selectedPlaylist.name }}
        button.guess-the-song-scene-selected-artist-remove(type="button" @click="handlePlaylistRemove") ×

    Button.guess-the-song-scene-play-button(type="button" :disabled="!canPlay" @click="handleClickPlayButton")
      AppIcon.guess-the-song-scene-play-button__icon(name="tabler:player-play-filled" :width="20" :height="20")
      span.guess-the-song-scene-play-button__text {{ $t('musicMode.play') }}

    span.guess-the-song-scene-play-hint {{ $t('musicMode.playHint') }}

    .guess-the-song-scene-popular-artists(v-if="popularArtists.length" :class="[disabledPopularArtistsClass]")
      span.guess-the-song-scene-popular-artists-title {{ $t('musicMode.popularArtists') }}

      .guess-the-song-scene-popular-artists__list
        .guess-the-song-scene-popular-artist(
          v-for="popularArtist in popularArtists"
          :key="popularArtist.artistId"
          @click="handleClickPopularArtist(popularArtist)"
        )
          img.guess-the-song-scene-popular-artist-image(
            v-if="popularArtist.artworkUrl"
            :src="popularArtist.artworkUrl"
            :alt="popularArtist.artistName"
          )
          AppIcon.guess-the-song-scene-popular-artist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-popular-artist-text {{ popularArtist.artistName }}

    .guess-the-song-scene-playlists(v-if="playlists.length")
      span.guess-the-song-scene-playlists-title {{ $t('musicMode.playlists') }}

      .guess-the-song-scene-playlists__list
        .guess-the-song-scene-playlist(v-for="playlist in playlists" :key="playlist.playlistId" @click="handleClickPlaylist(playlist)")
          img.guess-the-song-scene-playlist-image(v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.name")
          AppIcon.guess-the-song-scene-playlist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-playlist-text {{ playlist.name }}

    .guess-the-song-scene-tags(v-if="featuredTags.length")
      button.guess-the-song-scene-tag(
        v-for="tag in featuredTags"
        :key="tag"
        type="button"
        :class="{ 'guess-the-song-scene-tag--active': tag === activeTag }"
        @click="handleSelectTag(tag)"
      ) {{ tag }}

    .guess-the-song-scene-tag-results(v-if="activeTag")
      .guess-the-song-scene-playlists__list(v-if="tagResults.length")
        .guess-the-song-scene-playlist(v-for="playlist in tagResults" :key="playlist.playlistId" @click="handleClickPlaylist(playlist)")
          img.guess-the-song-scene-playlist-image(v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.name")
          AppIcon.guess-the-song-scene-playlist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-playlist-text {{ playlist.name }}

      client-only
        infinite-loading(v-if="tagHasMore" force-use-infinite-wrapper=".layout__main" :identifier="infiniteId" @infinite="handleInfinite")

      span.guess-the-song-scene-tag-results__hint(v-if="!tagLoading && !tagResults.length") {{ $t('musicMode.tagResults.empty') }}

    // Ad
    AppAd(:data-ad-slot="9964323575")
</template>

<script>
import { defineComponent, useContext, useStore, useRouter, useFetch, onMounted, ref, reactive, computed } from '@nuxtjs/composition-api'
import { Button, Empty, Field } from 'vant'

const FEATURED_TAGS = {
  tr: ['Pop', 'Rock', 'Rap', 'Türkçe Pop', 'Metal', 'Elektronik', 'Hip-Hop', "2000'ler", "90'lar", 'Arabesk'],
  en: ['Pop', 'Rock', 'Rap', 'Metal', 'Electronic', 'Hip-Hop', '2000s', '90s', 'R&B', 'Indie']
}

const TAG_PAGE_LIMIT = 21

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
    const { i18n, localePath } = useContext()
    const router = useRouter()

    const selectedArtists = ref([])
    const playlists = ref([])
    const popularArtists = ref([])
    const selectedPlaylist = ref(null)

    const featuredTags = computed(() => FEATURED_TAGS[i18n.locale] || FEATURED_TAGS.en)

    const activeTag = ref(featuredTags.value[0] || null)
    const tagResults = ref([])
    const tagOffset = ref(0)
    const tagHasMore = ref(false)
    const tagLoading = ref(true)
    const infiniteId = ref(0)

    useFetch(async () => {
      const [playlistsRes, artistsRes] = await Promise.all([
        store.dispatch('music/fetchFeaturedPlaylists', { locale: i18n.locale }),
        store.dispatch('music/fetchFeaturedArtists', { locale: i18n.locale })
      ])

      playlists.value = Array.isArray(playlistsRes?.data) ? playlistsRes.data : []
      popularArtists.value = Array.isArray(artistsRes?.data) ? artistsRes.data : []
    })

    const scrollToPlayButton = () => {
      document.querySelector('.guess-the-song-scene-play-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const handleClickPlaylist = playlist => {
      if (!playlist) return

      handlePlaylistSelect(playlist)
      scrollToPlayButton()
    }

    const loadTagFirstPage = async () => {
      if (!activeTag.value) return

      tagResults.value = []
      tagOffset.value = 0
      tagHasMore.value = false
      tagLoading.value = true

      try {
        const { data, meta } = await store.dispatch('music/searchPlaylistsByTag', {
          term: activeTag.value,
          offset: 0,
          limit: TAG_PAGE_LIMIT,
          locale: i18n.locale
        })

        const items = Array.isArray(data) ? data : []

        tagResults.value = items
        tagOffset.value = items.length ? TAG_PAGE_LIMIT : 0
        tagHasMore.value = Boolean(meta?.hasMore) && items.length > 0
      } catch (error) {
        tagResults.value = []
        tagHasMore.value = false
      } finally {
        tagLoading.value = false
        infiniteId.value += 1
      }
    }

    const handleSelectTag = tag => {
      if (activeTag.value === tag) return

      activeTag.value = tag
      loadTagFirstPage()
    }

    const handleInfinite = async $state => {
      if (!activeTag.value || !tagHasMore.value) {
        $state.complete()

        return
      }

      try {
        const { data, meta } = await store.dispatch('music/searchPlaylistsByTag', {
          term: activeTag.value,
          offset: tagOffset.value,
          limit: TAG_PAGE_LIMIT,
          locale: i18n.locale
        })

        const items = Array.isArray(data) ? data : []
        const seen = new Set(tagResults.value.map(playlist => playlist.playlistId))
        const freshItems = items.filter(playlist => !seen.has(playlist.playlistId))

        if (freshItems.length) {
          tagResults.value.push(...freshItems)
        }

        if (items.length) {
          tagOffset.value += TAG_PAGE_LIMIT
        }

        tagHasMore.value = Boolean(meta?.hasMore) && items.length > 0

        if (tagHasMore.value) {
          $state.loaded()
        } else {
          $state.complete()
        }
      } catch (error) {
        $state.complete()
      }
    }

    onMounted(() => {
      loadTagFirstPage()
    })

    const form = reactive({
      artistKeyword: ''
    })

    const handleArtistSelect = artist => {
      if (!artist || selectedArtists.value.length >= 3) return

      if (!selectedArtists.value.find(a => a.artistId === artist.artistId)) {
        selectedPlaylist.value = null
        selectedArtists.value.push(artist)
      }
    }

    const selectedKeys = computed(() => {
      const keys = selectedArtists.value.map(artist => `artist:${artist.artistId}`)

      if (selectedPlaylist.value) {
        keys.push(`playlist:${selectedPlaylist.value.playlistId}`)
      }

      return keys
    })

    const handlePlaylistSelect = playlist => {
      if (!playlist) return

      selectedArtists.value = []
      selectedPlaylist.value = { playlistId: playlist.playlistId, name: playlist.name, artworkUrl: playlist.artworkUrl }
    }

    const handlePlaylistRemove = () => {
      selectedPlaylist.value = null
    }

    const handleSelect = option => {
      if (!option) return

      if (option.type === 'playlist') {
        handlePlaylistSelect(option)
      } else {
        handleArtistSelect(option)
      }

      scrollToPlayButton()
    }

    const handleArtistRemove = artist => {
      if (artist) {
        const index = selectedArtists.value.findIndex(a => a.artistId === artist.artistId)

        if (index > -1) {
          selectedArtists.value.splice(index, 1)
        }
      }
    }

    const handleClickPlayButton = () => {
      const query = selectedPlaylist.value
        ? { playlistId: selectedPlaylist.value.playlistId }
        : { artistIds: selectedArtists.value.map(artist => artist.artistId).join(',') }

      router.push(localePath({ name: 'MusicMode-GuessTheSong-Play', query }))
    }

    const handleClickPopularArtist = artist => {
      if (artist) {
        const mappedArtist = {
          ...artist,
          artwork: {
            artworkUrl: artist.artworkUrl
          }
        }
        handleArtistSelect(mappedArtist)
        scrollToPlayButton()
      }
    }

    const disabledPopularArtistsClass = computed(() => {
      return selectedArtists.value.length >= 3 ? 'disabled' : null
    })

    const canPlay = computed(() => selectedArtists.value.length > 0 || !!selectedPlaylist.value)

    return {
      rootRef,
      musicArtistSelectRef,
      form,
      selectedArtists,
      handleArtistRemove,
      handleClickPlayButton,
      popularArtists,
      handleClickPopularArtist,
      disabledPopularArtistsClass,
      playlists,
      handleClickPlaylist,
      selectedPlaylist,
      handleSelect,
      handlePlaylistRemove,
      selectedKeys,
      canPlay,
      featuredTags,
      activeTag,
      tagResults,
      tagHasMore,
      tagLoading,
      infiniteId,
      handleSelectTag,
      handleInfinite
    }
  }
})
</script>

<style lang="scss" src="./GuessTheSongScene.component.scss"></style>
