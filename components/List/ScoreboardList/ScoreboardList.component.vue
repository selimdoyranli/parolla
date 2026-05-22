<template lang="pug">
Collapse.list.scoreboard-list(v-model="toggledScoreItem" accordion)
  CollapseItem.scoreboard-list-item(v-for="(item, index) in items" :key="index" :disabled="!item.results.gamersAnswers")
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
    }
  },
  setup(props, { emit }) {
    const store = useStore()

    const questions = computed(() => store.getters['creator/questions'])

    const toggledScoreItem = ref([0])

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
      handleInfiniteLoading,
      handleClickUser,
      getGamerAnswer,
      getGamerAnswerClasses
    }
  }
})
</script>

<style lang="scss" src="./ScoreboardList.component.scss"></style>
