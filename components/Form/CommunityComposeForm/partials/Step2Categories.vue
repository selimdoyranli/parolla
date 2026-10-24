<template lang="pug">
div
  Field(
    name="tag"
    :value="tagInput"
    :label="$t('community.form.tags.label')"
    :placeholder="$t('community.form.tags.placeholder')"
    :maxlength="COMMUNITY_TAG_MAX_LENGTH"
    @input="$emit('input-tag', $event)"
    @keydown.enter.prevent="$emit('add-tag')"
  )
    template(#button)
      Button(
        type="info"
        native-type="button"
        round
        size="small"
        :disabled="!tagInput || form.tags.length >= COMMUNITY_TAGS_MAX_LENGTH"
        @click="$emit('add-tag')"
      ) {{ $t('community.form.tags.addButton') }}
  .community-compose-form__tags(v-if="form.tags.length")
    Tag(v-for="tag in form.tags" :key="tag" type="primary" closeable @close="$emit('remove-tag', tag)") {{ tag }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Field, Button, Tag } from 'vant'
import { COMMUNITY_TAGS_MAX_LENGTH, COMMUNITY_TAG_MAX_LENGTH } from '@/enums/community.enum'

export default defineComponent({
  name: 'Step2Categories',
  components: { Field, Button, Tag },
  props: {
    form: { type: Object, required: true },
    tagInput: { type: String, default: '' }
  },
  setup: () => ({ COMMUNITY_TAGS_MAX_LENGTH, COMMUNITY_TAG_MAX_LENGTH })
})
</script>
