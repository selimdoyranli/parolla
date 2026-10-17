<template lang="pug">
Dialog.dialog.player-actions-dialog(
  :value="dialog.isOpen"
  :title="$t('dialog.playerActions.title', { username: player ? player.username : '' })"
  :cancel-button-text="$t('general.close')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="true"
  @input="handleDialogInput"
)
  CellGroup(v-if="player")
    Cell.player-actions-dialog__item(v-if="!player.isGuest" clickable @click="showProfile")
      template(#title)
        AppIcon(name="tabler:user-circle" :width="20" :height="20")
        span {{ $t('dialog.playerActions.showProfile') }}

    Cell.player-actions-dialog__item(v-if="!player.isGuest && !isSelf" auth-control clickable @click="isOpenReportDialog = true")
      template(#title)
        AppIcon(name="tabler:flag" :width="20" :height="20")
        span {{ $t('dialog.playerActions.report') }}

    Cell.player-actions-dialog__item.player-actions-dialog__item--danger(v-if="canVoteKick && !isSelf" clickable @click="voteKick")
      template(#title)
        AppIcon(name="tabler:user-x" :width="20" :height="20")
        span {{ $t('dialog.playerActions.voteKick') }}

  MountingPortal(mount-to="body" append)
    ReportDialog(
      :is-open="isOpenReportDialog"
      :scope="reportTypeEnum.PROFILE"
      :additional="reportAdditional"
      @closed="isOpenReportDialog = false"
    )
</template>

<script>
import { defineComponent, useStore, useContext, ref, computed } from '@nuxtjs/composition-api'
import { Dialog, CellGroup, Cell } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { getDrawSocket, isDrawSocketReady } from '@/composables/useDrawSocket'

// Global "more" menu (mounted once in the default layout) for a player in a live room.
// Opened via profile/SET_PLAYER_ACTIONS_DIALOG from tour chat / online / last answers
// and draw chat / scoreboard; `context` decides which socket carries the vote kick.
export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    CellGroup,
    Cell
  },
  setup() {
    const store = useStore()
    const { $auth } = useContext()

    const dialog = computed(() => store.getters['profile/playerActionsDialog'])
    const player = computed(() => dialog.value.player)
    const isDraw = computed(() => dialog.value.context === 'draw')

    const myId = computed(() => (isDraw.value ? store.state.draw.myId : store.getters['auth/user']?.id))
    const isSelf = computed(() => myId.value != null && player.value && String(player.value.id) === String(myId.value))

    // Tour viewers (logged out) can't vote; draw guests can, but only from inside a room
    const canVoteKick = computed(() => (isDraw.value ? Boolean(store.state.draw.room) : $auth.loggedIn))

    const isOpenReportDialog = ref(false)

    const reportAdditional = computed(() => {
      if (!player.value) return null

      return JSON.stringify({
        reportedUser: {
          id: player.value.id,
          username: player.value.username,
          diceBear: player.value.diceBear
        }
      })
    })

    const close = () => {
      store.commit('profile/SET_PLAYER_ACTIONS_DIALOG', { isOpen: false })
    }

    const handleDialogInput = isOpen => {
      if (!isOpen) close()
    }

    const showProfile = () => {
      store.commit('profile/SET_PLAYER_ID', player.value.id)
      store.commit('profile/SET_PLAYER_USERNAME', player.value.username)
      store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
    }

    // The result (system chat line or "already voted" toast) comes back over the socket
    const voteKick = () => {
      const targetId = player.value.id

      if (isDraw.value) {
        if (isDrawSocketReady()) getDrawSocket().send(JSON.stringify({ type: wsTypeEnum.DRAW_VOTE_KICK, targetId }))
      } else {
        const ws = store.getters['app/ws']

        if (ws?.readyState === 1) ws.send(JSON.stringify({ type: wsTypeEnum.VOTE_KICK, targetId }))
      }

      close()
    }

    return {
      dialog,
      player,
      isSelf,
      canVoteKick,
      isOpenReportDialog,
      reportAdditional,
      reportTypeEnum,
      handleDialogInput,
      showProfile,
      voteKick
    }
  }
})
</script>

<style lang="scss" src="./PlayerActionsDialog.component.scss"></style>
