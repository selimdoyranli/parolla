<template lang="pug">
//- guests see the composer as a teaser: any click asks them to sign in
form.community-post-composer(@click.capture="guardGuest" @submit.prevent="submit")
  Field.community-post-composer__field(
    v-model="content"
    type="textarea"
    :placeholder="$t(placeholderKey)"
    rows="2"
    autosize
    :aria-label="$t('community.post.composerLabel')"
    :maxlength="COMMUNITY_POST_NOTE_MAX_LENGTH"
    :readonly="!$auth.loggedIn"
    :disabled="isBusy || isLocked"
  )

  //- the picked quiz turns the post into a quiz share; the text above becomes its note
  .community-post-composer__picked(v-if="pickedRoom")
    QuizCover.community-post-composer__thumb(:room="pickedRoom")
      span.community-post-composer__initials(v-if="!pickedRoom.coverPhoto") {{ initialsOf(pickedRoom) }}
    .community-post-composer__room
      strong.community-post-composer__room-title {{ pickedRoom.title }}
      QuizTypeLabel(:room="pickedRoom")
    ActionButton(:label="$t('community.post.quizPicker.remove')" icon="tabler:x" :disabled="isBusy" @click="pickedRoom = null")

  .community-post-composer__picker(v-else-if="isPickerOpen")
    .community-post-composer__search
      label.community-post-composer__search-field
        AppIcon(name="tabler:search" :width="18" :height="18")
        input(
          ref="searchInput"
          v-model="keyword"
          type="search"
          :placeholder="$t('community.post.quizPicker.placeholder')"
          @input="onSearchInput"
          @keydown.enter.prevent
        )
      ActionButton(:label="$t('general.close')" icon="tabler:x" @click="closePicker")

    //- infinite-wrapper: the list scrolls on its own, not the page
    .community-post-composer__results(v-if="keyword.trim()" infinite-wrapper)
      button.community-post-composer__result(v-for="room in results" :key="room.documentId" type="button" @click="pick(room)")
        QuizCover.community-post-composer__thumb(:room="room")
          span.community-post-composer__initials(v-if="!room.coverPhoto") {{ initialsOf(room) }}
        span.community-post-composer__room
          strong.community-post-composer__room-title {{ room.title }}
          span.community-post-composer__room-meta
            QuizTypeLabel(:room="room")
            span.community-post-composer__creator
              PlayerAvatar(v-if="!room.isAnon && room.user" :user="room.user" :size="18")
              | {{ room.isAnon || !room.user ? $t('playIntro.anon') : room.user.username }}
              span.gm-username-extra(v-if="!room.isAnon && room.user?.role?.name === 'GM'") &nbsp;(GM)
      InfiniteLoading(force-use-infinite-wrapper :identifier="searchId" @infinite="loadMore")
        template(#spinner)
          Loading.community-post-composer__state(color="var(--color-brand-02)" size="20")
        template(#no-more)
          span
        template(#no-results)
          p.community-post-composer__state {{ $t('community.post.quizPicker.empty') }}
        template(#error="{ trigger }")
          p.community-post-composer__state
            | {{ $t('community.error.generic') }}
            button.community-post-composer__retry(type="button" @click="trigger") {{ $t('error.tryAgain') }}

  .community-post-composer__footer
    ActionButton.community-post-composer__quiz-toggle(
      :label="$t('community.post.quizPicker.open')"
      icon="tabler:trophy"
      :active="isPickerOpen || !!pickedRoom"
      :disabled="isBusy || isLocked"
      @click="togglePicker"
    )
    span.community-post-composer__counter(:class="{ 'is-full': content.length >= COMMUNITY_POST_NOTE_MAX_LENGTH }")
      | {{ content.length }}/{{ COMMUNITY_POST_NOTE_MAX_LENGTH }}
    Button.community-post-composer__submit(
      color="var(--color-brand-02)"
      size="small"
      native-type="submit"
      :loading="isBusy"
      :disabled="!canSubmit"
    )
      AppIcon(name="tabler:send" :width="16" :height="16")
      span {{ $t('community.post.publish') }}
</template>

<script>
import { defineComponent, ref, computed, nextTick, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import { Field, Button, Loading, Notify } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { COMMUNITY_POST_NOTE_MAX_LENGTH } from '@/enums/community.enum'
import { getInitials } from '@/transformers/community.transformer'

export default defineComponent({
  components: { Field, Button, Loading, InfiniteLoading },
  props: {
    communityDocumentId: { type: String, required: true },
    // i18n key: shown read-only so viewers learn why they can't post here
    lockedReason: { type: String, default: null }
  },
  // posted: the created post
  emits: ['posted'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const guardGuest = event => {
      if ($auth.loggedIn) return

      event.preventDefault()
      event.stopPropagation()
      store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)
    }
    const { censorBadwords } = useCensorBadwords()

    const content = ref('')
    const isBusy = ref(false)
    const pickedRoom = ref(null)
    const searchInput = ref(null)

    const isPickerOpen = ref(false)
    const keyword = ref('')
    const results = ref([])
    const page = ref(0)
    // bumping it resets InfiniteLoading for a new search
    const searchId = ref(0)
    let searchTimer = null

    const initialsOf = room => getInitials(room.title)

    // guests stay clickable (the field is readonly for them) so any click still opens sign-in
    const isLocked = computed(() => Boolean(props.lockedReason) && $auth.loggedIn)

    const placeholderKey = computed(() => {
      if (props.lockedReason) return props.lockedReason

      return pickedRoom.value ? 'community.post.quizPicker.notePlaceholder' : 'community.post.composerPlaceholder'
    })

    const canSubmit = computed(() => {
      const length = content.value.trim().length

      if (isBusy.value || props.lockedReason || length > COMMUNITY_POST_NOTE_MAX_LENGTH) return false

      // a quiz share may go without a note; a text post needs text
      return Boolean(pickedRoom.value) || length > 0
    })

    const resetSearch = () => {
      results.value = []
      page.value = 0
      searchId.value++
    }

    const onSearchInput = () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(resetSearch, 300)
    }

    onBeforeUnmount(() => clearTimeout(searchTimer))

    const loadMore = async $state => {
      const id = searchId.value
      const { data, error } = await store.dispatch('community/searchRooms', { keyword: keyword.value.trim(), page: page.value + 1 })

      // a newer search took over while this page was loading
      if (id !== searchId.value) return

      if (error || !data) return $state.error()

      const seen = new Set(results.value.map(room => room.documentId))

      results.value.push(...data.items.filter(room => !seen.has(room.documentId)))
      page.value++
      $state.loaded()

      if (!data.hasMore) $state.complete()
    }

    const closePicker = () => {
      isPickerOpen.value = false
      keyword.value = ''
      resetSearch()
    }

    const togglePicker = async () => {
      if (isPickerOpen.value || pickedRoom.value) {
        pickedRoom.value = null

        return closePicker()
      }

      isPickerOpen.value = true
      await nextTick()
      searchInput.value?.focus()
    }

    const pick = room => {
      pickedRoom.value = room
      closePicker()
    }

    const submit = async () => {
      if (!canSubmit.value) return

      isBusy.value = true
      const note = censorBadwords(content.value.trim())
      const { data, error } = await store.dispatch(
        'community/createPost',
        pickedRoom.value
          ? { communityDocumentId: props.communityDocumentId, roomDocumentId: pickedRoom.value.documentId, note }
          : { communityDocumentId: props.communityDocumentId, type: 'text', note }
      )
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
      pickedRoom.value = null
      emit('posted', data)
    }

    return {
      COMMUNITY_POST_NOTE_MAX_LENGTH,
      guardGuest,
      content,
      isBusy,
      isLocked,
      placeholderKey,
      canSubmit,
      submit,
      pickedRoom,
      searchInput,
      isPickerOpen,
      keyword,
      results,
      searchId,
      initialsOf,
      onSearchInput,
      loadMore,
      closePicker,
      togglePicker,
      pick
    }
  }
})
</script>

<style lang="scss" src="./CommunityPostComposer.component.scss"></style>
