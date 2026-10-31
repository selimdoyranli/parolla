<template lang="pug">
//- creator quiz splash before the start countdown: title + description drop in, the creator rises in, parolla signs it off
.quiz-intro-splash
  QuizCover.quiz-intro-splash__bg(:room="room")

  //- text animates in once `playing` turns on; the backdrop is up before that
  .quiz-intro-splash__content(v-if="playing")
    h1.quiz-intro-splash__title {{ room.title }}
    p.quiz-intro-splash__description(v-if="room.description") {{ room.description }}

    //- the daily / unlimited word-game sets have no author
    .quiz-intro-splash__creator(v-if="!room.noCreator")
      PlayerAvatar(:user="creatorUser" :size="40")
      .quiz-intro-splash__creator-meta
        small {{ $t('playIntro.creator') }}
        strong
          | {{ creatorUser ? creatorUser.username : $t('playIntro.anon') }}
          span.gm-username-extra(v-if="creatorUser && creatorUser.role && creatorUser.role.name === 'GM'") &nbsp;(GM)

  AppLogo.quiz-intro-splash__brand(v-if="playing" type="title")
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    room: {
      type: Object,
      required: true
    },
    playing: {
      type: Boolean,
      required: false,
      default: false
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
