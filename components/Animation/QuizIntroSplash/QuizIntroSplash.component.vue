<template lang="pug">
//- creator quiz splash before the start countdown: title + description drop in, the creator rises in, parolla signs it off
.quiz-intro-splash
  QuizCover.quiz-intro-splash__bg(:room="room")

  .quiz-intro-splash__content
    h1.quiz-intro-splash__title {{ room.title }}
    p.quiz-intro-splash__description(v-if="room.description") {{ room.description }}

    .quiz-intro-splash__creator
      PlayerAvatar(:user="creatorUser" :size="40")
      .quiz-intro-splash__creator-meta
        small {{ $t('playIntro.creator') }}
        strong {{ creatorUser ? creatorUser.username : $t('playIntro.anon') }}

  AppLogo.quiz-intro-splash__brand(type="title")
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    room: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // owners always receive room.user, anonymous quizzes included
    const creatorUser = computed(() => (props.room.isAnon ? null : props.room.user))

    return { creatorUser }
  }
})
</script>

<style lang="scss" src="./QuizIntroSplash.component.scss"></style>
