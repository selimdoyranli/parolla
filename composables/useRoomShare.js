import { useContext, useStore } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { showToast } from '@/helpers/toast'

// Shares a creator room (title, question count, link): clipboard first, then the native share sheet
export const useRoomShare = () => {
  const { i18n, localePath } = useContext()
  const store = useStore()

  const shareRoom = async room => {
    const shareText = i18n.t('sharer.room.description', {
      roomTitle: room.title,
      questionCount: room.questionCount ?? store.getters['creator/questions'].length,
      url: `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })}`
    })

    try {
      await navigator.clipboard.writeText(shareText)
      await showToast.default(i18n.t('clipboard.callback.success'))
      await navigator.share({
        title: 'parolla',
        text: shareText
      })
    } catch {
      await navigator.clipboard.writeText(shareText)
      await showToast.default(i18n.t('clipboard.callback.success'))
    }
  }

  return { shareRoom }
}
