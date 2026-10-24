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
      Cell.menu-dialog-nav__item(
        icon="bookmark"
        size="large"
        is-link
        :title="$t('dialog.menu.myQuizzes')"
        @click.native="handleClickMyQuizzes"
      )
      Cell.menu-dialog-nav__item(
        icon="clock-o"
        size="large"
        is-link
        :title="$t('dialog.menu.activities')"
        @click.native="navigateAndClose('Activities-Likes')"
      )
      Cell.menu-dialog-nav__item(
        v-if="isGmUser($auth.user)"
        icon="shield-o"
        size="large"
        is-link
        :title="$t('gmPanel.menu')"
        @click.native="navigateAndClose('GmPanel-Wordblock')"
      )

  Button.menu-dialog__logoutButton(v-if="$auth.loggedIn && $auth.user" @click="handleClickLogout") Çıkış Yap
  LoginForm(v-else)

  MenuMoreNav(
    @clickedHowToPlay="$emit('clickedHowToPlay')"
    @clickedHowToCalculateStats="$emit('clickedHowToCalculateStats')"
    @clickedCredits="$emit('clickedCredits')"
    @clickedContact="$emit('clickedContact')"
    @clickedSwitchLocale="$emit('clickedSwitchLocale')"
    @clickedReviewRoom="$emit('clickedReviewRoom')"
    @close="state.isOpen = false"
  )
</template>

<script>
import { defineComponent, useRouter, useStore, useContext, reactive, watch } from '@nuxtjs/composition-api'
import { Dialog, CellGroup, Cell, Button } from 'vant'
import { isGmUser } from '@/helpers/chat-command'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    CellGroup,
    Cell,
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
    const router = useRouter()
    const store = useStore()
    const { localePath, $auth } = useContext()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const handleClickProfileEdit = () => {
      router.push(localePath({ name: 'Account-AccountEdit' }))

      state.isOpen = false
    }

    const handleClickProfileView = () => {
      router.push(localePath({ name: 'Profile-username', params: { username: $auth.user.username } }))

      state.isOpen = false
    }

    const handleClickMyQuizzes = () => {
      router.push(localePath({ name: 'Profile-username-Quizzes', params: { username: $auth.user.username } }))

      state.isOpen = false
    }

    const handleClickLogout = async () => {
      await store.dispatch('auth/logout')

      window.location.href = '/'
    }

    const navigateAndClose = name => {
      router.push(localePath({ name }))

      state.isOpen = false
    }

    return {
      state,
      handleClickProfileEdit,
      handleClickProfileView,
      handleClickMyQuizzes,
      handleClickLogout,
      navigateAndClose,
      isGmUser
    }
  }
})
</script>

<style lang="scss" src="./MenuDialog.component.scss"></style>
