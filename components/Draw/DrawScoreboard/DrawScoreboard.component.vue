<template lang="pug">
.draw-scoreboard
  .draw-scoreboard__head
    h3 Skor
    span.draw-scoreboard__count {{ sortedPlayers.length }}
  ul.draw-scoreboard__list
    li.draw-scoreboard__row(v-for="(p, i) in sortedPlayers" :key="p.id" :class="rowClasses(p)")
      span.draw-scoreboard__rank {{ i + 1 }}
      PlayerAvatar.draw-scoreboard__avatar(:user="toUser(p)" :size="22")
      .draw-scoreboard__name
        .draw-scoreboard__name-row
          span.draw-scoreboard__name-text {{ p.name }}
          AppIcon.draw-scoreboard__guessed(v-if="hasGuessed(p.id)" name="tabler:circle-check-filled" :width="14" :height="14")
        .draw-scoreboard__tags
          span.draw-scoreboard__tag.draw-scoreboard__tag--host(v-if="p.isHost") Host
          span.draw-scoreboard__tag.draw-scoreboard__tag--drawer(v-if="isDrawer(p.id)") Çiziyor
          span.draw-scoreboard__tag.draw-scoreboard__tag--next(v-else-if="isNext(p.id)") Sıradaki
      span.draw-scoreboard__score {{ p.score || 0 }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    players: { type: Array, default: () => [] },
    drawerId: { type: [String, Number], default: null },
    nextDrawerId: { type: [String, Number], default: null },
    myId: { type: [String, Number], default: null },
    correctGuesserIds: { type: Array, default: () => [] }
  },
  setup(props) {
    const sortedPlayers = computed(() => [...props.players].sort((a, b) => (b.score || 0) - (a.score || 0)))

    const isDrawer = id => props.drawerId != null && String(id) === String(props.drawerId)
    const isNext = id => props.nextDrawerId != null && String(id) === String(props.nextDrawerId) && !isDrawer(id)
    const isMe = id => props.myId != null && String(id) === String(props.myId)
    const hasGuessed = id => props.correctGuesserIds.some(g => String(g) === String(id))

    const rowClasses = p => ({
      'draw-scoreboard__row--drawer': isDrawer(p.id),
      'draw-scoreboard__row--next': isNext(p.id),
      'draw-scoreboard__row--me': isMe(p.id),
      'draw-scoreboard__row--guessed': hasGuessed(p.id)
    })

    // Adapt server-side player object to the shape PlayerAvatar expects.
    const toUser = p => ({
      id: p.id,
      username: p.name,
      avatarSource: p.avatarSource,
      profilePhoto: typeof p.profilePhoto === 'string' ? { url: p.profilePhoto } : p.profilePhoto,
      diceBear: p.diceBear,
      role: p.role
    })

    return { sortedPlayers, isDrawer, isNext, isMe, hasGuessed, rowClasses, toUser }
  }
})
</script>

<style src="./DrawScoreboard.component.scss" lang="scss" scoped />
