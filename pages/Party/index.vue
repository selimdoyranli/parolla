<template lang="pug">
.page.party-page
  //- hero: what a party is + the code entry (most visitors land here from a friend's link or code)
  section.party-hero
    span.party-hero__eyebrow
      AppIcon(name="tabler:confetti" :width="14" :height="14")
      | {{ $t('party.landing.eyebrow') }}
    h1.party-hero__title {{ $t('party.landing.title') }}
    p.party-hero__sub {{ $t('party.landing.sub') }}

    form.party-entry(@submit.prevent="join")
      label.party-entry__label(for="party-code") {{ $t('party.entry.title') }}
      p.party-entry__hint {{ $t('party.entry.hint') }}
      .party-entry__row
        input#party-code.party-entry__input(
          v-model="code"
          :placeholder="$t('party.entry.placeholder')"
          inputmode="numeric"
          autocomplete="off"
          maxlength="7"
          @input="format"
        )
        Button.party-entry__join(type="primary" round native-type="submit" :disabled="digits.length !== 6") {{ $t('party.entry.join') }}

    ul.party-hero__facts
      li(v-for="fact in facts" :key="fact.key")
        AppIcon(:name="fact.icon" :width="16" :height="16")
        | {{ $t(`party.landing.facts.${fact.key}`) }}

  section.party-section
    h2.party-section__title {{ $t('party.landing.stepsTitle') }}
    ol.party-steps
      li.party-steps__item(v-for="(step, index) in steps" :key="step")
        span.party-steps__num {{ index + 1 }}
        div
          strong {{ $t(`party.landing.steps.${step}.title`) }}
          p {{ $t(`party.landing.steps.${step}.text`) }}

  section.party-section
    h2.party-section__title {{ $t('party.landing.featuresTitle') }}
    ul.party-features
      li.party-features__item(v-for="feature in features" :key="feature.key")
        span.party-features__icon
          AppIcon(:name="feature.icon" :width="20" :height="20")
        strong {{ $t(`party.landing.features.${feature.key}.title`) }}
        p {{ $t(`party.landing.features.${feature.key}.text`) }}

  section.party-cta
    h2.party-cta__title {{ $t('party.landing.ctaTitle') }}
    p.party-cta__sub {{ $t('party.landing.ctaSub') }}
    nuxt-link.party-cta__button(:to="localePath({ name: 'CreatorMode-CreatorModeRooms' })")
      AppIcon(name="tabler:list-search" :width="18" :height="18")
      | {{ $t('party.landing.cta') }}
</template>

<script>
import { defineComponent, ref, computed, useContext, useRouter, useMeta } from '@nuxtjs/composition-api'
import { Button } from 'vant'

// only what party rooms actually do (parolla-ws src/channels/party)
const FACTS = [
  { key: 'players', icon: 'tabler:users' },
  { key: 'live', icon: 'tabler:bolt' },
  { key: 'noSignup', icon: 'tabler:user-check' }
]
const STEPS = ['pick', 'setup', 'share']
const FEATURES = [
  { key: 'presentation', icon: 'tabler:presentation' },
  { key: 'remote', icon: 'tabler:device-mobile' },
  { key: 'choices', icon: 'tabler:arrows-left-right' },
  { key: 'guests', icon: 'tabler:user-plus' },
  { key: 'leaderboard', icon: 'tabler:trophy' },
  { key: 'queue', icon: 'tabler:playlist-add' },
  { key: 'chat', icon: 'tabler:mood-smile' },
  { key: 'password', icon: 'tabler:lock' }
]

export default defineComponent({
  components: { Button },
  layout: 'Default/Default.layout',
  setup() {
    const { i18n, localePath } = useContext()
    const router = useRouter()
    const code = ref('')
    const digits = computed(() => code.value.replace(/\D/g, ''))

    useMeta(() => ({
      title: `${i18n.t('seo.party.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('seo.party.description') },
        { hid: 'keywords', name: 'keywords', content: i18n.t('seo.party.keywords') },
        { hid: 'og:title', name: 'og:title', content: `${i18n.t('seo.party.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'og:description', name: 'og:description', content: i18n.t('seo.party.description') },
        { hid: 'twitter:description', name: 'twitter:description', content: i18n.t('seo.party.description') }
      ]
    }))

    // 701518 -> "701 518"
    const format = () => {
      const d = digits.value.slice(0, 6)
      code.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d
    }

    const join = () => {
      if (digits.value.length === 6) router.push(localePath({ name: 'Party-code', params: { code: digits.value } }))
    }

    return { code, digits, format, join, facts: FACTS, steps: STEPS, features: FEATURES }
  },
  head: {}
})
</script>

<style lang="scss" scoped>
.party-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 20px 16px 32px;
  color: var(--color-text-01);
}

.party-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  text-align: center;

  &__eyebrow {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 4px 10px;
    color: var(--color-brand-02);
    font-weight: 800;
    font-size: var(--font-size-text-11);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: color-mix(in sRGB, var(--color-brand-02) 14%, transparent);
    border-radius: 999px;
  }

  &__title {
    max-width: 520px;
    margin: 0;
    font-weight: 800;
    font-size: clamp(26px, 6vw, 36px);
    line-height: 1.15;
    text-wrap: balance;
  }

  &__sub {
    max-width: 460px;
    margin: 0;
    color: var(--color-text-02);
    font-size: var(--font-size-text-8);
    line-height: 1.5;
  }

  &__facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    justify-content: center;
    margin: 4px 0 0;
    padding: 0;
    color: var(--color-text-02);
    font-weight: 600;
    font-size: var(--font-size-text-10);
    list-style: none;

    li {
      display: inline-flex;
      gap: 5px;
      align-items: center;
    }

    svg {
      color: var(--color-brand-02);
    }
  }
}

.party-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 420px;
  margin-top: 6px;
  padding: 14px;
  text-align: left;
  background: var(--color-ui-02);
  border: 1px solid var(--color-border-02);
  border-radius: 16px;
  box-shadow: var(--box-shadow-01);

  &__label {
    font-weight: 800;
    font-size: var(--font-size-text-8);
  }

  &__hint {
    margin: 0 0 4px;
    color: var(--color-text-03);
    font-size: var(--font-size-text-10);
  }

  &__row {
    display: flex;
    gap: 8px;
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    color: var(--color-text-01);
    font-weight: 800;
    font-size: 24px;
    letter-spacing: 0.15em;
    text-align: center;
    background: var(--color-field-01);
    border: 1px solid var(--color-border-02);
    border-radius: 12px;
    outline: 0;

    &:focus {
      border-color: var(--color-brand-02);
    }
  }

  &__join.van-button {
    height: auto;
    padding: 0 22px;
    font-weight: 700;
  }
}

.party-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    margin: 0;
    font-weight: 800;
    font-size: var(--font-size-text-6);
    text-align: center;
  }
}

.party-steps {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  @include media-breakpoint-up(tablet) {
    grid-template-columns: repeat(3, 1fr);
  }

  &__item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px;
    background: var(--color-ui-02);
    border: 1px solid var(--color-border-02);
    border-radius: 14px;

    @include media-breakpoint-up(tablet) {
      flex-direction: column;
    }

    strong {
      font-size: var(--font-size-text-9);
    }

    p {
      margin: 4px 0 0;
      color: var(--color-text-02);
      font-size: var(--font-size-text-10);
      line-height: 1.45;
    }
  }

  &__num {
    display: grid;
    flex: none;
    width: 32px;
    height: 32px;
    color: #fff;
    font-weight: 800;
    background: var(--color-brand-02);
    border-radius: 10px;
    place-items: center;
  }
}

.party-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  @include media-breakpoint-up(tablet) {
    grid-template-columns: repeat(4, 1fr);
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: var(--color-ui-02);
    border: 1px solid var(--color-border-02);
    border-radius: 14px;

    strong {
      font-size: var(--font-size-text-9);
    }

    p {
      margin: 0;
      color: var(--color-text-02);
      font-size: var(--font-size-text-10);
      line-height: 1.45;
    }
  }

  &__icon {
    display: grid;
    width: 36px;
    height: 36px;
    margin-bottom: 4px;
    color: var(--color-brand-02);
    background: color-mix(in sRGB, var(--color-brand-02) 14%, transparent);
    border-radius: 10px;
    place-items: center;
  }
}

.party-cta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 20px 16px;
  color: #fff;
  text-align: center;
  background: linear-gradient(135deg, var(--color-brand-02), #c83a5a);
  border-radius: 18px;

  &__title {
    margin: 0;
    font-weight: 800;
    font-size: var(--font-size-text-6);
  }

  &__sub {
    margin: 0;
    font-size: var(--font-size-text-9);
    opacity: 0.9;
  }

  &__button {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
    padding: 10px 20px;
    color: var(--color-brand-02);
    font-weight: 800;
    text-decoration: none;
    background: #fff;
    border-radius: 999px;

    &:hover {
      color: var(--color-brand-02);
      opacity: 0.9;
    }
  }
}
</style>
