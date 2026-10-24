<template lang="pug">
.community-compose-form__fields.community-compose-form__choices
  template(v-for="group in groups")
    span.community-compose-form__choicesTitle(:key="`${group.model}-title`") {{ $t(group.label) }}
    .community-compose-form__choiceGrid(
      :key="`${group.model}-grid`"
      role="radiogroup"
      :class="`community-compose-form__choiceGrid--${group.options.length}`"
    )
      button.room-choice.room-choice--tile(
        v-for="option in group.options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="String(form[group.model] === option.value)"
        :class="{ 'room-choice--selected': form[group.model] === option.value }"
        @click="form[group.model] = option.value"
      )
        span.room-choice__icon
          AppIcon(:name="option.icon" :width="20" :height="20")
        span.room-choice__body
          span.room-choice__name {{ $t(`${group.i18n}.${option.key}`) }}
          span.room-choice__description {{ $t(`${group.i18n}.${option.key}Description`) }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { communityVisibilityEnum, communityPostPermissionEnum } from '@/enums/community.enum'

// locale keys are camelCase, enum values snake_case
const groups = [
  {
    model: 'visibility',
    label: 'community.form.visibility.label',
    i18n: 'community.detail.visibility',
    options: [
      { value: communityVisibilityEnum.PUBLIC, key: 'public', icon: 'tabler:world' },
      { value: communityVisibilityEnum.RESTRICTED, key: 'restricted', icon: 'tabler:user-check' },
      { value: communityVisibilityEnum.PRIVATE, key: 'private', icon: 'tabler:lock' }
    ]
  },
  {
    model: 'postPermission',
    label: 'community.form.postPermission.label',
    i18n: 'community.detail.postPermission',
    options: [
      { value: communityPostPermissionEnum.EVERYONE, key: 'everyone', icon: 'tabler:users' },
      { value: communityPostPermissionEnum.MODS_ONLY, key: 'modsOnly', icon: 'tabler:shield' }
    ]
  }
]

export default defineComponent({
  name: 'Step3Settings',
  props: { form: { type: Object, required: true } },
  setup: () => ({ groups })
})
</script>
