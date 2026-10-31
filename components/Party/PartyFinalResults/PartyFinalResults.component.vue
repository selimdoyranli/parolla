<template lang="pug">
//- end of a game: reads only store.final (+ room game title), never `round` (a reconnect in the final phase gets no round).
//- Stays up until the host takes everyone back to the lobby
.party-final-results
  .party-final-results__inner
    header.party-final-results__head
      span.party-card__eyebrow {{ $t('party.final.title') }}
      h2.party-final-results__quiz(v-if="title") {{ title }}

    //- choices: the room's champion (solo winner look) + who fell out, in order
    template(v-if="isChoices")
      .party-final-results__champion
        .party-final-results__kicker 🎉 {{ $t('choices.winner.title') }} 🎉
        ChoiceCard.choice-card--winner(:choice="final.champion")
      section.party-card(v-if="eliminated.length")
        header.party-final-results__board-head
          span.party-card__eyebrow {{ $t('party.final.eliminated') }}
        ol.party-final-results__rows
          li.party-final-results__row(v-for="(choice, index) in eliminated" :key="index")
            span.party-final-results__rank {{ index + 1 }}
            img.party-final-results__thumb(v-if="choice.media && choice.media.url" :src="choice.media.url" alt)
            span.party-final-results__name {{ choiceLabel(choice) }}

    //- qa: podium + the rest, or own score only (leaderboard "never" / presenter)
    template(v-else)
      .party-final-results__podium(v-if="podium.length")
        .party-final-results__step(
          v-for="row in podium"
          :key="row.playerId"
          :class="[`party-final-results__step--${row.rank}`, { 'party-final-results__step--me': row.playerId === myId }]"
        )
          PlayerAvatar(:user="toUser(row)" :size="row.rank === 1 ? 56 : 44" :open-player-dialog-on-click="!isGuest(row)")
          span.party-final-results__step-name.party-user-name(:class="{ 'is-link': !isGuest(row) }" @click="openPlayer(row)")
            | {{ row.name }}
            span.gm-username-extra(v-if="isGm(row)") &nbsp;(GM)
          b.party-final-results__step-score {{ row.score }}
          span.party-final-results__step-sub {{ $t('party.game.correctCount', { n: row.correctCount }) }}
          .party-final-results__block
            AppIcon(v-if="row.rank === 1" name="tabler:crown" :width="18" :height="18")
            span(v-else) {{ row.rank }}

      section.party-card(v-if="rest.length")
        ol.party-final-results__rows
          li.party-final-results__row(
            v-for="row in rest"
            :key="row.playerId"
            :class="{ 'party-final-results__row--me': row.playerId === myId }"
          )
            span.party-final-results__rank {{ row.rank }}
            PlayerAvatar(:user="toUser(row)" :size="24" :open-player-dialog-on-click="!isGuest(row)")
            span.party-final-results__name.party-user-name(:class="{ 'is-link': !isGuest(row) }" @click="openPlayer(row)")
              | {{ row.name }}
              span.gm-username-extra(v-if="isGm(row)") &nbsp;(GM)
            span.party-final-results__correct {{ $t('party.game.correctCount', { n: row.correctCount }) }}
            b.party-final-results__score {{ row.score }}

      .party-final-results__mine(v-if="final.me")
        span(v-if="final.me.rank") {{ $t('party.final.rank', { n: final.me.rank }) }}
        span(v-else) {{ $t('party.game.score') }}
        b {{ final.me.score }}
        span.party-final-results__mine-sub {{ $t('party.game.correctCount', { n: final.me.correctCount }) }}
      p.party-final-results__hidden(v-else-if="!leaderboard") {{ $t('party.final.hidden') }}

    .party-final-results__lobby
      Button(v-if="isHost" color="var(--color-brand-02)" icon="wap-home-o" round block @click="backToLobby") {{ $t('party.final.backToLobby') }}
      p.party-final-results__waiting(v-else)
        AppIcon(name="tabler:home" :width="14" :height="14")
        | {{ $t('party.final.waitingHost') }}

    //- qa: what everyone wrote, per question
    PartyAnswerReview(v-if="review.length" :review="review" :leaderboard="leaderboard")
</template>

<script>
import { defineComponent, computed, inject, useStore } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { choiceTypeEnum } from '@/enums/quiz.enum'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { usePartyUser } from '@/composables/usePartyUser'

export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const send = inject('partySend')
    const isHost = computed(() => store.getters['party/isHost'])
    const final = computed(() => store.state.party.final)
    const review = computed(() => final.value.review || [])
    const myId = computed(() => store.state.party.myId)
    const title = computed(() => store.getters['party/game']?.title || '')
    const isChoices = computed(() => Boolean(final.value.champion))
    const eliminated = computed(() => final.value.eliminated || [])
    // the server sends the board already ranked
    const leaderboard = computed(() => final.value.leaderboard)
    const ranked = computed(() => (leaderboard.value || []).map((row, i) => ({ ...row, rank: i + 1 })))
    // 2 · 1 · 3 on screen, like a real podium
    const podium = computed(() => [ranked.value[1], ranked.value[0], ranked.value[2]].filter(Boolean))
    const rest = computed(() => ranked.value.slice(3))

    // media without a note is identified by its thumbnail
    const choiceLabel = choice => (choice.choiceType === choiceTypeEnum.TEXT ? choice.text : choice.mediaNote) || ''

    const { toUser, isGuest, isGm, openPlayer } = usePartyUser()

    const backToLobby = () => send(wsTypeEnum.PARTY_LOBBY)

    return {
      isHost,
      review,
      backToLobby,
      final,
      myId,
      title,
      isChoices,
      eliminated,
      leaderboard,
      podium,
      rest,
      choiceLabel,
      toUser,
      isGuest,
      isGm,
      openPlayer
    }
  }
})
</script>

<style lang="scss" src="./PartyFinalResults.component.scss" scoped></style>
