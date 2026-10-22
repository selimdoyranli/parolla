<template lang="pug">
.community-compose-form__section
  label {{ $t('community.form.visibility.label') }}
  RadioGroup(v-model="form.visibility")
    Cell(v-for="value in visibilities" :key="value" clickable @click="form.visibility = value")
      template(#title)
        | {{ $t(`community.detail.visibility.${value}`) }}
        small.community-compose-form__option-description {{ $t(`community.detail.visibility.${value}Description`) }}
      template(#right-icon)
        Radio(:name="value")
  label {{ $t('community.form.postPermission.label') }}
  RadioGroup(v-model="form.postPermission")
    Cell(v-for="item in postPermissions" :key="item.value" clickable @click="form.postPermission = item.value")
      template(#title)
        | {{ $t(`community.detail.postPermission.${item.key}`) }}
        small.community-compose-form__option-description {{ $t(`community.detail.postPermission.${item.key}Description`) }}
      template(#right-icon)
        Radio(:name="item.value")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Cell, RadioGroup, Radio } from 'vant'
import { communityVisibilityEnum, communityPostPermissionEnum } from '@/enums/community.enum'

export default defineComponent({
  name: 'Step3Settings',
  components: { Cell, RadioGroup, Radio },
  props: { form: { type: Object, required: true } },
  setup: () => ({
    visibilities: Object.values(communityVisibilityEnum),
    // locale keys are camelCase, enum values snake_case
    postPermissions: [
      { value: communityPostPermissionEnum.EVERYONE, key: 'everyone' },
      { value: communityPostPermissionEnum.MODS_ONLY, key: 'modsOnly' }
    ]
  })
})
</script>
