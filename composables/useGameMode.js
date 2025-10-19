import { useRoute, useContext, computed } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums'

export default () => {
  const route = useRoute()
  const { localePath } = useContext()

  const activeGameMode = computed(() => {
    if (route.value.path === localePath({ name: 'DailyMode' })) {
      return gameModeKeyEnum.DAILY
    }

    if (route.value.path === localePath({ name: 'UnlimitedMode' })) {
      return gameModeKeyEnum.UNLIMITED
    }

    if (route.value.path === localePath({ name: 'CreatorMode-CreatorModeRoom' })) {
      return gameModeKeyEnum.CREATOR
    }

    if (route.value.path === localePath({ name: 'TourMode-TourModeGame' })) {
      return gameModeKeyEnum.TOUR
    }

    if (route.value.path === localePath({ name: 'WordblockMode' })) {
      return gameModeKeyEnum.WORDBLOCK
    }
  })

  return {
    activeGameMode
  }
}
