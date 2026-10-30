<template lang="pug">
section.party-next-game
  .party-next-game__row(v-if="next")
    QuizCover.party-next-game__cover(:room="next")
    .party-next-game__info
      span.party-next-game__eyebrow {{ $t('party.lobby.next') }}
      strong.party-next-game__title {{ next.title }}
      .party-next-game__pills
        span.party-pill {{ $t(`party.lobby.types.${next.quizType}`) }}
        span.party-pill(v-if="next.quizType === 'choices'") {{ $t('playIntro.choices', { count: next.choiceCount }) }}
        span.party-pill(v-else) {{ $t('playIntro.questions', { count: next.questionCount }) }}
        span.party-pill(v-if="next.quizType !== 'choices'") {{ $t('party.lobby.settings.seconds', { n: settings.roundDurationSec }) }}
  .party-next-game__empty(v-else)
    AppIcon(name="tabler:playlist-add" :width="22" :height="22")
    div
      strong {{ $t('party.lobby.emptyQueue') }}
      small(v-if="isHost") {{ $t('party.lobby.emptyQueueHint') }}

  //- host: start + remote; the start button moves to the bottom dock on mobile
  .party-next-game__actions(v-if="isHost")
    PartyStartButton.party-next-game__start
    button.party-next-game__remote(type="button" @click="$emit('open-remote')")
      AppIcon(name="tabler:device-mobile" :width="16" :height="16")
      span {{ $t('party.lobby.remote') }}
  .party-next-game__waiting(v-else)
    AppIcon.party-next-game__hourglass(name="tabler:hourglass-high" :width="22" :height="22")
    div
      strong {{ $t('party.lobby.waitingHost') }}
      small {{ $t('party.lobby.waitingHostSub') }}

  p.party-next-game__notice(v-if="settings.presentation")
    AppIcon(name="tabler:presentation" :width="16" :height="16")
    span {{ $t(isHost ? 'party.lobby.presentationHost' : 'party.lobby.presentationNotice') }}
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'

export default defineComponent({
  emits: ['open-remote'],
  setup() {
    const store = useStore()
    const isHost = computed(() => store.getters['party/isHost'])
    const settings = computed(() => store.getters['party/settings'])
    const next = computed(() => store.getters['party/queue'][0] || null)

    return { isHost, settings, next }
  }
})
</script>

<style lang="scss" src="./PartyNextGameCard.component.scss" scoped></style>
