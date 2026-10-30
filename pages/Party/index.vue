<template lang="pug">
.page.party-page
  form.party-entry(@submit.prevent="join")
    h1.party-entry__title {{ $t('party.entry.title') }}
    p.party-entry__hint {{ $t('party.entry.hint') }}
    input.party-entry__input(
      v-model="code"
      :placeholder="$t('party.entry.placeholder')"
      inputmode="numeric"
      autocomplete="off"
      maxlength="7"
      @input="format"
    )
    Button(type="primary" round block native-type="submit" :disabled="digits.length !== 6") {{ $t('party.entry.join') }}
</template>

<script>
import { defineComponent, ref, computed, useContext, useRouter } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: { Button },
  layout: 'Default/Default.layout',
  setup() {
    const { localePath } = useContext()
    const router = useRouter()
    const code = ref('')
    const digits = computed(() => code.value.replace(/\D/g, ''))

    // 701518 -> "701 518"
    const format = () => {
      const d = digits.value.slice(0, 6)
      code.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d
    }

    const join = () => {
      if (digits.value.length === 6) router.push(localePath({ name: 'Party-code', params: { code: digits.value } }))
    }

    return { code, digits, format, join }
  }
})
</script>

<style lang="scss" scoped>
.party-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.party-entry {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 360px;
  text-align: center;

  &__title {
    margin: 0;
    color: var(--color-text-01);
    font-size: 22px;
  }

  &__hint {
    margin: 0;
    color: var(--color-text-02);
    font-size: 14px;
  }

  &__input {
    padding: 14px;
    color: var(--color-text-01);
    font-weight: 800;
    font-size: 32px;
    letter-spacing: 0.15em;
    text-align: center;
    background: var(--color-ui-01);
    border: 1px solid var(--color-border-02);
    border-radius: 14px;
    outline: 0;

    &:focus {
      border-color: var(--color-brand-02);
    }
  }
}
</style>
