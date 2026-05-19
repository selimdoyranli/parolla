<template lang="pug">
.player-profile-card
  Button.player-profile-card-report-btn(v-if="player" type="default" auth-control round size="small" @click="isOpenReportDialog = true")
    AppIcon(name="tabler:flag" color="var(--color-text-03)" :width="18" :height="18")

  MountingPortal(mount-to="body" append)
    ReportDialog(
      :is-open="isOpenReportDialog"
      :scope="reportTypeEnum.PROFILE"
      :additional="reportAdditional"
      @closed="isOpenReportDialog = false"
    )

  .player-profile-card-player
    template(v-if="playerLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}

    template(v-else-if="playerError")
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="$emit('player-error-click')") {{ $t('dialog.player.callback.error.action') }}

    template(v-else)
      PlayerAvatar.player-profile-card__avatar(with-username :user="player")

      .player-profile-card-created-at
        AppIcon.player-profile-card-created-at__icon(name="tabler:clock" color="var(--color-text-03)" :width="16" :height="16")
        Timeago.player-profile-card-created-at__value(:datetime="player.createdAt" :auto-update="60" :locale="$i18n.locale")
        label.player-profile-card-created-at__label &nbsp;{{ $t('general.joined').toLowerCase() }}

      .player-profile-card-info
        span.player-profile-card-info__title {{ $t('dialog.player.myBio') }}
        .player-profile-card-info__separator
        span(v-if="!player.fullname && !player.bio") -
        span.player-profile-card-info__fullname(v-if="player.fullname") {{ player.fullname }}
        p.player-profile-card-info__bio(v-if="player.bio") {{ player.bio }}

  .player-profile-card-tour-score
    template(v-if="tourScoreLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.tourScore.loading') }}

    template(v-else-if="tourScoreError")
      Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
        Button(@click="$emit('tour-score-error-click')") {{ $t('dialog.player.tourScore.callback.error.action') }}

    template(v-else)
      strong.player-profile-card-tour-score__title {{ $t('dialog.player.tourScore.title') }}
      PlayerTourScoreTable.player-profile-card-tour-score__table(:tourScore="tourScore")
</template>

<script>
import { defineComponent, computed, ref } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
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
    tourScore: {
      type: Object,
      required: false,
      default: null
    },
    tourScoreLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    tourScoreError: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const isOpenReportDialog = ref(false)

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

    return {
      reportTypeEnum,
      isOpenReportDialog,
      reportAdditional
    }
  }
})
</script>

<style lang="scss" src="./PlayerProfileCard.component.scss"></style>
