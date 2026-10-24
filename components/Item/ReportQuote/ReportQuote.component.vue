<template lang="pug">
//- quotes the reported community or post at the top of ReportDialog (#prepend)
blockquote.report-quote
  template(v-if="post")
    PlayerAvatar(v-if="post.author" :user="post.author" :size="32")
    .report-quote__body
      strong.report-quote__title {{ post.author && post.author.username }}
        span.gm-username-extra(v-if="post.author?.role?.name === 'GM'") &nbsp;(GM)
      p.report-quote__content(v-if="post.note") {{ post.note }}
      span.report-quote__quiz(v-if="post.room")
        AppIcon(name="tabler:help-square-rounded" :width="14" :height="14")
        span.report-quote__quiz-title {{ post.room.title }}
  template(v-else-if="community")
    CommunityAvatar(:community="community" :size="32")
    .report-quote__body
      strong.report-quote__title {{ community.name }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ReportQuote',
  props: {
    community: { type: Object, required: false, default: null },
    post: { type: Object, required: false, default: null }
  }
})
</script>

<style lang="scss" src="./ReportQuote.component.scss"></style>
