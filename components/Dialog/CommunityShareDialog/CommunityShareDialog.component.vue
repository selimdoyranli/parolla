<template lang="pug">
Dialog.dialog.community-share-dialog(
  :value="isOpen"
  close-on-click-overlay
  get-container="body"
  :title="$t('community.post.shareTitle')"
  :show-confirm-button="false"
  :show-cancel-button="false"
  width="min(92vw, 440px)"
  @input="$emit('update:isOpen', $event)"
  @open="onOpen"
)
  .community-share-dialog__content
    Loading.community-share-dialog__loading(v-if="isLoading" color="var(--color-brand-02)" size="24")
    RadioGroup(v-else v-model="selected")
      CellGroup.community-share-dialog__list(inset)
        Cell.community-share-dialog__item(
          v-for="community in communities"
          :key="community.documentId"
          center
          :clickable="!isShared(community)"
          :class="{ 'community-share-dialog__item--shared': isShared(community) }"
          @click="pick(community)"
        )
          template(#icon)
            CommunityAvatar.community-share-dialog__avatar(:community="community" :size="36")
          template(#title)
            span.community-share-dialog__name {{ community.name }}
          template(#right-icon)
            Tag(v-if="isShared(community)" type="success" plain round) {{ $t('community.post.sharedBadge') }}
            Radio(v-else :name="community.documentId")

    Field.community-share-dialog__note(
      v-model="note"
      type="textarea"
      :placeholder="$t('community.post.notePlaceholder')"
      rows="2"
      autosize
      show-word-limit
      :maxlength="COMMUNITY_POST_NOTE_MAX_LENGTH"
      :disabled="isBusy"
    )

    NuxtLink.community-share-dialog__postLink(v-if="postLink" :to="postLink" @click.native="$emit('update:isOpen', false)")
      | {{ $t('community.post.goToPost') }}

    .community-share-dialog__actions
      Button.community-share-dialog__close(round native-type="button" :disabled="isBusy" @click="$emit('update:isOpen', false)")
        | {{ $t('general.close') }}
      Button.community-share-dialog__submit(
        type="primary"
        round
        native-type="button"
        :loading="isBusy"
        :disabled="!selected"
        @click="share"
      )
        | {{ $t('community.post.share') }}
</template>

<script>
import { defineComponent, ref, computed, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, RadioGroup, Radio, CellGroup, Cell, Field, Button, Tag, Loading, Notify } from 'vant'
import { communityTransformer } from '@/transformers'
import { COMMUNITY_POST_NOTE_MAX_LENGTH } from '@/enums/community.enum'

export default defineComponent({
  name: 'CommunityShareDialog',
  components: { Dialog: Dialog.Component, RadioGroup, Radio, CellGroup, Cell, Field, Button, Tag, Loading },
  props: {
    isOpen: { type: Boolean, default: false },
    room: { type: Object, required: true }
  },
  setup(props) {
    const store = useStore()
    const { i18n, localePath } = useContext()

    const isLoading = ref(false)
    const isBusy = ref(false)
    const selected = ref(null)
    const note = ref('')
    const sharedIds = ref([])
    const postLink = ref(null)

    // me items are raw: the transformer adds the avatar initials
    const communities = computed(() => (store.getters['auth/postableCommunities'] || []).map(communityTransformer))
    const isShared = community => sharedIds.value.includes(community.documentId)

    const pick = community => {
      if (!isShared(community)) selected.value = community.documentId
    }

    const onOpen = async () => {
      selected.value = null
      note.value = ''
      postLink.value = null
      isLoading.value = true

      const { data } = await store.dispatch('community/fetchSharedIn', { roomDocumentId: props.room.documentId })

      sharedIds.value = data?.communityDocumentIds || []
      isLoading.value = false
    }

    const share = async () => {
      if (isBusy.value || !selected.value) return

      isBusy.value = true

      const community = communities.value.find(c => c.documentId === selected.value)
      const { data, error } = await store.dispatch('community/createPost', {
        communityDocumentId: selected.value,
        roomDocumentId: props.room.documentId,
        note: note.value.trim()
      })

      isBusy.value = false

      if (error || !data) {
        Notify({ message: error?.message || i18n.t('community.error.generic'), type: 'danger' })

        return
      }

      sharedIds.value = [...sharedIds.value, selected.value]
      selected.value = null
      note.value = ''
      postLink.value = localePath({
        name: 'Community-CommunityPost-slug-postId',
        params: { slug: community.slug, postId: data.documentId }
      })
      Notify({ message: i18n.t('community.post.shared'), type: 'success' })
    }

    return { COMMUNITY_POST_NOTE_MAX_LENGTH, isLoading, isBusy, selected, note, communities, isShared, pick, onOpen, share, postLink }
  }
})
</script>

<style lang="scss" src="./CommunityShareDialog.component.scss"></style>
