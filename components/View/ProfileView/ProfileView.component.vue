<template lang="pug">
.page.profile-view
  .profile-view-player
    template(v-if="playerLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}

    template(v-else-if="playerError")
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="$emit('player-error-click')") {{ $t('dialog.player.callback.error.action') }}

    template(v-else)
      PlayerAvatar.profile-view__avatar(with-username :user="player")

      .profile-view-created-at
        AppIcon.profile-view-created-at__icon(name="tabler:clock" color="var(--color-text-03)" :width="16" :height="16")
        Timeago.profile-view-created-at__value(:datetime="player.createdAt" :auto-update="60" :locale="$i18n.locale")
        label.profile-view-created-at__label &nbsp;{{ $t('general.joined').toLowerCase() }}

      .profile-view-info
        span.profile-view-info__title {{ $t('dialog.player.myBio') }}
        .profile-view-info__separator
        span(v-if="!player.fullname && !player.bio") -
        span.profile-view-info__fullname(v-if="player.fullname") {{ player.fullname }}
        p.profile-view-info__bio(v-if="player.bio") {{ player.bio }}

  .profile-view-tour-score
    template(v-if="tourScoreLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.tourScore.loading') }}

    template(v-else-if="tourScoreError")
      Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
        Button(@click="$emit('tour-score-error-click')") {{ $t('dialog.player.tourScore.callback.error.action') }}

    template(v-else)
      strong.profile-view-tour-score__title {{ $t('dialog.player.tourScore.title') }}
      PlayerTourScoreTable.profile-view-tour-score__table(:tourScore="tourScore")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
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
  setup() {}
})
</script>

<style lang="scss" src="./ProfileView.component.scss"></style>
