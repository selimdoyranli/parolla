<template lang="pug">
.page.community-page
  h2.community-page__title {{ $t('community.wizard.title') }}
  CommunityComposeForm(mode="create")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  // a sign-in-only form: nothing to index
  head() {
    return {
      title: `${this.$t('community.list.createButton')} - ${this.$t('seo.main.title')}`,
      meta: [{ hid: 'robots', name: 'robots', content: 'noindex,nofollow' }]
    }
  }
})
</script>

<style lang="scss" scoped>
.community-page {
  width: calc(100% - (var(--base-p-x) * 2));
  max-width: 640px;
  margin: var(--base-m-y) auto;

  &__title {
    color: var(--color-text-01);
  }

  &__danger {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-02);
  }
}
</style>
