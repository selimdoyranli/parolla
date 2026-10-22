import { useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Notify } from 'vant'

// confirm -> dispatch -> success/error Notify. Resolves true when the server accepted the action.
export default () => {
  const store = useStore()
  const { i18n } = useContext()

  const run = async ({ action, documentId, memberDocumentId, confirmKey, successKey }) => {
    try {
      await Dialog.confirm({
        message: i18n.t(confirmKey),
        cancelButtonText: i18n.t('general.cancel'),
        confirmButtonText: i18n.t('general.apply')
      })
    } catch {
      return false
    }

    const { error } = await store.dispatch(`community/${action}`, { documentId, memberDocumentId })

    if (error) {
      Notify({ message: error.message || i18n.t('community.error.generic'), type: 'danger' })

      return false
    }

    Notify({ message: i18n.t(successKey), type: 'success' })

    return true
  }

  return { run }
}
