<template lang="pug">
.menu-more
  span.menu-more__title {{ $t('dialog.menu.title') }}

  span.menu-more__subTitle {{ $t('dialog.menu.soundFx') }}
  CellGroup.menu-more-nav
    Cell.menu-more-nav__item.menu-more-nav__item--soundFx(
      :label="$t('dialog.menu.reactionSoundFxDesc')"
      icon="music-o"
      size="large"
      :title="$t('dialog.menu.reactionSoundFx')"
    )
      template(#right-icon)
        SwitchInput(v-model="isActiveReactionSoundFx" size="22px" @change="toggleReactionSoundFx")
    Cell.menu-more-nav__item.menu-more-nav__item--soundFx(
      :label="$t('dialog.menu.gameSceneSoundFxDesc')"
      icon="music-o"
      size="large"
      :title="$t('dialog.menu.gameSceneSoundFx')"
    )
      template(#right-icon)
        SwitchInput(v-model="isActiveGameSceneSoundFx" size="22px" @change="toggleGameSceneSoundFx")

  CellGroup.menu-more-nav
    Cell.menu-more-nav__item(icon="eye-o" size="large" :title="$t('dialog.menu.darkTheme')")
      template(#right-icon)
        SwitchInput(v-model="isDark" size="22px" @change="toggleDarkTheme")
    Cell.menu-more-nav__item.menu-more-nav__item--wordblockKeyboard(
      v-if="activeGameMode === gameModeKeyEnum.WORDBLOCK"
      icon="font-o"
      size="large"
      :title="$t('dialog.menu.wordblockKeyboard')"
    )
      template(#right-icon)
        SwitchInput(v-model="isActiveKeyboard" size="22px" @change="toggleWordblockKeyboard")
    Cell.menu-more-nav__item(
      v-if="$route.path === localePath({ name: 'Main' })"
      icon="font-o"
      size="large"
      is-link
      :title="$t('dialog.menu.switchLocale')"
      @click.native="openDialog('clickedSwitchLocale')"
    )
    Cell.menu-more-nav__item(
      v-if="activeGameMode && activeGameMode.length > 0"
      icon="info-o"
      size="large"
      is-link
      :title="$t('dialog.menu.howToPLay')"
      @click.native="openDialog('clickedHowToPlay')"
    )
    Cell.menu-more-nav__item(
      v-if="activeGameMode === gameModeKeyEnum.DAILY || activeGameMode === gameModeKeyEnum.UNLIMITED || activeGameMode === gameModeKeyEnum.CREATOR"
      icon="bar-chart-o"
      size="large"
      is-link
      :title="$t('dialog.menu.howToCalculateStats')"
      @click.native="openDialog('clickedHowToCalculateStats')"
    )
    Cell.menu-more-nav__item(
      v-if="$route.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeRoom-slug' }))"
      icon="smile-comment-o"
      size="large"
      is-link
      :title="$t('dialog.menu.shareRoom')"
      @click.native="openRoomSharer"
    )
    Cell.menu-more-nav__item(
      v-if="$route.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeRoom-slug' }))"
      icon="chat-o"
      size="large"
      is-link
      :title="$t('dialog.menu.reviewRoom')"
      @click.native="openDialog('clickedReviewRoom')"
    )
    Cell.menu-more-nav__item(
      v-if="withCommunities"
      icon="friends-o"
      size="large"
      is-link
      :title="$t('dialog.menu.communities')"
      @click.native="navigateAndClose('Community-CommunityList')"
    )
    Cell.menu-more-nav__item(icon="smile-comment-o" size="large" is-link :title="$t('dialog.menu.shareApp')" @click.native="openAppSharer")
    Cell.menu-more-nav__item(
      icon="manager-o"
      size="large"
      is-link
      :title="$t('dialog.menu.credits')"
      @click.native="openDialog('clickedCredits')"
    )
    Cell.menu-more-nav__item(
      v-if="$i18n.locale === $i18n.defaultLocale"
      icon="question-o"
      size="large"
      is-link
      :title="$t('dialog.menu.suggestQa')"
      @click.native="openSuggestQuestion"
    )
    Cell.menu-more-nav__item(
      icon="guide-o"
      size="large"
      is-link
      :title="$t('dialog.menu.contact')"
      @click.native="openDialog('clickedContact')"
    )

  span.menu-more__subTitle {{ $t('dialog.menu.legal') }}
  CellGroup.menu-more-nav
    Cell.menu-more-nav__item(
      icon="shield-o"
      size="large"
      is-link
      :title="$t('dialog.menu.privacyPolicy')"
      @click.native="navigateAndClose('Page-PrivacyPolicy')"
    )
    Cell.menu-more-nav__item(
      icon="notes-o"
      size="large"
      is-link
      :title="$t('dialog.menu.cookiePolicy')"
      @click.native="navigateAndClose('Page-CookiePolicy')"
    )
    Cell.menu-more-nav__item(
      icon="description"
      size="large"
      is-link
      :title="$t('dialog.menu.kvkk')"
      @click.native="navigateAndClose('Page-Kvkk')"
    )
    Cell.menu-more-nav__item(
      icon="balance-o"
      size="large"
      is-link
      :title="$t('dialog.menu.termsOfUse')"
      @click.native="navigateAndClose('Page-TermsOfUse')"
    )
</template>

<script>
import { defineComponent, useRoute, useRouter, useStore, useContext, ref, computed, watch } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { CellGroup, Cell, Switch } from 'vant'
import { useSfx } from '@/composables/useSfx'
import { showToast } from '@/helpers/toast'

// the menu dialog's "More" section (sound/theme toggles, links, legal); shared with the homepage drawer
export default defineComponent({
  name: 'MenuMoreNav',
  components: {
    CellGroup,
    Cell,
    SwitchInput: Switch
  },
  props: {
    // the drawer lists communities at its top already
    withCommunities: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  setup(_, { emit }) {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const { localePath, getRouteBaseName, i18n, $colorMode } = useContext()

    const { activeGameMode } = useGameMode()
    const { postToNative } = useNativeBridge()

    const sfx = useSfx()

    const isDark = ref($colorMode.value === 'dark')

    watch(
      () => $colorMode.value,
      value => {
        if (value === 'dark') {
          isDark.value = true
        } else {
          isDark.value = false
        }
      }
    )

    const toggleDarkTheme = isChecked => {
      sfx.play(isChecked ? 'toggle-on' : 'toggle-off')
      $colorMode.preference = isChecked ? 'dark' : 'light'
      // Theme color'ı hemen güncelle
      const themeColor = isChecked ? '#161616' : '#eeeeee'
      const statusBarStyle = isChecked ? 'black' : 'default'

      // Meta etiketlerini güncelle
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', statusBarStyle)
    }

    const isActiveReactionSoundFx = computed(() => store.getters['app/isActiveReactionSoundFx'])

    const toggleReactionSoundFx = isChecked => {
      // Fire BEFORE the mutation so the "off" tick is heard before
      // the watcher in plugins/acs.js mutes ACS.
      sfx.play(isChecked ? 'toggle-on' : 'toggle-off')
      store.commit('app/SET_IS_ACTIVE_REACTION_SOUND_FX', isChecked)
    }

    const isActiveGameSceneSoundFx = computed(() => store.getters['app/isActiveGameSceneSoundFx'])

    const toggleGameSceneSoundFx = isChecked => {
      sfx.play(isChecked ? 'toggle-on' : 'toggle-off')
      store.commit('app/SET_IS_ACTIVE_GAME_SCENE_SOUND_FX', isChecked)
    }

    const isActiveKeyboard = computed(() => store.getters['wordblock/isActiveKeyboard'])

    const toggleWordblockKeyboard = isChecked => {
      sfx.play(isChecked ? 'toggle-on' : 'toggle-off')
      store.commit('wordblock/SET_IS_ACTIVE_KEYBOARD', isChecked)
    }

    const openSuggestQuestion = () => {
      window.open(
        'https://docs.google.com/forms/d/e/1FAIpQLSec4_MAFiDOjpd9pywfocFsfJQoXfMpLT3HIaHpO0Lz3clnaA/viewform?usp=sf_link',
        '_blank'
      )
    }

    const room = computed(() => store.getters['creator/room'])
    const questions = computed(() => store.getters['creator/questions'])

    const { shareRoom } = useRoomShare()

    const openRoomSharer = () => shareRoom({ ...room.value, roomId: route.value.params.slug, questionCount: questions.value.length })

    const openAppSharer = async () => {
      const shareText = i18n.t('sharer.app.description')
      postToNative('sharer', shareText)

      try {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('clipboard.callback.success'))
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('clipboard.callback.success'))
      }
    }

    // the host closes itself first so the requested dialog replaces it in one tap
    const openDialog = event => {
      emit('close')
      emit(event)
    }

    const navigateAndClose = name => {
      router.push(localePath({ name }))

      emit('close')
    }

    return {
      getRouteBaseName,
      gameModeKeyEnum,
      activeGameMode,
      isDark,
      toggleDarkTheme,
      isActiveReactionSoundFx,
      toggleReactionSoundFx,
      isActiveGameSceneSoundFx,
      toggleGameSceneSoundFx,
      isActiveKeyboard,
      toggleWordblockKeyboard,
      openSuggestQuestion,
      openRoomSharer,
      openAppSharer,
      openDialog,
      navigateAndClose
    }
  }
})
</script>

<style lang="scss" src="./MenuMoreNav.scss"></style>
