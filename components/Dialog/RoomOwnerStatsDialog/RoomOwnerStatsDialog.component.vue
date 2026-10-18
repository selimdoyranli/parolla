<template lang="pug">
Dialog.dialog.room-owner-stats-dialog(
  v-model="state.isOpen"
  :title="title || $t('ownerStats.title')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  template(v-if="state.isOpen")
    .room-owner-stats-dialog__grid(v-if="stats")
      .room-owner-stats-dialog__card(v-for="card in cards" :key="card.key")
        AppIcon(:name="card.icon" :width="20" :height="20")
        strong {{ card.value }}
        small {{ card.label }}
    .room-owner-stats-dialog__state(v-else-if="statsPending")
      Loading(color="var(--color-brand-02)" size="24")

    .room-owner-stats-dialog__players-header
      h4 {{ $t('ownerStats.playersTitle') }}
      DropdownMenu(:active-color="'var(--color-brand-02)'")
        DropdownItem(v-model="sort" :options="sortOptions" @change="resetPlayers")
    List(
      ref="listRef"
      v-model="players.loading"
      :finished="players.finished"
      :error.sync="players.error"
      :error-text="$t('comments.error')"
      @load="loadPlayers"
    )
      NuxtLink.room-owner-stats-dialog__player(
        v-for="p in players.items"
        :key="p.user.id"
        :to="profilePath(p.user)"
        @click.native="state.isOpen = false"
      )
        PlayerAvatar(:user="p.user" :size="32")
        span.room-owner-stats-dialog__player-name {{ p.user.username }}
        span.room-owner-stats-dialog__player-detail ✓{{ p.correct }} ✗{{ p.wrong }} ↷{{ p.passed }}
        strong.room-owner-stats-dialog__player-score {{ p.score }}
        Timeago.room-owner-stats-dialog__player-time(:datetime="p.createdAt" :auto-update="60" :locale="$i18n.locale")
      Empty(v-if="players.finished && !players.items.length" :description="$t('ownerStats.playersEmpty')")
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, nextTick, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, DropdownMenu, DropdownItem, List, Empty, Loading } from 'vant'

const formatMs = ms => {
  const s = Math.round((ms || 0) / 1000)

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    DropdownMenu,
    DropdownItem,
    List,
    Empty,
    Loading
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    roomId: {
      type: Number,
      required: false,
      default: null
    },
    title: {
      type: String,
      required: false,
      default: null
    }
  },
  emits: ['closed'],
  setup(props) {
    const store = useStore()
    const { i18n, localePath } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const stats = ref(null)
    const statsPending = ref(false)
    const sort = ref('recent')
    const listRef = ref(null)
    const players = reactive({ items: [], page: 0, loading: false, finished: false, error: false })
    const sortOptions = computed(() => ['recent', 'score'].map(value => ({ value, text: i18n.t(`ownerStats.sort.${value}`) })))

    const cards = computed(() => {
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

    const profilePath = user => localePath({ name: 'Profile-username', params: { username: user.username } })

    // request tokens: bumped on every open/reset so late responses from a previous state are dropped
    let statsToken = 0
    let playersToken = 0

    const loadStats = async () => {
      const token = ++statsToken
      stats.value = null
      statsPending.value = true
      const { data } = await store.dispatch('creator/fetchOwnerStats', { roomId: props.roomId })

      if (token !== statsToken) return

      statsPending.value = false
      stats.value = data || null
    }

    const resetPlayers = () => {
      playersToken += 1
      Object.assign(players, { items: [], page: 0, loading: false, finished: false, error: false })
      // van-list only re-checks on loading/finished changes, so nudge it after a reset
      nextTick(() => listRef.value?.check())
    }

    const loadPlayers = async () => {
      const token = playersToken
      const { data, error } = await store.dispatch('creator/fetchOwnerPlayers', {
        roomId: props.roomId,
        sort: sort.value,
        page: players.page + 1
      })

      // sort switched or dialog reset while the request was in flight
      if (token !== playersToken) return

      players.loading = false

      if (error) {
        players.error = true

        return
      }

      players.items.push(...data.items)
      players.page += 1
      players.finished = !data.hasMore
    }

    // immediate: the header can mount this with isOpen already true
    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          sort.value = 'recent'
          loadStats()
          resetPlayers()
        }
      },
      { immediate: true }
    )

    return { state, stats, statsPending, sort, sortOptions, listRef, players, cards, profilePath, resetPlayers, loadPlayers }
  }
})
</script>

<style lang="scss" src="./RoomOwnerStatsDialog.component.scss"></style>
