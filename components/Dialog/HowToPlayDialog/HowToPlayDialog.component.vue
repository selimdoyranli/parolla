<template lang="pug">
Dialog.dialog.how-to-play-dialog(
  v-model="state.isOpen"
  :title="dialogTitle"
  :cancel-button-text="cancelButtonText || $t('dialog.howToPlay.cancelButtonText')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  .how-to-play-dialog__explain
    HowToPlayDailyModeContent(v-if="activeGameMode === gameModeKeyEnum.DAILY")
    HowToPlayUnlimitedModeContent(v-if="activeGameMode === gameModeKeyEnum.UNLIMITED")
    HowToPlayCreatorModeContent(v-if="activeGameMode === gameModeKeyEnum.CREATOR && (room.quizType === quizTypeEnum.QA || !room.quizType)")
    HowToPlayThisOrThatContent(v-if="room && room.quizType === quizTypeEnum.CHOICES")
    HowToPlayTourModeContent(v-if="activeGameMode === gameModeKeyEnum.TOUR")
    HowToPlayWordblockModeContent(v-if="activeGameMode === gameModeKeyEnum.WORDBLOCK")
    .how-to-play-dialog__ad
      // AppAd(:data-ad-slot="9964323575")

  // Footer
  footer.how-to-play-dialog__footer
    i18n.d-flex(path="app.copyright")
      template(#logo)
        FooterBrandLogo
</template>

<script>
import { defineComponent, useContext, useStore, reactive, watch, computed } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { Dialog } from 'vant'

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
    }
  },
  setup(props) {
    const { i18n } = useContext()
    const store = useStore()

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

    const room = computed(() => store.getters['creator/room'])

    const dialogTitle = computed(() => {
      if (activeGameMode.value === gameModeKeyEnum.CREATOR) {
        if (room.value.quizType === quizTypeEnum.QA || !room.value.quizType) {
          return i18n.t('dialog.howToPlay.title')
        }

        if (room.value.quizType === quizTypeEnum.CHOICES) {
          return i18n.t('dialog.howToPlay.creator.thisOrThat.title')
        }
      }

      if (activeGameMode.value === gameModeKeyEnum.WORDBLOCK) {
        return i18n.t('dialog.howToPlay.wordblock.title')
      }

      return i18n.t('dialog.howToPlay.title')
    })

    return {
      gameModeKeyEnum,
      quizTypeEnum,
      activeGameMode,
      state,
      dialogTitle,
      room
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayDialog.component.scss"></style>
