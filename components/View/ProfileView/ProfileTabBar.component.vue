<template lang="pug">
.profile-tab-bar
  .profile-tab-bar__list(role="tablist")
    template(v-if="local")
      button.profile-tab-bar__tab(
        type="button"
        role="tab"
        :class="{ 'profile-tab-bar__tab--active': activeTab === 'quizzes' }"
        @click="changeTo('quizzes')"
      )
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.quizzes') }}

      button.profile-tab-bar__tab(
        type="button"
        role="tab"
        :class="{ 'profile-tab-bar__tab--active': activeTab === 'reviews' }"
        @click="changeTo('reviews')"
      )
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.reviews') }}

      button.profile-tab-bar__tab(
        type="button"
        role="tab"
        :class="{ 'profile-tab-bar__tab--active': activeTab === 'scores' }"
        @click="changeTo('scores')"
      )
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.scores') }}

    template(v-else)
      NuxtLink.profile-tab-bar__tab(role="tab" :to="quizzesPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'quizzes' }")
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.quizzes') }}

      NuxtLink.profile-tab-bar__tab(role="tab" :to="reviewsPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'reviews' }")
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.reviews') }}

      NuxtLink.profile-tab-bar__tab(role="tab" :to="scoresPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'scores' }")
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.scores') }}

      NuxtLink.profile-tab-bar__tab(
        v-if="showAchievements"
        role="tab"
        :to="achievementsPath"
        :class="{ 'profile-tab-bar__tab--active': activeTab === 'achievements' }"
      )
        span.profile-tab-bar__tab-label {{ $t('profile.tabs.achievements') }}
</template>

<script>
import { defineComponent, computed, useRoute, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  model: {
    prop: 'value',
    event: 'input'
  },
  props: {
    username: {
      type: String,
      required: true
    },
    showAchievements: {
      type: Boolean,
      required: false,
      default: false
    },
    local: {
      type: Boolean,
      required: false,
      default: false
    },
    value: {
      type: String,
      required: false,
      default: 'quizzes'
    }
  },
  setup(props, { emit }) {
    const route = useRoute()
    const { localePath } = useContext()

    const activeTab = computed(() => {
      if (props.local) return props.value || 'quizzes'

      const path = route.value.path || ''

      if (/\/(comments|yorumlar|reviews|degerlendirmeler)\/?$/.test(path)) return 'reviews'

      if (/\/(achievements|basarimlar)\/?$/.test(path)) return 'achievements'

      if (/\/(scores|skorlar)\/?$/.test(path)) return 'scores'

      return 'quizzes'
    })

    const quizzesPath = computed(() => localePath({ name: 'Profile-username-Quizzes', params: { username: props.username } }))
    const reviewsPath = computed(() => localePath({ name: 'Profile-username-Reviews', params: { username: props.username } }))
    const scoresPath = computed(() => localePath({ name: 'Profile-username-Scores', params: { username: props.username } }))

    const achievementsPath = computed(() => localePath({ name: 'Profile-username-Achievements', params: { username: props.username } }))

    const changeTo = name => {
      emit('input', name)
    }

    return {
      activeTab,
      quizzesPath,
      reviewsPath,
      scoresPath,
      achievementsPath,
      changeTo
    }
  }
})
</script>

<style lang="scss" src="./ProfileTabBar.component.scss"></style>
