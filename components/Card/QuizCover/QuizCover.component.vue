<template lang="pug">
.quiz-cover(:style="coverStyle" :class="{ 'quiz-cover--photo': hasCoverPhoto }")
  img.quiz-cover__photo(v-if="hasCoverPhoto" :src="room.coverPhoto.url" loading="lazy" draggable="false" :alt="room.title")
  .quiz-cover__placeholder(v-else)
    .quiz-cover__placeholder-grid
    .quiz-cover__placeholder-glow
  //- large overlay text for mode intros ("GÜNLÜK", "LİMİTSİZ")
  .quiz-cover__labels(v-if="label")
    strong.quiz-cover__label {{ label }}
    small.quiz-cover__sublabel(v-if="sublabel") {{ sublabel }}
  slot
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

const PLACEHOLDER_PALETTES = [
  { from: '#ff7878', to: '#c83a5a', tint: 'rgba(255, 220, 220, 0.18)' },
  { from: '#7c5ce8', to: '#3a3da8', tint: 'rgba(225, 220, 255, 0.18)' },
  { from: '#1f9e8e', to: '#0c5a64', tint: 'rgba(200, 245, 240, 0.18)' },
  { from: '#d4a017', to: '#9b5b0a', tint: 'rgba(255, 235, 200, 0.18)' },
  { from: '#e85a8a', to: '#7a2d5a', tint: 'rgba(255, 220, 235, 0.18)' },
  { from: '#3b7dd8', to: '#163f7a', tint: 'rgba(210, 225, 255, 0.18)' }
]

const hashSeed = key => {
  const s = String(key || '')
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }

  return Math.abs(h)
}

export default defineComponent({
  name: 'QuizCover',
  props: {
    room: { type: Object, required: false, default: null },
    // palette key when there is no room (mode intros)
    seed: { type: String, required: false, default: '' },
    label: { type: String, required: false, default: null },
    sublabel: { type: String, required: false, default: null }
  },
  setup(props) {
    const hasCoverPhoto = computed(() => Boolean(props.room?.coverPhoto?.url))

    const coverStyle = computed(() => {
      const key = props.room?.roomId || props.room?.documentId || props.room?.title || props.seed
      // party's daily / unlimited games (room id = mode) wear the brand pink
      const isMode = ['daily', 'unlimited'].includes(props.room?.roomId)
      const palette = isMode ? PLACEHOLDER_PALETTES[0] : PLACEHOLDER_PALETTES[hashSeed(key) % PLACEHOLDER_PALETTES.length]

      return {
        '--quiz-card-from': palette.from,
        '--quiz-card-to': palette.to,
        '--quiz-card-tint': palette.tint
      }
    })

    return { hasCoverPhoto, coverStyle }
  }
})
</script>

<style lang="scss" src="./QuizCover.component.scss"></style>
