<template lang="pug">
.room-featured-tag-list(ref="rootRef")
  .room-featured-tag-list__inner
    .room-featured-tag-list__tags
      template(v-for="tag in tags")
        Tag.room-featured-tag-list-tag(
          :key="tag.title"
          type="primary"
          :class="[getTagActiveClass(tag)]"
          @click.stop.prevent.capture="handleTagClick(tag)"
        )
          AppIcon.room-featured-tag-list-tag__icon(:name="tag.icon" :width="16" :height="16")
          span.room-featured-tag-list-tag__title {{ tag.title }}
</template>

<script>
import { defineComponent, useContext, ref } from '@nuxtjs/composition-api'
import { Tag } from 'vant'
import { ROOM_FEATURED_TAGS } from '@/system/constant'

export default defineComponent({
  components: {
    Tag
  },
  setup(props, { emit }) {
    const { route, i18n } = useContext()

    const rootRef = ref(null)

    const handleTagClick = value => {
      emit('on-tag-click', value)
    }

    const getTagActiveClass = tag => {
      const currentTags = route.value.query.tags?.toLocaleLowerCase(i18n.locale)

      // If there are no tags in the query or it's null, "Tümü" should be active
      if (!currentTags && tag.tagsFilter === null) {
        return 'room-featured-tag-list-tag--active'
      }

      // If there are tags in the query, make the matching one active
      if (currentTags === tag.tagsFilter?.toLocaleLowerCase(i18n.locale)) {
        return 'room-featured-tag-list-tag--active'
      }
    }

    return {
      rootRef,
      tags: ROOM_FEATURED_TAGS,
      handleTagClick,
      getTagActiveClass
    }
  }
})
</script>

<style lang="scss" src="./RoomFeaturedTagList.component.scss"></style>
