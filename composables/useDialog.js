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

  return {
    openLeaveDialog,
    openPartyLeaveDialog
  }
}
