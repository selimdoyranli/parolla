<template lang="pug">
.room-community-select(v-if="isVisible")
  Cell.creator-mode-compose-form__community(
    :value="selectedName"
    is-link
    :title="$t('form.creatorModeCompose.room.community.label')"
    @click="isOpen = !disabled"
  )

  //- private only gates the community feed; the quiz's own listing still applies
  p.creator-mode-compose-form__infoHint(v-if="isPrivateListed")
    | {{ $t('form.creatorModeCompose.room.community.privateListedHint') }}

  Popup(v-model="isOpen" position="bottom" round)
    Picker(show-toolbar :columns="columns" :default-index="defaultIndex" @confirm="onConfirm" @cancel="isOpen = false")
</template>

<script>
import { defineComponent, computed, ref, onMounted, useStore, useContext } from '@nuxtjs/composition-api'
import { Cell, Popup, Picker } from 'vant'
import { communityVisibilityEnum } from '@/enums/community.enum'

export default defineComponent({
  name: 'RoomCommunitySelect',
  components: { Cell, Popup, Picker },
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
    },
    // the quiz is set to "public": a private community would still see it in the public list
    isListed: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const { i18n } = useContext()
    const store = useStore()
    const isOpen = ref(false)

    const isLoggedIn = computed(() => !!store.getters['auth/user'])
    const postable = computed(() => store.getters['auth/postableCommunities'] || [])

    const options = computed(() => [
      { text: i18n.t('form.creatorModeCompose.room.community.none'), value: null },
      ...postable.value.map(c => ({ text: c.name, value: c.documentId }))
    ])

    const columns = computed(() => options.value.map(o => o.text))
    const isVisible = computed(() => isLoggedIn.value && postable.value.length > 0)
    const defaultIndex = computed(() =>
      Math.max(
        0,
        options.value.findIndex(o => o.value === props.value)
      )
    )
    const selectedName = computed(() => options.value[defaultIndex.value].text)
    const selected = computed(() => postable.value.find(c => c.documentId === props.value))
    const isPrivateListed = computed(() => props.isListed && selected.value?.visibility === communityVisibilityEnum.PRIVATE)

    // edit: preselect the first of my communities that already holds this quiz (re-saving it there is a no-op)
    onMounted(async () => {
      if (!isVisible.value || !props.room?.documentId) return

      const { data } = await store.dispatch('community/fetchSharedIn', { roomDocumentId: props.room.documentId })
      const first = (data?.communityDocumentIds || []).find(id => postable.value.some(c => c.documentId === id))

      // the user may have picked one while this was loading
      if (first && !props.value) emit('input', first)
    })

    const onConfirm = (_, index) => {
      emit('input', options.value[index].value)
      isOpen.value = false
    }

    return { isOpen, isVisible, columns, defaultIndex, selectedName, isPrivateListed, onConfirm }
  }
})
</script>

<style lang="scss" scoped>
.creator-mode-compose-form__infoHint {
  margin: 8px 16px;
  padding: 8px 12px;
  color: var(--color-info-01);
  font-size: 13px;
  background-color: color-mix(in sRGB, var(--color-info-01) 10%, transparent);
  border-radius: calc(var(--border-radius-01) / 2);
}
</style>
