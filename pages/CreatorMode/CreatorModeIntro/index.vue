<template lang="pug">
.page.creator-mode-intro-page
  .creator-mode-intro-page__inner
    p.creator-mode-intro-page__description(v-html="$t('creatorModeIntro.description')")
    .choose-list
      Button.choose-list-item(size="large" :to="localePath({ name: 'CreatorMode-CreatorModeRooms' })")
        span.choose-list-item__icon 📢
        | {{ $t('creatorModeIntro.list.rooms.title') }}
      Button.choose-list-item(auth-control size="large" :to="localePath({ name: 'CreatorMode-CreatorModeCompose' })")
        span.choose-list-item__icon ➕
        | {{ $t('creatorModeIntro.list.compose.title') }}
      Button.choose-list-item(auth-control size="large" :to="localePath({ name: 'CreatorMode-CreatorModeMyRooms' })")
        span.choose-list-item__icon 📌
        | {{ $t('creatorModeIntro.list.myRooms.title') }}
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.creatorModeQuizzes.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.creatorModeQuizzes.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.creatorModeQuizzes.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.creatorModeQuizzes.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeIntro.page.scss"></style>
