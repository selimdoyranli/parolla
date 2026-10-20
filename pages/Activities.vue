<template lang="pug">
.page.activities-page
  h1.activities-page__title {{ $t('activities.title') }}

  //- same look as the profile tab bar
  .profile-tab-bar
    .profile-tab-bar__list(role="tablist")
      NuxtLink.profile-tab-bar__tab(
        v-for="tab in tabs"
        :key="tab.name"
        role="tab"
        active-class="profile-tab-bar__tab--active"
        :to="localePath({ name: tab.name })"
      )
        span.profile-tab-bar__tab-label {{ $t(tab.label) }}

  nuxt-child(:key="$route.fullPath")
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  // only the viewer's own data: guests go home with the login dialog
  middleware: ['auth-control'],
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({ title: `${i18n.t('activities.title')} - ${i18n.t('seo.main.title')}` }))

    const tabs = [
      { name: 'Activities-Likes', label: 'activities.tabs.likes' },
      { name: 'Activities-Comments', label: 'activities.tabs.comments' },
      { name: 'Activities-GoldHistory', label: 'activities.tabs.goldHistory' }
    ]

    return { tabs }
  },
  head: {}
})
</script>

<style lang="scss" src="./Activities.page.scss"></style>
