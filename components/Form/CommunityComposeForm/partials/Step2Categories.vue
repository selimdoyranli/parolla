<template lang="pug">
//- same look as the quiz compose form's tag field (RoomBasicInfo)
div
  Field.community-compose-form__tagField(
    name="tag"
    :value="tagInput"
    :placeholder="$t('community.form.tags.placeholder')"
    show-word-limit
    :maxlength="COMMUNITY_TAG_MAX_LENGTH"
    @input="$emit('input-tag', $event)"
    @keydown.enter.prevent="$emit('add-tag')"
  )
    template(#label)
      | {{ $t('community.form.tags.label') }} &nbsp;
      small.community-compose-form__optionalHint {{ $t('form.optionalHint') }}
    template(#button)
      Button(
        type="info"
        native-type="button"
        round
        size="small"
        :aria-label="$t('community.form.tags.addButton')"
        :disabled="!tagInput || form.tags.length >= COMMUNITY_TAGS_MAX_LENGTH"
        @click="$emit('add-tag')"
      ) +
  .community-compose-form__tags(v-if="form.tags.length")
    Tag.community-compose-form__tag(v-for="tag in form.tags" :key="tag" type="primary" closeable @close="$emit('remove-tag', tag)") {{ tag }}
  p.community-compose-form__tagHint(v-else) {{ $t('community.form.tags.hint') }}
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
