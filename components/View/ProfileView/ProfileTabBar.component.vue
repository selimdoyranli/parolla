<template lang="pug">
.profile-tab-bar
  .profile-tab-bar__list(role="tablist")
    NuxtLink.profile-tab-bar__tab(role="tab" :to="quizzesPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'quizzes' }")
      span.profile-tab-bar__tab-label {{ $t('profile.tabs.quizzes') }}

    NuxtLink.profile-tab-bar__tab(role="tab" :to="reviewsPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'reviews' }")
      span.profile-tab-bar__tab-label {{ $t('profile.tabs.reviews') }}

    NuxtLink.profile-tab-bar__tab(role="tab" :to="scoresPath" :class="{ 'profile-tab-bar__tab--active': activeTab === 'scores' }")
      span.profile-tab-bar__tab-label {{ $t('profile.tabs.scores') }}
</template>

<script>
import { defineComponent, computed, useRoute, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    username: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const { localePath } = useContext()

    const activeTab = computed(() => {
      const path = route.value.path || ''

      if (/\/(reviews|degerlendirmeler)\/?$/.test(path)) return 'reviews'

      if (/\/(scores|skorlar)\/?$/.test(path)) return 'scores'

      return 'quizzes'
    })

    const quizzesPath = computed(() => localePath({ name: 'Profile-username-Quizzes', params: { username: props.username } }))
    const reviewsPath = computed(() => localePath({ name: 'Profile-username-Reviews', params: { username: props.username } }))
    const scoresPath = computed(() => localePath({ name: 'Profile-username-Scores', params: { username: props.username } }))

    return {
      activeTab,
      quizzesPath,
      reviewsPath,
      scoresPath
    }
  }
})
</script>

<style lang="scss" src="./ProfileTabBar.component.scss"></style>
