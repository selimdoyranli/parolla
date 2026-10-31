import { useContext } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

export default () => {
  const { i18n } = useContext()

  const openLeaveDialog = ({ confirm, cancel }) => {
    Dialog.confirm({
      title: i18n.t('dialog.leave.title'),
      message: i18n.t('dialog.leave.description'),
      cancelButtonText: i18n.t('general.cancel'),
      confirmButtonText: i18n.t('general.apply')
    })
      .then(() => {
        if (confirm) {
          confirm()
        }
      })
      .catch(() => {
        if (cancel) {
          cancel()
        }
      })
  }

  // party rooms: leaving gives the seat up (the room session sends PARTY_LEAVE when it unmounts)
  const openPartyLeaveDialog = ({ confirm }) =>
    Dialog.confirm({
      message: i18n.t('party.lobby.leaveConfirm'),
      confirmButtonText: i18n.t('party.lobby.leaveYes'),
      cancelButtonText: i18n.t('general.cancel'),
      getContainer: 'body'
    })
      .then(confirm)
      .catch(() => {})

  // party host mid-game: cancelling ends this game for everyone (no points), the room goes back to the lobby
  const openPartyCancelDialog = ({ confirm }) =>
    Dialog.confirm({
      message: i18n.t('party.game.cancelConfirm'),
      confirmButtonText: i18n.t('party.game.cancelYes'),
      cancelButtonText: i18n.t('party.lobby.cancel'),
      getContainer: 'body'
    })
      .then(confirm)
      .catch(() => {})

  return {
    openLeaveDialog,
    openPartyLeaveDialog,
    openPartyCancelDialog
  }
}
