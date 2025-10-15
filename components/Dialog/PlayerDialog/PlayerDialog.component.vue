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
  ProfileView(
    v-if="player && Object.keys(player).length > 0"
    :player-loading="playerLoading"
    :player-error="playerError"
    :tour-score-loading="tourScoreLoading"
    :tour-score-error="tourScoreError"
    :tour-score="tourScoreOfUser"
    :player="player"
    @player-error-click="fetchPlayer"
    @tour-score-error-click="fetchTourScore"
  )

  template(v-else)
    Empty(image="error" :description="$t('dialog.player.callback.error.title')")
      Button(@click="fetchPlayer(), fetchTourScore()") {{ $t('dialog.player.callback.error.action') }}
</template>

<script>
import { defineComponent, useStore, computed, watch, useFetch, ref } from '@nuxtjs/composition-api'
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
  setup(props) {
    const store = useStore()

    const isOpenPlayerDialog = computed(() => store.getters['profile/isOpenPlayerDialog'])
    const playerId = computed(() => store.getters['profile/id'])
    const player = computed(() => store.getters['profile/player'])
    const tourScoreOfUser = computed(() => store.getters['tour/tourScoreOfUser'])

    const playerLoading = ref(false)
    const playerError = ref(null)
    const tourScoreLoading = ref(false)
    const tourScoreError = ref(null)

    const fetchPlayer = async () => {
      const { data, error } = await store.dispatch('profile/fetchPlayer', { id: playerId.value })

      if (error) {
        playerError.value = error
      }

      playerLoading.value = false
    }

    const fetchTourScore = async () => {
      const { data, error } = await store.dispatch('tour/fetchTourScoreOfUser', {
        id: playerId.value
      })

      if (error) {
        tourScoreError.value = error
      }

      tourScoreLoading.value = false
    }

    watch(
      () => isOpenPlayerDialog.value,
      async value => {
        if (value) {
          playerLoading.value = true
          playerError.value = null
          tourScoreLoading.value = true
          tourScoreError.value = null

          fetchPlayer()
          fetchTourScore()
        }
      }
    )

    const handleDialogInput = async value => {
      if (!value) {
        store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', false)
      }
    }

    const onClosed = () => {
      store.commit('profile/SET_PLAYER_ID', null)
      store.commit('profile/SET_PLAYER_USERNAME', '')
      store.commit('profile/CLEAR_PLAYER')
    }

    return {
      isOpenPlayerDialog,
      player,
      tourScoreOfUser,
      handleDialogInput,
      onClosed,
      playerLoading,
      playerError,
      tourScoreLoading,
      tourScoreError,
      fetchPlayer,
      fetchTourScore
    }
  }
})
</script>

<style lang="scss" src="./PlayerDialog.component.scss"></style>
