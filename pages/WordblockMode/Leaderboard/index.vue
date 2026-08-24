<template lang="pug">
.page.leaderboard-page
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'
import { WORDBLOCK_AVAILABLE_LENGTHS } from '@/system/constant'

export default defineComponent({
  name: 'WordblockLeaderboardPage',
  setup() {
    const { i18n, localePath, redirect } = useContext()

    const pageTitle = `${i18n.t('leaderboard.modeTitle', {
      mode: i18n.t('introScene.modeList.wordblock.title')
    })} - ${i18n.t('seo.main.title')}`

    useMeta(() => ({
      title: pageTitle,
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: pageTitle
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: pageTitle
        }
      ]
    }))

    // Land on the shortest board's daily table
    redirect(
      localePath({
        name: 'WordblockMode-Leaderboard-charLength-period',
        params: { charLength: WORDBLOCK_AVAILABLE_LENGTHS[0], period: i18n.t('period.daily.slug') }
      })
    )
  },
  head: {}
})
</script>
