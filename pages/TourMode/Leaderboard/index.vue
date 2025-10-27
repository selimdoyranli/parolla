<template lang="pug">
.page.leaderboard-page
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'LeaderboardPage',
  setup() {
    const { i18n, localePath, redirect } = useContext()

    useMeta(() => ({
      title: `${i18n.t('leaderboard.modeTitle', {
        mode: i18n.t('introScene.modeList.tour.title')
      })} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('leaderboard.modeTitle', {
            mode: i18n.t('introScene.modeList.tour.title')
          })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t('leaderboard.modeTitle', {
            mode: i18n.t('introScene.modeList.tour.title')
          })} - ${i18n.t('seo.main.title')}`
        }
      ]
    }))

    redirect(localePath({ name: 'TourMode-Leaderboard-period', params: { period: i18n.t('period.daily.slug') } }))
  },
  head: {}
})
</script>
