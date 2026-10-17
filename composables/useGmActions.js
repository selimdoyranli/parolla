import { useContext, useStore, ref } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'
import { showToast } from '@/helpers/toast'

// Shared by the GM panel anomaly pages: date filter + confirm-then-run moderation actions
export default () => {
  const { i18n } = useContext()
  const store = useStore()

  // sv-SE formats as YYYY-MM-DD in the browser's timezone
  const date = ref(new Date().toLocaleDateString('sv-SE'))

  const runAction = async ({ action, data, confirmMessage, confirmButtonText, onDone }) => {
    try {
      await Dialog.confirm({
        message: confirmMessage,
        confirmButtonText,
        confirmButtonColor: 'var(--color-danger-01)',
        cancelButtonText: i18n.t('general.cancel')
      })
    } catch {
      return
    }

    const { error } = await store.dispatch('gm/runAction', { action, data })

    if (error) {
      showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

      return
    }

    showToast.success(i18n.t('gmPanel.actionDone'))
    await onDone()
  }

  return {
    date,
    runAction
  }
}
