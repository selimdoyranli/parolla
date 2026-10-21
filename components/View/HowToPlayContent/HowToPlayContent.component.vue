<template lang="pug">
.how-to-play-content
  HowToPlayDailyModeContent(v-if="activeGameMode === gameModeKeyEnum.DAILY")
  HowToPlayUnlimitedModeContent(v-if="activeGameMode === gameModeKeyEnum.UNLIMITED")
  HowToPlayCreatorModeContent(v-if="activeGameMode === gameModeKeyEnum.CREATOR && (room.quizType === quizTypeEnum.QA || !room.quizType)")
  HowToPlayThisOrThatContent(v-if="room && room.quizType === quizTypeEnum.CHOICES")
  HowToPlayFlashcardsContent(v-if="room && room.quizType === quizTypeEnum.FLASHCARDS")
  HowToPlayTourModeContent(v-if="activeGameMode === gameModeKeyEnum.TOUR")
  HowToPlayWordblockModeContent(v-if="activeGameMode === gameModeKeyEnum.WORDBLOCK")
  HowToPlayGeoGuessModeContent(v-if="activeGameMode === gameModeKeyEnum.GEOGUESS")
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  setup() {
    const store = useStore()
    const { activeGameMode } = useGameMode()
    const room = computed(() => store.getters['creator/room'])

    return { gameModeKeyEnum, quizTypeEnum, activeGameMode, room }
  }
})
</script>
