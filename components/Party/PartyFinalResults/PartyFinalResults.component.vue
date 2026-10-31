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

    //- qa: the leaderboard routes' board (podium + the next two); my own row pinned when I'm not in the top 5.
    //- Own score only when the board is hidden ("never" / presenter)
    template(v-else)
      Leaderboard.party-final-results__board(v-if="scorers.length" :scorers="scorers" :current-player="pinnedMe")

      .party-final-results__mine(v-else-if="final.me")
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

// same as the leaderboard routes' first screen: podium + two rows
const BOARD_SIZE = 5

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
    const { toUser } = usePartyUser()

    // Leaderboard's scorer shape: the app user + score and rank
    const ranked = computed(() => (leaderboard.value || []).map((row, i) => ({ ...toUser(row), score: row.score, rank: i + 1 })))
    const scorers = computed(() => ranked.value.slice(0, BOARD_SIZE))
    const pinnedMe = computed(() => ranked.value.slice(BOARD_SIZE).find(row => row.id === myId.value) || null)

    // media without a note is identified by its thumbnail
    const choiceLabel = choice => (choice.choiceType === choiceTypeEnum.TEXT ? choice.text : choice.mediaNote) || ''

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
      scorers,
      pinnedMe,
      choiceLabel
    }
  }
})
</script>

<style lang="scss" src="./PartyFinalResults.component.scss" scoped></style>
