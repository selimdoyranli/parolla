<template lang="pug">
Dialog.dialog.player-actions-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.playerActions.title', { username: player ? player.username : '' })"
  :cancel-button-text="$t('general.close')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="true"
  @closed="$emit('closed')"
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

    Cell.player-actions-dialog__item.player-actions-dialog__item--danger(
      v-if="canVoteKick && !isSelf"
      clickable
      @click="$emit('vote-kick', player)"
    )
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
import { defineComponent, useStore, reactive, ref, computed, watch } from '@nuxtjs/composition-api'
import { Dialog, CellGroup, Cell } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'

// Shared "more" menu for a player in a live room (tour online list, draw scoreboard).
// The vote itself goes over the owner's socket, so it's emitted instead of sent here.
export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    CellGroup,
    Cell
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    // { id, username, diceBear, isGuest }
    player: {
      type: Object,
      required: false,
      default: null
    },
    myId: {
      type: [String, Number],
      required: false,
      default: null
    },
    canVoteKick: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const store = useStore()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const isOpenReportDialog = ref(false)

    const isSelf = computed(() => props.myId != null && props.player && String(props.player.id) === String(props.myId))

    const reportAdditional = computed(() => {
      if (!props.player) return null

      return JSON.stringify({
        reportedUser: {
          id: props.player.id,
          username: props.player.username,
          diceBear: props.player.diceBear
        }
      })
    })

    const showProfile = () => {
      store.commit('profile/SET_PLAYER_ID', props.player.id)
      store.commit('profile/SET_PLAYER_USERNAME', props.player.username)
      store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
    }

    return {
      state,
      isSelf,
      isOpenReportDialog,
      reportAdditional,
      reportTypeEnum,
      showProfile
    }
  }
})
</script>

<style lang="scss" src="./PlayerActionsDialog.component.scss"></style>
