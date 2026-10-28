<template lang="pug">
.donate-content
  .donate-content-cover
    img.donate-content-cover__logo(src="/img/core/logo.webp" alt="parolla" width="72" height="72")
    strong.donate-content-cover__title {{ $t('dialog.donate.cover.title') }}&nbsp;☕
    span.donate-content-cover__subtitle {{ $t('dialog.donate.cover.subtitle') }}
    .donate-content-cover__pills
      span.donate-content-cover__pill.donate-content-cover__pill--word {{ $t('dialog.donate.cover.wordGame') }}
      span.donate-content-cover__pill.donate-content-cover__pill--quiz {{ $t('dialog.donate.cover.quiz') }}

  .donate-content-guide
    p.donate-content-guide__intro {{ $t('dialog.donate.guide.intro') }}
    ol.donate-content-guide__list
      li.donate-content-guide__item(v-for="(step, index) in steps" :key="step.key")
        span.donate-content-guide__number {{ index + 1 }}
        .donate-content-guide__body
          span.donate-content-guide__field(:class="`donate-content-guide__field--${step.key}`")
            | {{ step.field }}
          span.donate-content-guide__text {{ $t(`dialog.donate.guide.${step.key}`) }}

  // stays pinned to the dialog's bottom while the guide scrolls behind it
  .donate-content__cta
    a.donate-content__button(rel="noopener" :href="DONATE_URL" target="_blank")
      AppIcon(name="tabler:heart-filled" color="currentColor" :width="22" :height="22")
      span {{ $t('dialog.donate.cta') }}
      span.donate-content__sparkle(v-for="n in 3" :key="n" aria-hidden="true" :class="`donate-content__sparkle--${n}`")
        AppIcon(name="tabler:sparkles" color="currentColor" :width="14" :height="14")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

const DONATE_URL = 'https://www.buymeacoffee.com/parollaapp'

// field labels stay in English: they mirror the Buy Me a Coffee form the supporter will see
const STEPS = [
  { key: 'amount', field: 'Enter amount' },
  { key: 'name', field: 'Name or @yoursocial' },
  { key: 'message', field: 'Say something nice...' },
  { key: 'support', field: 'Support' }
]

// cover + call to support + Buy Me a Coffee walkthrough; shared by DonateDialog and CreditsDialog
export default defineComponent({
  name: 'DonateContent',
  setup() {
    return { DONATE_URL, steps: STEPS }
  }
})
</script>

<style lang="scss" src="./DonateContent.scss"></style>
