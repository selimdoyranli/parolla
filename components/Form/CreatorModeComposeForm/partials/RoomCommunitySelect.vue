<template lang="pug">
.room-community-select.creator-mode-compose-form__fields(v-if="isVisible")
  Field.creator-mode-compose-form__community(
    name="community"
    :value="selectedName"
    :label="$t('form.creatorModeCompose.room.community.label')"
    is-link
    readonly
    :disabled="disabled"
    @click="isOpen = true"
  )

  p.creator-mode-compose-form__infoHint(v-if="isNotMember")
    | {{ $t('form.creatorModeCompose.room.community.notMemberWarning') }}

  Popup(v-model="isOpen" position="bottom" round)
    Picker(show-toolbar :columns="columns" :default-index="defaultIndex" @confirm="onConfirm" @cancel="isOpen = false")
</template>

<script>
import { defineComponent, computed, ref, useStore, useContext } from '@nuxtjs/composition-api'
import { Field, Popup, Picker } from 'vant'

export default defineComponent({
  name: 'RoomCommunitySelect',
  components: { Field, Popup, Picker },
  props: {
    value: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    room: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const { i18n } = useContext()
    const store = useStore()
    const isOpen = ref(false)

    const isLoggedIn = computed(() => !!store.getters['auth/user'])
    const postable = computed(() => store.getters['auth/postableCommunities'] || [])
    const linked = computed(() => props.room?.community || null)

    // The saved link may no longer be postable (left/blocked); keep it selectable so the value isn't lost
    const options = computed(() => {
      const list = postable.value.map(c => ({ text: c.name, value: c.documentId }))

      if (linked.value && !list.some(o => o.value === linked.value.documentId)) {
        list.unshift({ text: linked.value.name, value: linked.value.documentId })
      }

      return [{ text: i18n.t('form.creatorModeCompose.room.community.none'), value: null }, ...list]
    })

    const columns = computed(() => options.value.map(o => o.text))
    const isVisible = computed(() => isLoggedIn.value && (postable.value.length > 0 || !!linked.value))
    const defaultIndex = computed(() =>
      Math.max(
        0,
        options.value.findIndex(o => o.value === props.value)
      )
    )
    const selectedName = computed(() => options.value[defaultIndex.value].text)
    const isNotMember = computed(() => !!props.value && !postable.value.some(c => c.documentId === props.value))

    const onConfirm = (_, index) => {
      emit('input', options.value[index].value)
      isOpen.value = false
    }

    return { isOpen, isVisible, columns, defaultIndex, selectedName, isNotMember, onConfirm }
  }
})
</script>

<style lang="scss" scoped>
.creator-mode-compose-form__infoHint {
  margin: 8px 16px 0;
  padding: 8px 12px;
  color: var(--color-info-01);
  font-size: 13px;
  background-color: color-mix(in sRGB, var(--color-info-01) 10%, transparent);
  border-radius: calc(var(--border-radius-01) / 2);
}
</style>
