<template lang="pug">
Dialog.dialog.dialog--scene.how-to-play-dialog(
  v-model="state.isOpen"
  transition="dialog-scene-bounce"
  :overlay="false"
  :title="intro ? undefined : dialogTitle"
  :cancel-button-text="cancelButtonText || $t('dialog.howToPlay.cancelButtonText')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  .how-to-play-dialog__explain
    HowToPlayContent
    .how-to-play-dialog__ad
      template(v-if="isDesktop")
        AppAd(:data-ad-slot="9964323575")
      template(v-else)
        AppAd(:data-ad-slot="5200543400")

  // Footer
  footer.how-to-play-dialog__footer
    i18n.d-flex(path="app.copyright")
      template(#logo)
        FooterBrandLogo
</template>

<script>
import { defineComponent, useContext, useStore, reactive, watch, computed, onBeforeUnmount } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { Dialog } from 'vant'
import { useMediaQuery } from '@vueuse/core'

export default defineComponent({
  components: {
    Dialog: Dialog.Component
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
    },
    // the scene's own dialog shown before the game starts: no title, and while it is open the
    // header's how-to-play button doesn't stack a second copy on top
    intro: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const { i18n } = useContext()
    const store = useStore()

    const isDesktop = useMediaQuery('(min-width: 992px)')

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

    if (props.intro) {
      watch(
        () => state.isOpen,
        value => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', value),
        { immediate: true }
      )

      onBeforeUnmount(() => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', false))
    }

    const room = computed(() => store.getters['creator/room'])

    const dialogTitle = computed(() => {
      if (activeGameMode.value === gameModeKeyEnum.CREATOR) {
        if (room.value.quizType === quizTypeEnum.QA || !room.value.quizType) {
          return i18n.t('dialog.howToPlay.title')
        }

        if (room.value.quizType === quizTypeEnum.CHOICES) {
          return i18n.t('dialog.howToPlay.creator.thisOrThat.title')
        }

        if (room.value.quizType === quizTypeEnum.FLASHCARDS) {
          return i18n.t('dialog.howToPlay.creator.flashcards.title')
        }
      }

      if (activeGameMode.value === gameModeKeyEnum.WORDBLOCK) {
        return i18n.t('dialog.howToPlay.wordblock.title')
      }

      return i18n.t('dialog.howToPlay.title')
    })

    return {
      isDesktop,
      state,
      dialogTitle
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayDialog.component.scss"></style>
