<template lang="pug">
Dialog.dialog.player-dialog(
  :value="isOpenPlayerDialog"
  :title="$t('dialog.player.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @input="handleDialogInput"
  @closed="onClosed"
  @opened="$emit('opened')"
)
  template(v-if="playerLoading || !player || !player.id")
    .player-dialog__loading
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}

  template(v-else-if="playerError")
    .player-dialog__error
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="reFetch") {{ $t('dialog.player.callback.error.action') }}

  template(v-else)
    ProfileView(:player="player" :player-loading="false" :player-error="false" :player-stats="playerStats")

    ProfileTabBar(v-model="activeTab" local :username="player.username")

    .player-dialog__panel
      ProfileQuizzesTab(v-if="activeTab === 'quizzes'")
      ProfileReviewsTab(v-if="activeTab === 'reviews'")
      ProfileScoresTab(v-if="activeTab === 'scores'")
</template>

<script>
import { defineComponent, useStore, computed, watch, ref, provide } from '@nuxtjs/composition-api'
import { Dialog, Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Loading,
    Empty,
    Button
  },
  props: {
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup() {
    const store = useStore()

    const isOpenPlayerDialog = computed(() => store.getters['profile/isOpenPlayerDialog'])
    const playerId = computed(() => store.getters['profile/id'])
    const player = computed(() => store.getters['profile/player'])
    const playerStats = computed(() => store.getters['profile/playerStats'])
    const tourScore = computed(() => store.getters['tour/tourScoreOfUser'])

    const playerLoading = ref(false)
    const playerError = ref(null)
    const tourScoreLoading = ref(false)
    const tourScoreError = ref(null)

    const activeTab = ref('quizzes')

    const fetchPlayer = async () => {
      playerLoading.value = true
      playerError.value = null

      const { data, error } = await store.dispatch('profile/fetchPlayer', { id: playerId.value })

      if (error) playerError.value = error

      playerLoading.value = false

      if (data?.id) {
        store.dispatch('profile/fetchPlayerStats', { userId: data.id })
      }
    }

    const fetchTourScore = async () => {
      tourScoreLoading.value = true
      tourScoreError.value = null

      const { error } = await store.dispatch('tour/fetchTourScoreOfUser', { id: playerId.value })

      if (error) tourScoreError.value = error

      tourScoreLoading.value = false
    }

    const reFetch = () => {
      fetchPlayer()
      fetchTourScore()
    }

    watch(
      () => isOpenPlayerDialog.value,
      value => {
        if (value && playerId.value) {
          activeTab.value = 'quizzes'
          fetchPlayer()
          fetchTourScore()
        }
      }
    )

    const username = computed(() => player.value?.username || '')

    const refetchShell = () => {
      fetchPlayer()
      fetchTourScore()
    }

    provide('profileShell', {
      username,
      player,
      playerLoading,
      playerError,
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetch: refetchShell
    })

    const handleDialogInput = value => {
      if (!value) {
        store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', false)
      }
    }

    const onClosed = () => {
      store.commit('profile/SET_PLAYER_ID', null)
      store.commit('profile/SET_PLAYER_USERNAME', '')
      // do NOT clear the player here — when the user navigates away to the
      // profile route (or opens another dialog), the new context overwrites
      // the store anyway. Clearing here causes a flash of empty data and
      // crashes Timeago in the destination page (createdAt becomes undefined).
      activeTab.value = 'quizzes'
    }

    return {
      isOpenPlayerDialog,
      player,
      playerStats,
      playerLoading,
      playerError,
      activeTab,
      handleDialogInput,
      onClosed,
      reFetch
    }
  }
})
</script>

<style lang="scss" src="./PlayerDialog.component.scss"></style>
