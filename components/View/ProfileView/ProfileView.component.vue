<template lang="pug">
.profile-view
  template(v-if="playerLoading")
    .profile-view-skeleton
      .profile-view-skeleton__banner
      .profile-view-skeleton__avatar
      Skeleton(row-width="60%" :row="3")

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
</template>

<script>
import { defineComponent, computed, ref, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Empty, Button, Skeleton } from 'vant'
import { buildBannerStyle } from '@/functions/profileBanner'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Empty,
    Button,
    Skeleton
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

    return {
      isOpenReportDialog,
      reportTypeEnum,
      reportAdditional,
      isSelf,
      bannerStyle,
      goToEdit
    }
  }
})
</script>

<style lang="scss" src="./ProfileView.component.scss"></style>
