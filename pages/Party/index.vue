<template lang="pug">
.page.party-page
  //- hero: what a party is + the code entry (most visitors land here from a friend's link or code)
  section.party-hero
    span.party-hero__eyebrow
      AppIcon(name="tabler:confetti" :width="14" :height="14")
      | {{ $t('party.landing.eyebrow') }}
    h1.party-hero__title {{ $t('party.landing.title') }}
    p.party-hero__sub {{ $t('party.landing.sub') }}

    .party-hero__grid
      .party-hero__join
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

        //- no code? the public rooms (hosts who turned on "Listede göster")
        button.party-rooms-open(type="button" @click="isRoomsOpen = true")
          span.party-rooms-open__icon
            AppIcon(name="tabler:world" :width="20" :height="20")
          span.party-rooms-open__text
            strong {{ $t('party.rooms.open') }}
            small {{ $t('party.rooms.openSub') }}
          span.party-rooms-open__count(v-if="roomsLoaded && rooms.length")
            i
            | {{ rooms.length }}
          AppIcon.party-rooms-open__chevron(name="tabler:chevron-right" :width="18" :height="18")
        PartyRoomsDialog(v-model="isRoomsOpen")

        ul.party-hero__facts
          li(v-for="fact in facts" :key="fact.key")
            AppIcon(:name="fact.icon" :width="16" :height="16")
            | {{ $t(`party.landing.facts.${fact.key}`) }}
        section.party-cta
          //- decorative icon pattern behind the copy
          .party-cta__pattern(aria-hidden="true")
            AppIcon(v-for="deco in ctaDecor" :key="deco.icon" :name="deco.icon" :style="deco.style" :width="deco.size" :height="deco.size")
          h2.party-cta__title {{ $t('party.landing.ctaTitle') }}
          p.party-cta__sub {{ $t('party.landing.ctaSub') }}
          //- an empty lobby: games get queued there
          button.party-cta__button(type="button" :disabled="loading" @click="startParty")
            AppIcon(name="tabler:confetti" :width="18" :height="18")
            | {{ $t('party.landing.cta') }}
      PartyLiveLobbyDemo

  section.party-section
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
</template>

<script>
import { defineComponent, ref, computed, onMounted, useContext, useRouter, useStore, useMeta } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { usePartyCreate } from '@/composables/usePartyCreate'
import { usePartyRooms } from '@/composables/usePartyRooms'

// only what party rooms actually do (parolla-ws src/channels/party)
const FACTS = [
  { key: 'players', icon: 'tabler:users' },
  { key: 'live', icon: 'tabler:bolt' },
  { key: 'noSignup', icon: 'tabler:user-check' }
]
const STEPS = ['setup', 'pick', 'share']
const CTA_DECOR = [
  { icon: 'tabler:confetti', size: 56, style: { top: '-8px', left: '-6px', transform: 'rotate(-18deg)' } },
  { icon: 'tabler:trophy', size: 44, style: { top: '14px', right: '8px', transform: 'rotate(14deg)' } },
  { icon: 'tabler:bolt', size: 36, style: { bottom: '18px', left: '14px', transform: 'rotate(10deg)' } },
  { icon: 'tabler:mood-smile', size: 52, style: { right: '-8px', bottom: '-10px', transform: 'rotate(-12deg)' } },
  { icon: 'tabler:sparkles', size: 26, style: { top: '4px', left: '42%', transform: 'rotate(12deg)' } }
]
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
    const { i18n, localePath, $auth } = useContext()
    const store = useStore()
    const router = useRouter()
    const { loading, create } = usePartyCreate()
    const code = ref('')
    const isRoomsOpen = ref(false)
    // one load for the button's live count; the dialog polls on its own while open
    const { rooms, loaded: roomsLoaded, load: loadRooms } = usePartyRooms()

    onMounted(loadRooms)
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

    // only logged-in users host; the server rejects guests too
    const startParty = () => ($auth.loggedIn ? create() : store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true))

    return {
      code,
      digits,
      format,
      join,
      loading,
      startParty,
      isRoomsOpen,
      rooms,
      roomsLoaded,
      facts: FACTS,
      steps: STEPS,
      ctaDecor: CTA_DECOR,
      features: FEATURES
    }
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
    margin: 0;
    font-weight: 800;
    font-size: clamp(26px, 6vw, 36px);
    line-height: 1.15;
    text-wrap: balance;
  }

  &__sub {
    margin: 0;
    color: var(--color-text-02);
    font-size: var(--font-size-text-8);
    line-height: 1.5;
  }

  // mobile: entry then demo; tablet+: entry left, live lobby demo right
  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    width: 100%;

    @include media-breakpoint-up(tablet) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      align-items: stretch;
    }
  }

  &__join {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;

    // line up with the demo card, which leaves room above for its badge
    @include media-breakpoint-up(tablet) {
      padding-top: 18px;
    }
  }

  &__facts {
    display: flex;
    flex-wrap: nowrap; // one line, even in the narrow left column
    gap: 10px;
    justify-content: center;
    margin: 4px 0 0;
    padding: 0;
    color: var(--color-text-02);
    font-weight: 600;
    font-size: var(--font-size-text-11);
    white-space: nowrap;
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
  position: relative;
  display: flex;
  flex: 1; // fills the left column so it ends level with the demo card
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 16px;
  overflow: hidden;
  color: #fff;
  text-align: center;
  background: radial-gradient(rgba(#fff, 0.16) 1.2px, transparent 1.4px) 0 0 / 14px 14px,
    linear-gradient(135deg, var(--color-brand-02), #c83a5a);
  border-radius: 18px;

  > :not(.party-cta__pattern) {
    position: relative;
  }

  &__pattern {
    position: absolute;
    color: #fff;
    opacity: 0.18;
    pointer-events: none;
    inset: 0;

    > * {
      position: absolute;
    }
  }

  &__title {
    margin: 0;
    font-weight: 800;
    font-size: var(--font-size-text-7);
  }

  &__sub {
    margin: 0;
    font-size: var(--font-size-text-10);
    text-wrap-style: balance;
    opacity: 0.9;
  }

  &__button {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    margin-top: 2px;
    padding: 8px 18px;
    color: var(--color-brand-02);
    font-weight: 800;
    text-decoration: none;
    background: #fff;
    border: 0;
    border-radius: 999px;
    cursor: pointer;

    &:hover,
    &:disabled {
      color: var(--color-brand-02);
      opacity: 0.9;
    }
  }
}

.party-rooms-open {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  color: var(--color-text-01);
  font: inherit;
  text-align: left;
  background: var(--color-ui-02);
  border: 1px solid var(--color-border-02);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--color-brand-02);
  }

  &__icon {
    display: grid;
    flex: none;
    width: 38px;
    height: 38px;
    color: var(--color-brand-02);
    background: color-mix(in sRGB, var(--color-brand-02) 12%, transparent);
    border-radius: 12px;
    place-items: center;
  }

  &__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;

    strong {
      font-weight: 800;
      font-size: var(--font-size-text-9);
    }

    small {
      color: var(--color-text-03);
      font-size: var(--font-size-text-11);
    }
  }

  // live count of listed rooms
  &__count {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    padding: 3px 9px;
    color: #1ee36b;
    font-weight: 800;
    font-size: var(--font-size-text-11);
    background: color-mix(in sRGB, #1ee36b 14%, transparent);
    border-radius: 999px;

    i {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
    }
  }

  &__chevron {
    flex: none;
    color: var(--color-text-03);
  }
}
</style>
