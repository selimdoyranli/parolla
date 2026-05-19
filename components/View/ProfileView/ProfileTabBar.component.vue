<template lang="pug">
.profile-tab-bar
  Tabs.profile-tab-bar__tabs(
    type="line"
    :value="activeTabName"
    color="var(--color-brand-02)"
    line-width="32px"
    line-height="3px"
    background="transparent"
    title-active-color="var(--color-text-01)"
    title-inactive-color="var(--color-text-03)"
    :before-change="handleBeforeChange"
  )
    Tab(name="quizzes" :title="$t('profile.tabs.quizzes')")
    Tab(name="reviews" :title="$t('profile.tabs.reviews')")
    Tab(name="scores" :title="$t('profile.tabs.scores')")
</template>

<script>
import { defineComponent, computed, useRoute, useRouter, useContext } from '@nuxtjs/composition-api'
import { Tabs, Tab } from 'vant'

const NAME_TO_TAB = {
  'Profile-username': 'quizzes',
  'Profile-username-Quizzes': 'quizzes',
  'Profile-username-Reviews': 'reviews',
  'Profile-username-Scores': 'scores'
}

const TAB_TO_ROUTE = {
  quizzes: 'Profile-username-Quizzes',
  reviews: 'Profile-username-Reviews',
  scores: 'Profile-username-Scores'
}

export default defineComponent({
  components: {
    Tabs,
    Tab
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const { localePath } = useContext()

    const activeTabName = computed(() => {
      const baseName = stripLocaleSuffix(route.value.name || '')

      return NAME_TO_TAB[baseName] || 'quizzes'
    })

    const handleBeforeChange = name => {
      const target = TAB_TO_ROUTE[name]

      if (!target) return true
      router.push(localePath({ name: target, params: { username: props.username } }))

      return true
    }

    return {
      activeTabName,
      handleBeforeChange
    }
  }
})

function stripLocaleSuffix(name) {
  return name.replace(/___(tr|en)$/, '')
}
</script>

<style lang="scss" src="./ProfileTabBar.component.scss"></style>
