<template lang="pug">
Dialog.dialog.menu-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.menu.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  template(v-if="$auth.loggedIn && $auth.user")
    span.menu-dialog__title Profil

    .menu-dialog-profile
      PlayerAvatar(with-username :user="$auth.user" :size="32")

    CellGroup.menu-dialog-nav
      Cell.menu-dialog-nav__item(
        icon="edit"
        size="large"
        is-link
        :title="$t('dialog.menu.profileEdit')"
        @click.native="handleClickProfileEdit"
      )
      Cell.menu-dialog-nav__item(
        icon="manager"
        size="large"
        is-link
        :title="$t('dialog.menu.profileView')"
        @click.native="handleClickProfileView"
      )

  Button.menu-dialog__logoutButton(v-if="$auth.loggedIn && $auth.user" @click="handleClickLogout") Çıkış Yap
  LoginForm(v-else)

  span.menu-dialog__title {{ $t('dialog.menu.title') }}
  CellGroup.menu-dialog-nav
    Cell.menu-dialog-nav__item(icon="eye-o" size="large" :title="$t('dialog.menu.darkTheme')")
      template(#right-icon)
        SwitchInput(v-model="isDark" size="22px" @change="toggleDarkTheme")
    Cell.menu-dialog-nav__item(icon="music-o" size="large" :title="$t('dialog.menu.soundFx')")
      template(#right-icon)
        SwitchInput(v-model="isActiveSoundFx" size="22px" @change="toggleSoundFx")
    Cell.menu-dialog-nav__item(
      v-if="$route.path === localePath({ name: 'Main' })"
      icon="font-o"
      size="large"
      is-link
      :title="$t('dialog.menu.switchLocale')"
      @click.native="$emit('clickedSwitchLocale')"
    )
    Cell.menu-dialog-nav__item(
      v-if="activeGameMode && activeGameMode.length > 0"
      icon="info-o"
      size="large"
      is-link
      :title="$t('dialog.menu.howToPLay')"
      @click.native="$emit('clickedHowToPlay')"
    )
    Cell.menu-dialog-nav__item(
      v-if="activeGameMode === gameModeKeyEnum.DAILY || activeGameMode === gameModeKeyEnum.UNLIMITED || activeGameMode === gameModeKeyEnum.CREATOR"
      icon="bar-chart-o"
      size="large"
      is-link
      :title="$t('dialog.menu.howToCalculateStats')"
      @click.native="$emit('clickedHowToCalculateStats')"
    )
    Cell.menu-dialog-nav__item(
      v-if="$route.path === localePath({ name: 'CreatorMode-CreatorModeRoom' })"
      icon="smile-comment-o"
      size="large"
      is-link
      :title="$t('dialog.menu.shareRoom')"
      @click.native="openRoomSharer"
    )
    Cell.menu-dialog-nav__item(
      v-if="$route.path === localePath({ name: 'CreatorMode-CreatorModeRoom' })"
      icon="chat-o"
      size="large"
      is-link
      :title="$t('dialog.menu.reviewRoom')"
      @click.native="$emit('clickedReviewRoom')"
    )
    Cell.menu-dialog-nav__item(
      icon="smile-comment-o"
      size="large"
      is-link
      :title="$t('dialog.menu.shareApp')"
      @click.native="openAppSharer"
    )
    Cell.menu-dialog-nav__item(
      icon="manager-o"
      size="large"
      is-link
      :title="$t('dialog.menu.credits')"
      @click.native="$emit('clickedCredits')"
    )
    Cell.menu-dialog-nav__item(
      v-if="$i18n.locale === $i18n.defaultLocale"
      icon="question-o"
      size="large"
      is-link
      :title="$t('dialog.menu.suggestQa')"
      @click.native="openSuggestQuestion"
    )
    Cell.menu-dialog-nav__item(
      icon="guide-o"
      size="large"
      is-link
      :title="$t('dialog.menu.contact')"
      @click.native="$emit('clickedContact')"
    )
</template>

<script>
import { defineComponent, useRoute, useRouter, useStore, useContext, ref, reactive, computed, watch } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { gameModeKeyEnum } from '@/enums'
import { Dialog, CellGroup, Cell, Switch, Toast, Button } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    CellGroup,
    Cell,
    SwitchInput: Switch,
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
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const { localePath, i18n, $colorMode, $auth } = useContext()

    const { activeGameMode } = useGameMode()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

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
      $colorMode.preference = isChecked ? 'dark' : 'light'
      // Theme color'ı hemen güncelle
      const themeColor = isChecked ? '#161616' : '#eeeeee'
      const statusBarStyle = isChecked ? 'black' : 'default'

      // Meta etiketlerini güncelle
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
      document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', statusBarStyle)
    }

    const isActiveSoundFx = computed(() => store.getters['app/isActiveSoundFx'])

    const toggleSoundFx = isChecked => {
      store.commit('app/SET_IS_ACTIVE_SOUND_FX', isChecked)
    }

    const openSuggestQuestion = () => {
      window.open(
        'https://docs.google.com/forms/d/e/1FAIpQLSec4_MAFiDOjpd9pywfocFsfJQoXfMpLT3HIaHpO0Lz3clnaA/viewform?usp=sf_link',
        '_blank'
      )
    }

    const room = computed(() => store.getters['creator/room'])
    const questions = computed(() => store.getters['creator/questions'])

    const openRoomSharer = async () => {
      const shareText = i18n.t('sharer.room.description', {
        roomTitle: room.value.title,
        questionCount: questions.value.length,
        url: `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom', query: { id: route.value.query.id } })}`
      })

      try {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('clipboard.callback.success'),
          position: 'bottom'
        })
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('clipboard.callback.success'),
          position: 'bottom'
        })
      }
    }

    const openAppSharer = async () => {
      const shareText = i18n.t('sharer.app.description')
      window.postMessage({ type: 'sharer', data: shareText })

      try {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('clipboard.callback.success'),
          position: 'bottom'
        })
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('clipboard.callback.success'),
          position: 'bottom'
        })
      }
    }

    const handleClickProfileEdit = () => {
      router.push(localePath({ name: 'Profile-ProfileEdit', query: { username: $auth.user.username } }))

      state.isOpen = false
    }

    const handleClickProfileView = () => {
      router.push(localePath({ name: 'Profile', query: { username: $auth.user.username } }))

      state.isOpen = false
    }

    const handleClickLogout = async () => {
      await store.dispatch('auth/logout')

      window.location.href = '/'
    }

    return {
      gameModeKeyEnum,
      activeGameMode,
      state,
      isDark,
      toggleDarkTheme,
      isActiveSoundFx,
      toggleSoundFx,
      openSuggestQuestion,
      openRoomSharer,
      openAppSharer,
      handleClickProfileEdit,
      handleClickProfileView,
      handleClickLogout
    }
  }
})
</script>

<style lang="scss" src="./MenuDialog.component.scss"></style>
