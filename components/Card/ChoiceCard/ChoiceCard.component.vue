<template lang="pug">
.choice-card__content
  // Image
  template(v-if="choice && choice.choiceType === choiceTypeEnum.MEDIA")
    img.choice-card__image(v-if="choice.media && choice.media.url" :src="choice.media.url" alt="Choice" draggable="false")
    .choice-card__note(v-if="choice.mediaNote") {{ choice.mediaNote }}

  // YouTube
  template(v-else-if="choice && choice.choiceType === choiceTypeEnum.YOUTUBE && choice.youtubeUrl")
    .choice-card__video
      iframe(
        :src="getYoutubeIframeUrl(choice.youtubeUrl)"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      )
    .choice-card__note(v-if="choice.mediaNote") {{ choice.mediaNote }}

  // Text
  template(v-else-if="choice && choice.choiceType === choiceTypeEnum.TEXT")
    span.choice-card__text(v-if="choice.text") {{ choice.text }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { choiceTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  name: 'ChoiceCard',
  props: {
    choice: {
      type: Object,
      required: true
    }
  },
  setup() {
    const getYoutubeIframeUrl = url => {
      if (!url) return ''
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/)

      if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1&controls=1&modestbranding=1&showinfo=1`
      }

      return ''
    }

    return {
      choiceTypeEnum,
      getYoutubeIframeUrl
    }
  }
})
</script>

<style lang="scss" src="./ChoiceCard.component.scss"></style>
