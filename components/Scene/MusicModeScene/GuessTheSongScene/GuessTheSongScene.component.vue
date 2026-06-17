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

    .guess-the-song-scene-popular-artists(:class="[disabledPopularArtistsClass]")
      span.guess-the-song-scene-popular-artists-title {{ $t('musicMode.popularArtists') }}

      .guess-the-song-scene-popular-artists__list
        .guess-the-song-scene-popular-artist(
          v-for="popularArtist in popularArtists"
          :key="popularArtist.artistId"
          @click="handleClickPopularArtist(popularArtist)"
        )
          img.guess-the-song-scene-popular-artist-image(
            v-if="popularArtist.artistImage"
            :src="popularArtist.artistImage"
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

    // Ad
    AppAd(:data-ad-slot="9964323575")
</template>

<script>
import { defineComponent, useContext, useStore, useRouter, useFetch, ref, reactive, computed } from '@nuxtjs/composition-api'
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

    const store = useStore()
    const { i18n, localePath } = useContext()
    const router = useRouter()

    const selectedArtists = ref([])
    const playlists = ref([])
    const selectedPlaylist = ref(null)

    useFetch(async () => {
      const { data } = await store.dispatch('music/fetchPlaylists', { locale: i18n.locale })
      playlists.value = Array.isArray(data) ? data : []
    })

    const scrollToPlayButton = () => {
      document.querySelector('.guess-the-song-scene-play-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const handleClickPlaylist = playlist => {
      if (!playlist) return

      handlePlaylistSelect(playlist)
      scrollToPlayButton()
    }

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

    const popularArtists = computed(() => {
      return [
        {
          artistId: 1633245914,
          artistName: 'BLOK3',
          artistLinkUrl: 'https://music.apple.com/us/artist/blok3/1633245914?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/9c/b5/82/9cb582a4-5e8c-d217-a412-7d2d39e37e43/mza_1833975138894458457.png/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 18,
          primaryGenreName: 'Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 1476999072,
          artistName: 'Lvbel C5',
          artistLinkUrl: 'https://music.apple.com/us/artist/lvbel-c5/1476999072?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/99/01/f8/9901f8bc-ffa9-2dac-17b1-cdaf01001e10/pr_source.png/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 18,
          primaryGenreName: 'Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 1793856618,
          artistName: 'manifest',
          artistLinkUrl: 'https://music.apple.com/us/artist/manifest/1793856618?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/25/4f/69/254f69f5-cb43-1cf5-a1a6-bf81065ad93d/cover.jpg/100x100bb.jpg',
          artistType: 'Artist',
          primaryGenreId: 14,
          primaryGenreName: 'Pop',
          wrapperType: 'artist'
        },
        {
          artistId: 1141391002,
          artistName: 'Aleyna Tilki',
          artistLinkUrl: 'https://music.apple.com/us/artist/aleyna-tilki/1141391002?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/94/3c/bc/943cbc87-f0ea-394b-630d-4c055bebf4ad/cover.jpg/100x100bb.jpg',
          artistType: 'Artist',
          primaryGenreId: 100069,
          primaryGenreName: 'Turkish Pop',
          wrapperType: 'artist'
        },
        {
          artistId: 1448922098,
          artistName: 'UZI',
          artistLinkUrl: 'https://music.apple.com/us/artist/uzi/1448922098?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9c/9a/b5/9c9ab537-e649-c177-2453-b9f4764b0cd4/cover.jpg/100x100bb.jpg',
          artistType: 'Artist',
          primaryGenreId: 18,
          primaryGenreName: 'Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 1422539373,
          artistName: 'Ati242',
          artistLinkUrl: 'https://music.apple.com/us/artist/ati242/1422539373?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/AMCArtistImages221/v4/c2/eb/41/c2eb419a-affb-87a1-9aff-cf7eba268f96/2fba0e6b-12a5-42d8-a673-77c8097e65ed_file_cropped.png/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 18,
          primaryGenreName: 'Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 263633866,
          artistName: 'Sagopa Kajmer',
          artistLinkUrl: 'https://music.apple.com/us/artist/sagopa-kajmer/263633866?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/ef/de/99/efde9915-8e5e-87e2-eb26-b66912443681/mzl.vukkloux.jpg/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 100072,
          primaryGenreName: 'Turkish Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 127389488,
          artistName: 'Ceza',
          artistLinkUrl: 'https://music.apple.com/us/artist/ceza/127389488?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f3/af/e2/f3afe2f1-c179-a0ce-347e-5431d7400305/cover.jpg/100x100bb.jpg',
          artistType: 'Artist',
          primaryGenreId: 100072,
          primaryGenreName: 'Turkish Hip-Hop/Rap',
          wrapperType: 'artist'
        },
        {
          artistId: 147491695,
          artistName: 'Duman',
          artistLinkUrl: 'https://music.apple.com/us/artist/duman/147491695?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Features211/v4/b3/e0/d1/b3e0d168-0d31-961b-1e05-bd1ed86de567/mzl.mzyyhtka.jpg/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 100070,
          primaryGenreName: 'Turkish Rock',
          wrapperType: 'artist'
        },
        {
          artistId: 450552292,
          artistName: 'Mabel Matiz',
          artistLinkUrl: 'https://music.apple.com/us/artist/mabel-matiz/450552292?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ab/63/93/ab6393a1-d575-9818-8901-20ec5a47438d/197189366659.jpg/100x100bb.jpg',
          artistType: 'Artist',
          primaryGenreId: 14,
          primaryGenreName: 'Pop',
          wrapperType: 'artist'
        },
        {
          artistId: 426303039,
          artistName: 'Şebnem Ferah',
          artistLinkUrl: 'https://music.apple.com/us/artist/%C5%9Febnem-ferah/426303039?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/a7/52/1aa752a9-0d58-18ff-7bef-30e1b77c431f/cover.jpg/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 100070,
          primaryGenreName: 'Turkish Rock',
          wrapperType: 'artist'
        },
        {
          artistId: 14420857,
          artistName: 'Sezen Aksu',
          artistLinkUrl: 'https://music.apple.com/us/artist/sezen-aksu/14420857?uo=4',
          artistImage:
            'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/75/62/48/75624807-5b53-72a5-8926-cee76fa52091/25UMGIM92899.rgb.jpg/110x110bb.webp',
          artistType: 'Artist',
          primaryGenreId: 14,
          primaryGenreName: 'Pop',
          wrapperType: 'artist'
        }
      ]
    })

    const handleClickPopularArtist = artist => {
      if (artist) {
        const mappedArtist = {
          ...artist,
          artwork: {
            artworkUrl: artist.artistImage
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
      canPlay
    }
  }
})
</script>

<style lang="scss" src="./GuessTheSongScene.component.scss"></style>
