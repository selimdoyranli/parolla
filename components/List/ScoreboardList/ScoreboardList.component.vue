<template lang="pug">
.scoreboard-list-wrapper
  // The reader's own row. A sibling of the list rather than its first child: the list
  // hands its first three rows a trophy and medals through :nth-child, and numbers every
  // row from a CSS counter, so prepending would steal the trophy and shift every number.
  Collapse.list.scoreboard-list.scoreboard-list--self(v-if="currentPlayer" v-model="toggledSelfItem" accordion)
    CollapseItem.scoreboard-list-item.scoreboard-list-item--self(:disabled="!currentPlayer.results?.gamersAnswers")
      template(#title)
        .scoreboard-list-item-user(:data-rank="currentPlayer.rank")
          strong.scoreboard-list-item-user__username
            PlayerAvatar(:size="20" :user="currentPlayer.user")
            span.scoreboard-list-item-user__name {{ currentPlayer.user.username }}
            span.scoreboard-list-item-user__label
              AppIcon.scoreboard-list-item-user__label-icon(name="tabler:target" :width="12" :height="12")
              span.scoreboard-list-item-user__label-text {{ $t('leaderboard.yourRank.label') }}
              span.scoreboard-list-item-user__label-text.scoreboard-list-item-user__label-text--short {{ $t('leaderboard.yourRank.short') }}

        .scoreboard-list-item-result(v-if="currentPlayer.results")
          strong.scoreboard-list-item-result__item
            template {{ currentPlayer.results.remainTime.minutes }}:{{ currentPlayer.results.remainTime.seconds }}
              sup .{{ currentPlayer.results.remainTime.milliseconds }}
          strong.scoreboard-list-item-result__item 🟩 {{ currentPlayer.results.correctAnswers.length }}
          strong.scoreboard-list-item-result__item 🟥 {{ currentPlayer.results.wrongAnswers.length }}
          strong.scoreboard-list-item-result__item 🟨 {{ currentPlayer.results.passedAnswers.length }}

      ul.scoreboard-list-gamerAnswers(v-if="currentPlayer.results?.gamersAnswers")
        li.scoreboard-list-gamerAnswers-item(
          v-for="(question, questionIndex) in questions"
          :key="questionIndex"
          :class="[getGamerAnswerClasses(getGamerAnswer({ item: currentPlayer, question, questionIndex }))]"
        )
          strong.scoreboard-list-gamerAnswers-item__letter {{ question.letter }}
          span.scoreboard-list-gamerAnswers-item__value
            kbd {{ question.answer }}
            span(v-if="getGamerAnswer({ item: currentPlayer, question, questionIndex })?.isPassed") {{ $t('gameScene.pass').toLocaleUpperCase('tr') }}
            span(v-else-if="getGamerAnswer({ item: currentPlayer, question, questionIndex })?.field?.length > 0")
              | {{ getGamerAnswer({ item: currentPlayer, question, questionIndex })?.field?.toLocaleUpperCase('tr') }}
            span(v-else) -

  Collapse.list.scoreboard-list(v-model="toggledScoreItem" accordion)
    CollapseItem.scoreboard-list-item(
      v-for="(item, index) in items"
      :key="index"
      :class="{ 'scoreboard-list-item--self-inline': isSelfInline(item) }"
      :disabled="!item.results.gamersAnswers"
    )
      template(#title)
        .scoreboard-list-item-user(
          role="button"
          tabindex="0"
          @click.stop="handleClickUser(item.user)"
          @keydown.enter.stop.prevent="handleClickUser(item.user)"
          @keydown.space.stop.prevent="handleClickUser(item.user)"
        )
          strong.scoreboard-list-item-user__username
            PlayerAvatar(:size="20" :user="item.user")
            span.scoreboard-list-item-user__name {{ item.user.username }}

        .scoreboard-list-item-result
          strong.scoreboard-list-item-result__item
            template {{ item.results.remainTime.minutes }}:{{ item.results.remainTime.seconds }}
              sup .{{ item.results.remainTime.milliseconds }}
          strong.scoreboard-list-item-result__item 🟩 {{ item.results.correctAnswers.length }}
          strong.scoreboard-list-item-result__item 🟥 {{ item.results.wrongAnswers.length }}
          strong.scoreboard-list-item-result__item 🟨 {{ item.results.passedAnswers.length }}

      // Gamer answers
      ul.scoreboard-list-gamerAnswers(v-if="item.results.gamersAnswers")
        li.scoreboard-list-gamerAnswers-item(
          v-for="(question, questionIndex) in questions"
          :key="questionIndex"
          :class="[getGamerAnswerClasses(getGamerAnswer({ item, question, questionIndex }))]"
        )
          strong.scoreboard-list-gamerAnswers-item__letter {{ question.letter }}
          span.scoreboard-list-gamerAnswers-item__value
            kbd {{ question.answer }}
            span(v-if="getGamerAnswer({ item, question, questionIndex })?.isPassed") {{ $t('gameScene.pass').toLocaleUpperCase('tr') }}
            span(v-else-if="getGamerAnswer({ item, question, questionIndex })?.field?.length > 0")
              | {{ getGamerAnswer({ item, question, questionIndex })?.field?.toLocaleUpperCase('tr') }}
            span(v-else) -

      template(v-else)
        p {{ $t('general.noData') }}

    // InfiniteLoading(@infinite="handleInfiniteLoading")
</template>

<script>
import { defineComponent, useStore, ref, computed } from '@nuxtjs/composition-api'
import { Collapse, CollapseItem, Empty, Button } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

export default defineComponent({
  components: {
    Collapse,
    CollapseItem,
    Empty,
    Button,
    InfiniteLoading
  },
  props: {
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    // The reader's own standing, pinned above the list. The board pages 50 at a time, so a
    // player far down a busy room would have to scroll the whole thing to find themselves.
    currentPlayer: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useStore()

    const questions = computed(() => store.getters['creator/questions'])

    const toggledScoreItem = ref([0])
    const toggledSelfItem = ref([])

    // A player whose row is already loaded appears twice: pinned on top and in place.
    // Marking the in-place row keeps the repeat from reading as a glitch.
    const isSelfInline = item => Boolean(props.currentPlayer) && item.user?.id === props.currentPlayer.user?.id

    const handleInfiniteLoading = async $state => {
      await emit('on-infinite-loading', $state)
    }

    const handleClickUser = user => {
      if (!user?.id) return
      store.commit('profile/SET_PLAYER_ID', user.id)
      store.commit('profile/SET_PLAYER_USERNAME', user.username)
      store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
    }

    const getGamerAnswer = ({ item, question, questionIndex }) => {
      return item.results.gamersAnswers
        ?.filter(answer => {
          if (answer.question) {
            return answer.question.id === question.id
          } else {
            return answer.index === questionIndex
          }
        })
        .reverse()[0]
    }

    const getGamerAnswerClasses = answer => {
      if (answer && Object.keys(answer).length > 0) {
        if (answer.isCorrect) {
          return 'answer--correct'
        }

        if (answer.isWrong) {
          return 'answer--wrong'
        }

        if (answer.isPassed) {
          return 'answer--passed'
        }
      } else {
        return null
      }
    }

    return {
      questions,
      toggledScoreItem,
      toggledSelfItem,
      isSelfInline,
      handleInfiniteLoading,
      handleClickUser,
      getGamerAnswer,
      getGamerAnswerClasses
    }
  }
})
</script>

<style lang="scss" src="./ScoreboardList.component.scss"></style>
