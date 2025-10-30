<template lang="pug">
.app-header
  menu.app-header-nav
    template(v-if="isVisibleLocaleSwitchButton")
      li.app-header-nav__item(@click="toggleLocaleSwitchDialog")
        AppIcon(name="tabler:world-cog")
    template(v-if="isVisibleAnnouncementsButton")
      li.app-header-nav__item(@click="toggleAnnouncementsDialog")
        AppIcon(name="tabler:speakerphone" :label="todaysAnnouncementsCount")
    template(v-if="isVisibleBackButton")
      li.app-header-nav__item(@click="handleClickBackButton")
        AppIcon(name="tabler:arrow-left")

  AppLogo(type="title" :class="[logoClasses]" @click.native.prevent.capture="handleClickAppLogo")

  menu.app-header-nav
    li.app-header-nav__item.app-header-nav__item--tourModeOnline.me-3(
      v-if="activeGameMode === gameModeKeyEnum.TOUR"
      @click="openTourModeOnlineDialog"
    )
      AppIcon(name="tabler:users-group" :label="formatMillions(userList.totalPlayers + userList.totalViewers)")

    li.app-header-nav__item(v-if="isVisibleHowToPlay" @click="toggleHowToPlayDialog")
      AppIcon(name="tabler:info-circle")

    li.app-header-nav__item.app-header-nav__item--stats(v-if="isVisibleStatsButton" @click="toggleStatsDialog")
      AppIcon(name="tabler:chart-bar")

    li.app-header-nav__item.app-header-nav__item--roomReviews(
      v-if="activeGameMode === gameModeKeyEnum.CREATOR"
      @click="toggleRoomReviewDialog"
    )
      AppIcon.me-2(v-if="room.reviewCount > 0" name="tabler:message-2" :label="room.reviewCount")
      AppIcon(v-else name="tabler:message-2")

    li.app-header-nav__item.app-header-nav__item--menu(@click="toggleMenuDialog")
      template(v-if="$auth.loggedIn && $auth.user")
        PlayerAvatar(:user="user" :is-visitor="!$auth.loggedIn")

      template(v-else)
        AppIcon(name="tabler:user-circle")

  // How To Play Dialog
  LazyHowToPlayDialog(
    v-if="isVisibleHowToPlay"
    :cancel-button-text="$t('general.close')"
    :isOpen="dialog.howToPlay.isOpen"
    @closed="dialog.howToPlay.isOpen = false"
  )
  // Menu Dialog
  LazyMenuDialog(
    :isOpen="dialog.menu.isOpen"
    @clickedHowToPlay="toggleHowToPlayDialog"
    @clickedHowToCalculateStats="toggleHowToCalculateStatsDialog"
    @clickedCredits="toggleCreditsDialog"
    @clickedContact="toggleContactDialog"
    @clickedSwitchLocale="toggleLocaleSwitchDialog"
    @clickedReviewRoom="toggleRoomReviewDialog"
    @closed="dialog.menu.isOpen = false"
  )

  // How To Calculate Stats Dialog
  LazyHowToCalculateStatsDialog(:isOpen="dialog.howToCalculateStats.isOpen" @closed="dialog.howToCalculateStats.isOpen = false")
  // Credits Dialog
  LazyCreditsDialog(:isOpen="dialog.credits.isOpen" @closed="dialog.credits.isOpen = false")
  // Contact Dialog
  LazyContactDialog(:isOpen="dialog.contact.isOpen" @closed="dialog.contact.isOpen = false")
  // Locale Switch Dialog
  LazyLocaleSwitchDialog(
    v-if="$route.path === localePath({ name: 'Main' })"
    :isOpen="dialog.localeSwitch.isOpen"
    @closed="dialog.localeSwitch.isOpen = false"
  )
  // Announcements Dialog
  LazyAnnouncementsDialog(
    v-if="$route.path === localePath({ name: 'Main' })"
    :isOpen="dialog.announcements.isOpen"
    @closed="dialog.announcements.isOpen = false"
    @on-fetch-success="handleFetchAnnouncementsSuccess"
  )
  // Room Review Dialog
  LazyRoomReviewDialog(:isOpen="dialog.roomReview.isOpen" @closed="dialog.roomReview.isOpen = false")
</template>

<script>
import { defineComponent, useRouter, useRoute, useContext, useStore, ref, reactive, computed } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums'

export default defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { localePath } = useContext()
    const store = useStore()

    const userList = computed(() => store.getters['tour/userList'])

    const { formatMillions } = useFormatter()

    const { activeGameMode } = useGameMode()
    const { openLeaveDialog } = useDialog()

    const dialog = reactive({
      howToPlay: {
        isOpen: false
      },
      menu: {
        isOpen: false
      },
      howToCalculateStats: {
        isOpen: false
      },
      credits: {
        isOpen: false
      },
      contact: {
        isOpen: false
      },
      localeSwitch: {
        isOpen: false
      },
      announcements: {
        isOpen: false
      },
      roomReview: {
        isOpen: false
      }
    })

    const dailyDialog = computed(() => store.getters['daily/dialog'])
    const unlimitedDialog = computed(() => store.getters['unlimited/dialog'])
    const creatorDialog = computed(() => store.getters['creator/dialog'])
    const wordblockDialog = computed(() => store.getters['wordblock/dialog'])

    const toggleStatsDialog = () => {
      if (activeGameMode.value === gameModeKeyEnum.DAILY) {
        store.commit('daily/SET_IS_OPEN_STATS_DIALOG', !dailyDialog.value.stats.isOpen)
      }

      if (activeGameMode.value === gameModeKeyEnum.UNLIMITED) {
        store.commit('unlimited/SET_IS_OPEN_STATS_DIALOG', !unlimitedDialog.value.stats.isOpen)
      }

      if (activeGameMode.value === gameModeKeyEnum.CREATOR) {
        store.commit('creator/SET_IS_OPEN_STATS_DIALOG', !creatorDialog.value.stats.isOpen)
      }

      if (activeGameMode.value === gameModeKeyEnum.WORDBLOCK) {
        store.commit('wordblock/SET_IS_OPEN_STATS_DIALOG', !wordblockDialog.value.stats.isOpen)
      }
    }

    const isVisibleHowToPlay = computed(() => {
      return (
        activeGameMode.value === gameModeKeyEnum.DAILY ||
        activeGameMode.value === gameModeKeyEnum.UNLIMITED ||
        activeGameMode.value === gameModeKeyEnum.CREATOR ||
        activeGameMode.value === gameModeKeyEnum.TOUR ||
        activeGameMode.value === gameModeKeyEnum.WORDBLOCK
      )
    })

    const toggleHowToPlayDialog = () => {
      dialog.howToPlay.isOpen = !dialog.howToPlay.isOpen
    }

    const toggleMenuDialog = () => {
      dialog.menu.isOpen = !dialog.menu.isOpen
    }

    const toggleHowToCalculateStatsDialog = () => {
      dialog.howToCalculateStats.isOpen = !dialog.howToCalculateStats.isOpen
    }

    const toggleCreditsDialog = () => {
      dialog.credits.isOpen = !dialog.credits.isOpen
    }

    const toggleContactDialog = () => {
      dialog.contact.isOpen = !dialog.contact.isOpen
    }

    const toggleLocaleSwitchDialog = () => {
      dialog.localeSwitch.isOpen = !dialog.localeSwitch.isOpen
    }

    const todaysAnnouncementsCount = ref(0)

    const toggleAnnouncementsDialog = () => {
      dialog.announcements.isOpen = !dialog.announcements.isOpen
    }

    const handleFetchAnnouncementsSuccess = count => {
      todaysAnnouncementsCount.value = count
    }

    const toggleRoomReviewDialog = () => {
      dialog.roomReview.isOpen = !dialog.roomReview.isOpen
    }

    const openTourModeOnlineDialog = () => {
      store.commit('tour/SET_IS_OPEN_TOUR_MODE_ONLINE_DIALOG', true)
    }

    const handleClickBackButton = () => {
      const triggerRoute = () => {
        if (
          route.value.path === localePath({ name: 'CreatorMode-CreatorModeRooms' }) ||
          route.value.path === localePath({ name: 'CreatorMode-CreatorModeMyRooms' }) ||
          route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose' }) ||
          route.value.path === localePath({ name: 'CreatorMode-CreatorModeRoom' })
        ) {
          router.replace(localePath({ name: 'CreatorMode-CreatorModeIntro' }))
        } else if (route.value.path === localePath({ name: 'CreatorMode-CreatorModeEdit' })) {
          router.replace(localePath({ name: 'CreatorMode-CreatorModeMyRooms' }))
        } else {
          router.replace(localePath({ name: 'Main' }))
        }
      }

      if (activeGameMode.value && activeGameMode.value.length > 0) {
        openLeaveDialog({
          confirm: () => {
            triggerRoute()
          }
        })
      } else {
        triggerRoute()
      }
    }

    const handleClickAppLogo = () => {
      if (activeGameMode.value && activeGameMode.value.length > 0) {
        openLeaveDialog({
          confirm: () => {
            router.push(localePath({ name: 'Main' }))
          }
        })
      } else {
        router.push(localePath({ name: 'Main' }))
      }
    }

    const logoClasses = computed(() => {
      return {
        'app-logo--pushedToStart': route.value.path === localePath({ name: 'CreatorMode-CreatorModeRoom' })
      }
    })

    const isVisibleLocaleSwitchButton = computed(() => {
      if (route.value.path === localePath({ name: 'Main' })) {
        return true
      }
    })

    const isVisibleAnnouncementsButton = computed(() => {
      if (route.value.path === localePath({ name: 'Main' })) {
        return true
      }
    })

    const isVisibleBackButton = computed(() => {
      if (
        activeGameMode.value === gameModeKeyEnum.DAILY ||
        activeGameMode.value === gameModeKeyEnum.UNLIMITED ||
        activeGameMode.value === gameModeKeyEnum.CREATOR ||
        activeGameMode.value === gameModeKeyEnum.WORDBLOCK ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeIntro' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeRooms' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeMyRooms' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeEdit' }) ||
        route.value.path === localePath({ name: 'TourMode-TourModeGame' }) ||
        route.value.path.startsWith(localePath({ name: 'DailyMode-Leaderboard' })) ||
        route.value.path.startsWith(localePath({ name: 'TourMode-Leaderboard' }))
      ) {
        return true
      }
    })

    const isVisibleStatsButton = computed(() => {
      if (
        activeGameMode.value === gameModeKeyEnum.DAILY ||
        activeGameMode.value === gameModeKeyEnum.UNLIMITED ||
        activeGameMode.value === gameModeKeyEnum.CREATOR ||
        activeGameMode.value === gameModeKeyEnum.WORDBLOCK
      ) {
        return true
      }
    })

    const user = computed(() => store.getters['auth/user'])
    const room = computed(() => store.getters['creator/room'])

    return {
      gameModeKeyEnum,
      activeGameMode,
      dialog,
      formatMillions,
      isVisibleStatsButton,
      toggleStatsDialog,
      isVisibleHowToPlay,
      toggleHowToPlayDialog,
      toggleMenuDialog,
      toggleHowToCalculateStatsDialog,
      toggleCreditsDialog,
      toggleContactDialog,
      toggleLocaleSwitchDialog,
      toggleRoomReviewDialog,
      todaysAnnouncementsCount,
      toggleAnnouncementsDialog,
      handleFetchAnnouncementsSuccess,
      openTourModeOnlineDialog,
      handleClickBackButton,
      handleClickAppLogo,
      logoClasses,
      isVisibleLocaleSwitchButton,
      isVisibleAnnouncementsButton,
      isVisibleBackButton,
      user,
      room,
      userList
    }
  }
})
</script>

<style lang="scss" src="./AppHeader.component.scss"></style>
