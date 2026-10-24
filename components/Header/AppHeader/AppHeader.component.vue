<template lang="pug">
.app-header
  menu.app-header-nav
    li.app-header-nav__item(v-if="isHome" @click="dialog.drawer.isOpen = true")
      ActionButton(icon="tabler:menu-2" :icon-size="24" :aria-label="$t('dialog.menu.menu')")

    template(v-if="isVisibleBackButton")
      li.app-header-nav__item(@click="handleClickBackButton")
        ActionButton(icon="tabler:arrow-left" :icon-size="24")

    li.app-header-nav__item.app-header-nav__item--shop(v-if="isHome" @click="openInventoryDialog('shop')")
      ActionButton(icon="streamline-ultimate-color:shop-sale-1" :icon-size="24")
      span.app-header-nav__gold-badge(v-if="$auth.loggedIn")
        GoldAmount(size="sm" :amount="gold")

  AppLogo(type="title" :class="[logoClasses]" @click.native.prevent.capture="handleClickAppLogo")
  // Icon-only logo swapped in while the on-screen keyboard is open on mobile
  AppLogo.app-logo--osk(:class="[logoClasses]" :width="32" :height="32" @click.native.prevent.capture="handleClickAppLogo")

  menu.app-header-nav
    li.app-header-nav__item.app-header-nav__item--tourModeOnline.me-3(
      v-if="activeGameMode === gameModeKeyEnum.TOUR"
      @click="openTourModeOnlineDialog"
    )
      ActionButton(
        icon="tabler:users-group"
        :icon-size="24"
        :badge="formatMillions(tourUserList.totalPlayers + tourUserList.totalViewers)"
      )

    li.app-header-nav__item(v-if="isVisibleHowToPlay" @click="toggleHowToPlayDialog")
      ActionButton(icon="tabler:info-circle" :icon-size="24")

    li.app-header-nav__item.app-header-nav__item--stats(v-if="isVisibleStatsButton" @click="toggleStatsDialog")
      ActionButton(icon="tabler:chart-bar" :icon-size="24")

    li.app-header-nav__item.app-header-nav__item--roomReviews(
      v-if="activeGameMode === gameModeKeyEnum.CREATOR"
      @click="toggleRoomReviewDialog"
    )
      ActionButton(
        icon="tabler:message-2"
        :icon-size="24"
        :badge="room.reviewCount > 0 ? room.reviewCount : null"
        :class="{ 'me-2': room.reviewCount > 0 }"
      )

    li.app-header-nav__item.app-header-nav__item--notifications(v-if="$auth.loggedIn" @click="toggleNotificationsDialog")
      ActionButton(icon="tabler:bell" badge-max99 :icon-size="24" :badge="unreadCount")

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

  // App Drawer (homepage hamburger)
  LazyAppDrawer(v-if="isHome" :isOpen="dialog.drawer.isOpen" @closed="dialog.drawer.isOpen = false")
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
  // Notifications Dialog
  LazyNotificationsDialog(v-if="$auth.loggedIn" :isOpen="dialog.notifications.isOpen" @closed="dialog.notifications.isOpen = false")
  // Inventory Dialog (inventory / shop / quests)
  LazyInventoryDialog(:isOpen="inventoryDialog.isOpen" @closed="closeInventoryDialog")
  // Room Review Dialog
  LazyRoomReviewDialog(
    :isOpen="dialog.roomReview.isOpen"
    :target-comment-id="targetCommentId"
    :target-rating-user-id="targetRatingUserId"
    @closed="handleRoomReviewClosed"
  )
</template>

<script>
import { defineComponent, useRouter, useRoute, useContext, useStore, ref, reactive, computed, watch } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { localePath, getRouteBaseName, i18n, $auth } = useContext()
    const store = useStore()

    const { formatMillions } = useFormatter()

    const { activeGameMode } = useGameMode()
    const { openLeaveDialog } = useDialog()

    const user = computed(() => store.getters['auth/user'])
    const room = computed(() => store.getters['creator/room'])
    const tourUserList = computed(() => store.getters['tour/userList'])

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
      roomReview: {
        isOpen: false
      },
      notifications: {
        isOpen: false
      },
      drawer: {
        isOpen: false
      }
    })

    const unreadCount = computed(() => store.getters['notification/unreadCount'])

    const isHome = computed(() => getRouteBaseName(route.value) === 'Main')
    const gold = computed(() => store.state.economy.wallet.gold)
    const inventoryDialog = computed(() => store.state.economy.dialog.inventory)
    const openInventoryDialog = tab => store.commit('economy/OPEN_INVENTORY_DIALOG', tab)
    const closeInventoryDialog = () => store.commit('economy/SET_IS_OPEN_INVENTORY_DIALOG', false)

    const toggleNotificationsDialog = () => {
      dialog.notifications.isOpen = !dialog.notifications.isOpen
    }

    watch(
      () => $auth.loggedIn,
      loggedIn => store.dispatch(loggedIn ? 'notification/startPolling' : 'notification/stopPolling'),
      { immediate: true }
    )

    // deep link from notifications / profile: ?comment=<documentId> opens the reviews dialog pinned to it
    const targetCommentId = ref(null)
    const targetRatingUserId = ref(null)

    // ?comment=<documentId> pins a comment; ?rating=<userId> jumps to that player's rating row
    watch(
      () => [route.value.query.comment, route.value.query.rating, room.value?.id],
      ([comment, rating, roomId]) => {
        if ((comment || rating) && roomId && activeGameMode.value === gameModeKeyEnum.CREATOR) {
          targetCommentId.value = comment || null
          targetRatingUserId.value = rating || null
          dialog.roomReview.isOpen = true
        }
      },
      { immediate: true }
    )

    const handleRoomReviewClosed = () => {
      dialog.roomReview.isOpen = false

      if (targetCommentId.value || targetRatingUserId.value) {
        targetCommentId.value = null
        targetRatingUserId.value = null
        router.replace({ query: { ...route.value.query, comment: undefined, rating: undefined } })
      }
    }

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
        // Wordblock games are stored per locale + charLength
        const gameKey = { locale: i18n.locale, charLength: parseInt(route.value.params.charLength) || 5 }
        const currentDialogState = wordblockDialog.value(gameKey).stats.isOpen
        store.commit('wordblock/SET_IS_OPEN_STATS_DIALOG', { ...gameKey, isOpen: !currentDialogState })
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
      // the scene's intro how-to-play is already on screen; don't stack the header's copy on it
      if (store.state.app.isOpenIntroHowToPlay) return

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

    const toggleRoomReviewDialog = () => {
      dialog.roomReview.isOpen = !dialog.roomReview.isOpen
    }

    const openTourModeOnlineDialog = () => {
      store.commit('tour/SET_IS_OPEN_TOUR_MODE_ONLINE_DIALOG', true)
    }

    const handleClickBackButton = () => {
      const triggerRoute = () => {
        router.back()
      }

      if (
        (activeGameMode.value && activeGameMode.value.length > 0) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose-Choices' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose-Flashcards' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeEdit-slug' }) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'MusicMode-GuessTheSong-Play' }))
      ) {
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
      if (
        (activeGameMode.value && activeGameMode.value.length > 0) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeCompose' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeEdit-slug' }))
      ) {
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
        'app-logo--pushedToStart': route.value.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeRoom-slug' })),
        'app-logo--hasBack': isVisibleBackButton.value,
        'app-logo--centered': isHome.value
      }
    })

    const isVisibleBackButton = computed(() => {
      if (
        activeGameMode.value === gameModeKeyEnum.DAILY ||
        activeGameMode.value === gameModeKeyEnum.UNLIMITED ||
        activeGameMode.value === gameModeKeyEnum.CREATOR ||
        activeGameMode.value === gameModeKeyEnum.WORDBLOCK ||
        activeGameMode.value === gameModeKeyEnum.DRAW ||
        activeGameMode.value === gameModeKeyEnum.GEOGUESS ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeRooms' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose-Choices' }) ||
        route.value.path === localePath({ name: 'CreatorMode-CreatorModeCompose-Flashcards' }) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'CreatorMode-CreatorModeEdit-slug' })) ||
        route.value.path === localePath({ name: 'TourMode-TourModeGame' }) ||
        route.value.path.startsWith(localePath({ name: 'DailyMode-Leaderboard' })) ||
        route.value.path.startsWith(localePath({ name: 'TourMode-Leaderboard' })) ||
        route.value.path.startsWith(localePath({ name: 'WordblockMode-Leaderboard' })) ||
        route.value.path === localePath({ name: 'MusicMode-GuessTheSong' }) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'MusicMode-GuessTheSong-Play' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Profile-username' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Account-AccountEdit' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Activities' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Community-CommunityList' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Community-Community-slug' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Community-CommunityCompose' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Community-CommunityEdit-slug' })) ||
        route.value.name.startsWith(getRouteBaseName({ name: 'Community-CommunityPost-slug-postId' }))
      ) {
        return true
      }
    })

    const isVisibleStatsButton = computed(() => {
      // The QA-quiz check must be scoped to CREATOR mode. Without that
      // guard, room.quizType (set when a user opens a QA creator room
      // and never reset on navigation) keeps the stats button visible
      // on Main and elsewhere after the user leaves the game.
      if (
        activeGameMode.value === gameModeKeyEnum.DAILY ||
        activeGameMode.value === gameModeKeyEnum.UNLIMITED ||
        (activeGameMode.value === gameModeKeyEnum.CREATOR && (!room.value.quizType || room.value.quizType === quizTypeEnum.QA)) ||
        activeGameMode.value === gameModeKeyEnum.WORDBLOCK
      ) {
        return true
      }
    })

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
      unreadCount,
      toggleNotificationsDialog,
      isHome,
      gold,
      inventoryDialog,
      openInventoryDialog,
      closeInventoryDialog,
      targetCommentId,
      targetRatingUserId,
      handleRoomReviewClosed,
      openTourModeOnlineDialog,
      handleClickBackButton,
      handleClickAppLogo,
      logoClasses,
      isVisibleBackButton,
      user,
      room,
      tourUserList
    }
  }
})
</script>

<style lang="scss" src="./AppHeader.component.scss"></style>
