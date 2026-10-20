<template lang="pug">
//- compact horizontal unit for tight spaces (inventory dialog tabs, lists): one short row, label shows until it fills
.inline-ad
  small.inline-ad__label {{ $t('general.ad') }}
  AppAd(format="horizontal" :data-ad-slot="6048083070")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({})
</script>

<style lang="scss" src="./InlineAd.component.scss"></style>
