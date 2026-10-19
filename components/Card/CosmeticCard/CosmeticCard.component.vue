<template lang="pug">
.cosmetic-card(:class="{ 'cosmetic-card--owned': owned }")
  .cosmetic-card__stage
    PlayerAvatar(v-if="category === 'avatar_frame' || category === 'avatar_decoration'" :user="previewUser" :size="72")
    .cosmetic-card__plate(v-else-if="category === 'nameplate'" :style="plateStyleValue") {{ username }}
    .cosmetic-card__cover(v-else-if="category === 'profile_cover'" :style="{ backgroundImage: `url(${current.asset})` }")
    .cosmetic-card__mini(v-else-if="category === 'profile_frame' || category === 'profile_effect'")
      span.cosmetic-card__mini-dot
      img(:src="current.asset" alt loading="lazy")
    span.cosmetic-card__name-sample(v-else-if="category === 'name_color'" :style="nameColorStyle") {{ username }}
    PlayerAvatar(v-else with-username :user="previewUser" :size="40")

  .cosmetic-card__meta(v-if="!previewOnly")
    span.cosmetic-card__rarity(:class="`cosmetic-card__rarity--${current.rarity}`") {{ $t(`economy.shop.rarity.${current.rarity}`) }}
    b.cosmetic-card__title {{ current.name }}
    .cosmetic-card__dots(v-if="variants.length > 1")
      button.cosmetic-card__dot(
        v-for="(v, i) in variants"
        :key="v.key"
        type="button"
        :aria-label="v.variantName || $t('economy.shop.original')"
        :title="v.variantName || $t('economy.shop.original')"
        :aria-pressed="String(i === index)"
        :style="{ background: dotColor(v) }"
        @click="index = i"
      )
    .cosmetic-card__foot
      span.cosmetic-card__price
        GoldAmount.me-1(v-if="original" size="sm" strike muted :amount="original")
        GoldAmount(:amount="price")
      span.cosmetic-card__owned(v-if="owned") {{ $t('economy.shop.owned') }}
      Button(v-else type="primary" size="mini" @click="$emit('buy', { item: current, price, fromVitrin: Boolean(original) })") {{ buyText }}
</template>

<script>
import { defineComponent, computed, ref, useContext } from '@nuxtjs/composition-api'
import { Button } from 'vant'

const SLOT = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  nameplate: 'nameplate',
  name_color: 'nameColor',
  title: 'title',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

export default defineComponent({
  components: { Button },
  props: {
    // base item first, then its variants
    variants: { type: Array, required: true },
    ownedKeys: { type: Object, default: () => new Set() },
    // viewer's own user (logged in) or null; sample avatar/name come from it
    viewer: { type: Object, default: null },
    loggedIn: { type: Boolean, default: false },
    // vitrin: discounted price replaces the catalog price of the base item
    vitrinPrice: { type: Number, default: null },
    previewOnly: { type: Boolean, default: false }
  },
  setup(props) {
    const { i18n } = useContext()
    const { nameStyle, plateStyle } = useCosmetics()

    const index = ref(0)
    const current = computed(() => props.variants[index.value] || props.variants[0])
    const category = computed(() => current.value.category)
    // ownership follows the selected variant
    const owned = computed(() => props.ownedKeys.has(current.value.key))

    const username = computed(() => (props.viewer && props.viewer.username) || 'selim.d')
    const previewUser = computed(() => {
      const { diceBear, avatarSource, profilePhoto } = props.viewer || {}

      return { username: username.value, diceBear, avatarSource, profilePhoto, loadout: { [SLOT[category.value]]: current.value.key } }
    })

    const plateStyleValue = computed(() => plateStyle(previewUser.value))
    const nameColorStyle = computed(() => nameStyle(current.value.key))

    const original = computed(() => (props.vitrinPrice && index.value === 0 ? current.value.price : null))
    const price = computed(() => (original.value ? props.vitrinPrice : current.value.price))

    // catalog swatch; hashed hue only for items without one, neutral for the original
    const dotColor = v => {
      if (v.value && v.value.swatch) return v.value.swatch

      if (!v.variantName) return '#9aa0a6'

      let h = 0

      for (const ch of v.variantName) h = (h * 31 + ch.charCodeAt(0)) % 360

      return `hsl(${h} 65% 55%)`
    }

    const buyText = computed(() => (props.loggedIn ? i18n.t('economy.shop.buy') : i18n.t('economy.shop.loginToBuy')))

    return { index, owned, current, category, username, previewUser, plateStyleValue, nameColorStyle, original, price, dotColor, buyText }
  }
})
</script>

<style lang="scss" src="./CosmeticCard.component.scss"></style>
