<template lang="pug">
article.legal-document
  h1.legal-document__title {{ doc.attributes.title }}
  p.legal-document__updated {{ $t('page.legal.updatedAt', { date: doc.attributes.updated }) }}
  .legal-document__body(v-html="doc.html")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    // Compiled markdown module from content/legal/** (frontmatter-markdown-loader):
    // { attributes: { title, description, updated }, html }
    doc: {
      type: Object,
      required: true
    }
  },
  setup() {}
})
</script>

<style lang="scss" src="./LegalDocument.component.scss"></style>
