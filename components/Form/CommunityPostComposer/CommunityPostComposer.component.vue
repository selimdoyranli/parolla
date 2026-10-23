<template lang="pug">
form.community-post-composer(@submit.prevent="submit")
  Field.community-post-composer__field(
    v-model="content"
    type="textarea"
    :placeholder="$t('community.post.composerPlaceholder')"
    rows="2"
    autosize
    :aria-label="$t('community.post.composerLabel')"
    :maxlength="COMMUNITY_POST_NOTE_MAX_LENGTH"
    :disabled="isBusy"
  )
  .community-post-composer__footer
    span.community-post-composer__counter(:class="{ 'is-full': content.length >= COMMUNITY_POST_NOTE_MAX_LENGTH }")
      | {{ content.length }}/{{ COMMUNITY_POST_NOTE_MAX_LENGTH }}
    Button.community-post-composer__submit(type="primary" size="small" native-type="submit" :loading="isBusy" :disabled="!canSubmit")
      AppIcon(name="tabler:send" :width="16" :height="16")
      span {{ $t('community.post.publish') }}
</template>

<script>
import { defineComponent, ref, computed, useStore, useContext } from '@nuxtjs/composition-api'
import { Field, Button, Notify } from 'vant'
import { COMMUNITY_POST_NOTE_MAX_LENGTH } from '@/enums/community.enum'

export default defineComponent({
  components: { Field, Button },
  props: {
    communityDocumentId: { type: String, required: true }
  },
  // posted: the created post
  emits: ['posted'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const { censorBadwords } = useCensorBadwords()

    const content = ref('')
    const isBusy = ref(false)

    const canSubmit = computed(() => {
      const length = content.value.trim().length

      return !isBusy.value && length > 0 && length <= COMMUNITY_POST_NOTE_MAX_LENGTH
    })

    const submit = async () => {
      if (!canSubmit.value) return

      isBusy.value = true
      const { data, error } = await store.dispatch('community/createPost', {
        communityDocumentId: props.communityDocumentId,
        type: 'text',
        note: censorBadwords(content.value.trim())
      })
      isBusy.value = false

      if (error || !data) {
        return Notify({
          message: error?.message || i18n.t('community.error.generic'),
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 3000
        })
      }

      content.value = ''
      emit('posted', data)
    }

    return { COMMUNITY_POST_NOTE_MAX_LENGTH, content, isBusy, canSubmit, submit }
  }
})
</script>

<style lang="scss" src="./CommunityPostComposer.component.scss"></style>
