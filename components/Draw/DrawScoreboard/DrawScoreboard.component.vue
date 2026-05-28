<template lang="pug">
.draw-scoreboard
  h3 Skor
  .draw-scoreboard__row(v-for="p in sortedPlayers" :key="p.id" :class="{ drawer: p.id === drawerId, host: p.isHost }")
    span.draw-scoreboard__name
      img(v-if="p.profilePhoto" :src="p.profilePhoto" alt)
      | {{ p.name }}
      small(v-if="p.isHost") (host)
    span.draw-scoreboard__score {{ p.score || 0 }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    players: { type: Array, default: () => [] },
    drawerId: { type: String, default: null }
  },
  setup(props) {
    const sortedPlayers = computed(() => [...props.players].sort((a, b) => (b.score || 0) - (a.score || 0)))

    return { sortedPlayers }
  }
})
</script>

<style src="./DrawScoreboard.component.scss" lang="scss" scoped />
