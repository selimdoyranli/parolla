<template lang="pug">
.page.creator-mode-room-page
  template(v-if="fetchState.pending")
    Empty(:description="$t('gameScene.pendingQuestions')")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('gameScene.error.fetchQuestions.description')")
      Button(@click="fetch") {{ $t('gameScene.error.fetchQuestions.action') }}

  template(v-else)
    CreatorModeGameScene(v-if="room.quizType === quizTypeEnum.QA || !room.quizType")
    ChoicesGameScene(v-if="room.quizType === quizTypeEnum.CHOICES")
    FlashcardGameScene(v-if="room.quizType === quizTypeEnum.FLASHCARDS")
</template>

<script>
import { defineComponent, useFetch, useRoute, useStore, useContext, useMeta, computed } from '@nuxtjs/composition-api'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { Notify, Empty, Button } from 'vant'

// same check as functions/quiz/_seo.js: titles that already say quiz don't get it repeated
const HAS_QUIZ = /qu[iıİ]z/i

export default defineComponent({
  components: {
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const { localePath, redirect, i18n } = useContext()
    const route = useRoute()
    const store = useStore()

    if (!route.value.params.slug) {
      redirect(localePath({ name: 'CreatorMode-CreatorModeRooms' }))
    }

    // Fetch Room
    const { fetch, fetchState } = useFetch(async () => {
      const { data, error } = await store.dispatch('creator/fetchRoom', route.value.params.slug)

      if (error) {
        Notify({
          message: error.message,
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 3000
        })

        setTimeout(() => {
          redirect(localePath({ name: 'CreatorMode-CreatorModeRooms' }))
        }, 1000)
      }
    })

    const room = computed(() => store.getters['creator/room'])

    // Keep in step with functions/quiz/_seo.js, which serves the same head to non-JS crawlers
    const seoTitle = computed(
      () =>
        room.value?.title &&
        `${i18n.t(`seo.creatorModeQuiz.${HAS_QUIZ.test(room.value.title) ? 'titleWithQuiz' : 'title'}`, {
          quizTitle: room.value.title
        })} | parolla`
    )

    const seoDescription = computed(() => {
      if (!room.value?.title) {
        return undefined
      }

      const text = room.value.description?.trim() || i18n.t('seo.creatorModeQuiz.description', { quizTitle: room.value.title })

      return text.length > 160 ? `${text.slice(0, 159).trimEnd()}…` : text
    })

    // unlisted (isPublic false), hidden or system-removed quizzes stay out of the index
    const isIndexable = computed(
      () => room.value?.isListed === true && room.value.isVisible !== false && !room.value.isSystemRemovedFromPublic
    )

    useMeta(() => ({
      title: seoTitle.value,
      meta: [
        { hid: 'robots', name: 'robots', content: room.value?.title && (isIndexable.value ? 'index,follow' : 'noindex, follow') },
        { hid: 'description', name: 'description', content: seoDescription.value },
        { hid: 'og:title', property: 'og:title', content: seoTitle.value },
        { hid: 'twitter:title', name: 'twitter:title', content: seoTitle.value },
        { hid: 'og:description', property: 'og:description', content: seoDescription.value },
        { hid: 'twitter:description', name: 'twitter:description', content: seoDescription.value },
        {
          hid: 'keywords',
          name: 'keywords',
          content: room.value?.title && `${i18n.t('seo.creatorModeQuiz.keywords', { quizTitle: room.value.title })}`
        }
      ]
    }))

    return {
      fetch,
      fetchState,
      quizTypeEnum,
      localePath,
      room
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeRoom.page.scss"></style>
