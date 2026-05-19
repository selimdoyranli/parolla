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

      .profile-view-header__action
        Button.profile-view-header__edit-btn(v-if="isSelf" plain round size="small" @click="goToEdit") {{ $t('profile.editButton') }}

        Button.profile-view-header__report-btn(v-else type="default" auth-control round size="small" @click="isOpenReportDialog = true")
          AppIcon(name="tabler:flag" color="var(--color-text-03)" :width="18" :height="18")

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
import { buildBannerStyle } from '@/functions/profileBanner'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Empty,
    Button,
    Loading
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

    const formatNumber = n => {
      const value = Number(n) || 0

      if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`

      return String(value)
    }

    return {
      isOpenReportDialog,
      reportTypeEnum,
      reportAdditional,
      isSelf,
      bannerStyle,
      goToEdit,
      formatNumber
    }
  }
})
</script>

<style lang="scss" src="./ProfileView.component.scss"></style>
