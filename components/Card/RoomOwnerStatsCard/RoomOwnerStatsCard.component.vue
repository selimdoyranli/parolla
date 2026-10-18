<template lang="pug">
//- quiz owner's summary above the scoreboard; compact 4-column grid
.room-owner-stats-card(v-if="stats")
  .room-owner-stats-card__item(v-for="item in items" :key="item.key")
    span.room-owner-stats-card__value
      AppIcon(:name="item.icon" :width="14" :height="14")
      strong {{ item.value }}
    small.room-owner-stats-card__label {{ item.label }}
.room-owner-stats-card.room-owner-stats-card--pending(v-else-if="pending")
  Loading(color="var(--color-brand-02)" size="20")
</template>

<script>
import { defineComponent, computed, ref, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Loading } from 'vant'

const formatMs = ms => {
  const s = Math.round((ms || 0) / 1000)

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default defineComponent({
  components: { Loading },
  props: {
    roomId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const { i18n } = useContext()

    const stats = ref(null)
    const pending = ref(false)

    const items = computed(() => {
      const s = stats.value

      return [
        { key: 'views', icon: 'tabler:eye', value: s.viewCount, label: i18n.t('ownerStats.views') },
        { key: 'players', icon: 'tabler:users', value: s.playerCount, label: i18n.t('ownerStats.players') },
        {
          key: 'rating',
          icon: 'tabler:star',
          value: `${Number(s.rating).toFixed(1)} (${s.ratingCount})`,
          label: i18n.t('ownerStats.rating')
        },
        { key: 'comments', icon: 'tabler:message-2', value: s.commentCount, label: i18n.t('ownerStats.comments') },
        { key: 'correct', icon: 'tabler:check', value: s.avgCorrect, label: i18n.t('ownerStats.avgCorrect') },
        { key: 'wrong', icon: 'tabler:x', value: s.avgWrong, label: i18n.t('ownerStats.avgWrong') },
        { key: 'passed', icon: 'tabler:player-skip-forward', value: s.avgPassed, label: i18n.t('ownerStats.avgPassed') },
        { key: 'remain', icon: 'tabler:clock', value: formatMs(s.avgRemainMs), label: i18n.t('ownerStats.avgRemain') }
      ]
    })

    // drop a late response for a previous room
    let token = 0

    const load = async () => {
      const current = ++token
      pending.value = true
      const { data } = await store.dispatch('creator/fetchOwnerStats', { roomId: props.roomId })

      if (current !== token) return

      pending.value = false
      stats.value = data || null
    }

    watch(() => props.roomId, load, { immediate: true })

    return { stats, pending, items }
  }
})
</script>

<style lang="scss" src="./RoomOwnerStatsCard.component.scss"></style>
