<template lang="pug">
.profile-view
  template(v-if="playerLoading")
    .profile-view-loading
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}

  template(v-else-if="playerError || !player")
    .profile-view-error
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="$emit('player-error-click')") {{ $t('dialog.player.callback.error.action') }}

  template(v-else)
    .profile-view-banner(:style="bannerStyle")
      .profile-view-banner__actions(v-if="!isSelf")
        DropdownMenu.profile-view-actions(
          withDropdownCloser
          direction="right"
          :overlay="false"
          :is-open="isActionsOpen"
          @closed="isActionsOpen = false"
        )
          template(#trigger)
            button.profile-view-banner__more-btn(type="button" aria-label="actions" @click="isActionsOpen = true")
              AppIcon(name="ion:md-more" color="var(--color-text-04)" :width="20" :height="20")
          template(#body)
            nav.profile-view-actions__nav
              .profile-view-actions__item(dropdown-closer @click="handleGoToProfile")
                AppIcon.profile-view-actions__item-icon(name="tabler:user-circle" :width="18" :height="18")
                span.profile-view-actions__item-title {{ $t('profile.actions.goToProfile') }}
              .profile-view-actions__item(dropdown-closer @click="handleReport")
                AppIcon.profile-view-actions__item-icon(name="tabler:flag" :width="18" :height="18")
                span.profile-view-actions__item-title {{ $t('profile.actions.report') }}

    MountingPortal(mount-to="body" append)
      ReportDialog(
        :is-open="isOpenReportDialog"
        :scope="reportTypeEnum.PROFILE"
        :additional="reportAdditional"
        @closed="isOpenReportDialog = false"
      )

    .profile-view-header
      .profile-view-header__avatar-wrap
        PlayerAvatar.profile-view-header__avatar(:user="player" :size="96")

      .profile-view-header__action(v-if="isSelf")
        Button.profile-view-header__edit-btn(plain round size="small" @click="goToEdit") {{ $t('profile.editButton') }}

    .profile-view-identity
      h1.profile-view-identity__name {{ player.fullname || player.username }}
      span.profile-view-identity__handle @{{ player.username }}

      p.profile-view-identity__bio(v-if="player.bio") {{ player.bio }}

      .profile-view-identity__meta
        AppIcon.profile-view-identity__meta-icon(name="tabler:clock" color="var(--color-text-03)" :width="14" :height="14")
        Timeago.profile-view-identity__meta-value(:datetime="player.createdAt" :auto-update="60" :locale="$i18n.locale")
        label.profile-view-identity__meta-label &nbsp;{{ $t('general.joined').toLowerCase() }}

    .profile-view-stats
      .profile-view-stats__item
        strong.profile-view-stats__value {{ formatNumber(playerStats.rooms) }}
        span.profile-view-stats__label {{ $t('profile.stats.created') }}
      .profile-view-stats__item
        strong.profile-view-stats__value {{ formatNumber(playerStats.scores) }}
        span.profile-view-stats__label {{ $t('profile.stats.played') }}
      .profile-view-stats__item
        strong.profile-view-stats__value {{ formatNumber(playerStats.reviews) }}
        span.profile-view-stats__label {{ $t('profile.stats.reviews') }}
</template>

<script>
import { defineComponent, computed, ref, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Empty, Button, Loading } from 'vant'
import DropdownMenu from 'v-dropdown-menu'
import 'v-dropdown-menu/dist/v-dropdown-menu.css'
import { buildBannerStyle } from '@/functions/profileBanner'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Empty,
    Button,
    Loading,
    DropdownMenu
  },
  props: {
    player: {
      type: Object,
      required: false,
      default: null
    },
    playerLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    playerError: {
      type: Boolean,
      required: false,
      default: false
    },
    playerStats: {
      type: Object,
      required: false,
      default: () => ({ rooms: 0, scores: 0, reviews: 0 })
    }
  },
  setup(props) {
    const store = useStore()
    const { localePath } = useContext()
    const router = useRouter()
    const isOpenReportDialog = ref(false)
    const isActionsOpen = ref(false)

    const me = computed(() => store.getters['auth/user'])
    const isSelf = computed(() => me.value && props.player && me.value.username === props.player.username)

    const bannerStyle = computed(() => buildBannerStyle(props.player?.diceBear?.config))

    const reportAdditional = computed(() => {
      if (!props.player) return null

      return JSON.stringify({
        reportedUser: {
          id: props.player.id,
          username: props.player.username,
          bio: props.player.bio || '',
          diceBear: props.player.diceBear
        }
      })
    })

    const goToEdit = () => {
      router.push(localePath({ name: 'Account-AccountEdit' }))
    }

    const handleGoToProfile = () => {
      isActionsOpen.value = false

      if (props.player?.username) {
        store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', false)
        router.push(localePath({ name: 'Profile-username', params: { username: props.player.username } }))
      }
    }

    const handleReport = () => {
      isActionsOpen.value = false
      isOpenReportDialog.value = true
    }

    const formatNumber = n => {
      const value = Number(n) || 0

      if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`

      return String(value)
    }

    return {
      isOpenReportDialog,
      isActionsOpen,
      reportTypeEnum,
      reportAdditional,
      isSelf,
      bannerStyle,
      goToEdit,
      handleGoToProfile,
      handleReport,
      formatNumber
    }
  }
})
</script>

<style lang="scss" src="./ProfileView.component.scss"></style>
