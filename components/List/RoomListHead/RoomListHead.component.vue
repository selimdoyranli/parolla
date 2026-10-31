<template lang="pug">
//- quiz list head: title + count, refresh, quiz-type filter, sort (quizzes page and the party add-game dialog)
.room-list-head
  h3.room-list-head__title {{ $t('creatorModeRooms.rooms.selectFromList') }} ({{ total }})
  .room-list-head__actions
    Button.room-list-head__refresh.me-1(icon="replay" size="small" round @click="$emit('refresh')")
      | {{ $t('creatorModeRooms.rooms.refresh') }}
    FilterDropdown.room-list-head__kindFilter(
      :trigger-title="$t('creatorModeRooms.rooms.quizKind.title')"
      :selected="selectedKindOption"
      :options="kindOptions"
      @on-select-option="option => $emit('kind', option.key)"
    )
      template(#selected="{ option }")
        QuizTypeLabel(v-if="option.key" :kind="option.key")
        template(v-else)
          AppIcon.filter-dropdown-trigger-button__icon(:name="option.icon")
          span.filter-dropdown-trigger-button__title {{ option.label }}
      template(#option="{ option }")
        QuizTypeLabel(v-if="option.key" :kind="option.key")
        template(v-else)
          AppIcon.filter-dropdown-nav-item__icon(:name="option.icon" :width="20" :height="20")
          span.filter-dropdown-nav-item__title {{ option.label }}
    FilterDropdown.room-list-head__sortFilter.ms-1(
      :trigger-title="$t('creatorModeRooms.rooms.filters.title')"
      :options="sortOptions"
      @on-select-option="option => $emit('sort', option.key)"
    )
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: { Button },
  props: {
    total: { type: Number, default: 0 },
    // quiz kinds to offer after "all" (null)
    kinds: { type: Array, default: () => ['qa', 'media', 'choices', 'trivia', 'flashcards'] },
    kind: { type: String, default: null }
  },
  emits: ['refresh', 'kind', 'sort'],
  setup(props) {
    const { i18n } = useContext()

    const kindOptions = computed(() => [
      { key: null, label: i18n.t('creatorModeRooms.rooms.quizKind.all'), icon: 'tabler:category' },
      ...props.kinds.map(key => ({ key }))
    ])
    // always an option (null kind → "all"): with no selection FilterDropdown falls back to the first pick it saw
    const selectedKindOption = computed(() => kindOptions.value.find(option => option.key === props.kind))

    const sortOptions = computed(() => [
      { key: 'recently', label: i18n.t('creatorModeRooms.rooms.filters.recently'), icon: 'tabler:clock-up' },
      { key: 'byViewCount', label: i18n.t('creatorModeRooms.rooms.filters.byViewCount'), icon: 'tabler:chevrons-up' },
      { key: 'oldest', label: i18n.t('creatorModeRooms.rooms.filters.oldest'), icon: 'tabler:clock-down' }
    ])

    return { kindOptions, selectedKindOption, sortOptions }
  }
})
</script>

<style lang="scss" src="./RoomListHead.component.scss"></style>
