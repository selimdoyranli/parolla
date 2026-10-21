<template lang="pug">
.street-view-panorama
  iframe.street-view-panorama__frame(
    :key="panoId"
    :src="embedUrl"
    allow="accelerometer; gyroscope; fullscreen"
    referrerpolicy="no-referrer-when-downgrade"
    :title="$t('geoGuessMode.panoramaTitle')"
    @load="isLoading = false"
  )

  .street-view-panorama__loading(v-if="isLoading")
    Loading(type="spinner" color="var(--color-brand-02)")
</template>

<script>
import { defineComponent, ref, computed, watch } from '@nuxtjs/composition-api'
import { Loading } from 'vant'
import { buildPanoramaEmbedUrl } from '@/services/streetView.service'

export default defineComponent({
  components: {
    Loading
  },
  props: {
    panoId: {
      type: String,
      required: true
    },
    heading: {
      type: Number,
      required: false,
      default: 0
    }
  },
  setup(props) {
    const isLoading = ref(true)
    const embedUrl = computed(() => buildPanoramaEmbedUrl({ panoId: props.panoId, heading: props.heading }))

    watch(
      () => props.panoId,
      () => {
        isLoading.value = true
      }
    )

    return {
      isLoading,
      embedUrl
    }
  }
})
</script>

<style lang="scss" src="./StreetViewPanorama.component.scss"></style>
