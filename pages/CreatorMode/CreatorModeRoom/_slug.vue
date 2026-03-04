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
</template>

<script>
import { defineComponent, useFetch, useRoute, useStore, useContext, useMeta, computed } from '@nuxtjs/composition-api'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { Notify, Empty, Button } from 'vant'

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

    useMeta(() => ({
      title: room.value?.title && `${i18n.t('seo.creatorModeQuiz.title', { quizTitle: room.value.title })} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: room.value?.title && `${i18n.t('seo.creatorModeQuiz.description', { quizTitle: room.value.title })}`
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content:
            room.value?.title && `${i18n.t('seo.creatorModeQuiz.title', { quizTitle: room.value.title })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content:
            room.value?.title && `${i18n.t('seo.creatorModeQuiz.title', { quizTitle: room.value.title })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: room.value?.title && `${i18n.t('seo.creatorModeQuiz.description', { quizTitle: room.value.title })}`
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: room.value?.title && `${i18n.t('seo.creatorModeQuiz.description', { quizTitle: room.value.title })}`
        },
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
      room
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeRoom.page.scss"></style>
