<template lang="pug">
.community-compose-form__fields
  Field(
    v-model="form.name"
    name="name"
    :label="$t('community.form.name.label')"
    :placeholder="$t('community.form.name.placeholder')"
    show-word-limit
    :maxlength="COMMUNITY_NAME_MAX_LENGTH"
    :error-message="form.name ? nameError : ''"
  )
  Field(v-if="community" :value="community.slug" :label="$t('community.edit.slug')" readonly disabled)
  Field.community-compose-form__fullLabel(
    v-model="form.description"
    name="description"
    type="textarea"
    :placeholder="$t('community.form.description.placeholder')"
    autosize
    show-word-limit
    :error-message="descriptionError"
    :maxlength="COMMUNITY_DESCRIPTION_MAX_LENGTH"
  )
    template(#label)
      | {{ $t('community.form.description.label') }} &nbsp;
      small.community-compose-form__optionalHint {{ $t('form.optionalHint') }}
  //- tags
  slot
  MediaPicker(field="avatar" shape="avatar" :media="media" :current="community && community.avatar")
  MediaPicker(field="coverPhoto" shape="cover" :media="media" :current="community && community.coverPhoto")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Field } from 'vant'
import { COMMUNITY_NAME_MAX_LENGTH, COMMUNITY_DESCRIPTION_MAX_LENGTH } from '@/enums/community.enum'
import MediaPicker from './MediaPicker.vue'

export default defineComponent({
  name: 'Step1Foundations',
  components: { Field, MediaPicker },
  props: {
    form: { type: Object, required: true },
    media: { type: Object, required: true },
    community: { type: Object, default: null },
    nameError: { type: String, default: '' },
    descriptionError: { type: String, default: '' }
  },
  setup: () => ({ COMMUNITY_NAME_MAX_LENGTH, COMMUNITY_DESCRIPTION_MAX_LENGTH })
})
</script>
