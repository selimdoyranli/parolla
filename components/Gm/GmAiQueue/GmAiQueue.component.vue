<template lang="pug">
.gm-ai-queue
  span.gm-panel__itemsTitle {{ $t('gmPanel.ai.queue.title', { count: items.length }) }}
  CellGroup.gm-panel__group(inset)
    Cell(v-if="!items.length" icon="passed" :title="$t('gmPanel.ai.queue.empty')")
    Cell(
      v-for="item in items"
      :key="`${item.documentId}-${item.locale}`"
      :label="`${item.locale} · ${formatTime(item.enqueuedAt)}`"
      icon="clock-o"
      center
      :title="item.title || item.documentId"
    )
      template(#right-icon)
        Tag(:type="stepTagTypes[item.step]" round :plain="item.step === 'waiting'") {{ $t(`gmPanel.ai.queue.steps.${item.step}`) }}
</template>

<script>
import { defineComponent, useStore, ref, onMounted, onBeforeUnmount } from '@nuxtjs/composition-api'
import { CellGroup, Cell, Tag } from 'vant'

// The queue lives in Strapi's memory and drains in seconds, so poll while the page is open
const POLL_INTERVAL_MS = 5000

export default defineComponent({
  components: {
    CellGroup,
    Cell,
    Tag
  },
  setup() {
    const store = useStore()

    const items = ref([])
    let timer = null

    const fetchQueue = async () => {
      const { data } = await store.dispatch('gm/fetchAiQueue')

      if (data) items.value = data.data
    }

    const formatTime = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    onMounted(() => {
      fetchQueue()
      timer = setInterval(fetchQueue, POLL_INTERVAL_MS)
    })

    onBeforeUnmount(() => clearInterval(timer))

    return {
      items,
      stepTagTypes: { waiting: 'default', moderation: 'warning', tagging: 'primary' },
      formatTime
    }
  }
})
</script>
