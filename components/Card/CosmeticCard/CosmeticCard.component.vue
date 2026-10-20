<template lang="pug">
.cosmetic-card(:class="{ 'cosmetic-card--owned': owned, 'cosmetic-card--reserve': reserve }")
  .cosmetic-card__stage
    span.cosmetic-card__discount(v-if="discount") -{{ discount }}%
    PlayerAvatar(v-if="category === 'avatar_frame' || category === 'avatar_decoration'" :user="previewUser" :size="64")
    .cosmetic-card__cover(v-else-if="category === 'profile_cover'" :style="{ backgroundImage: `url(${current.asset})` }")
    .cosmetic-card__mini(v-else-if="category === 'profile_frame' || category === 'profile_effect'")
      span.cosmetic-card__mini-dot
      img(:src="current.asset" alt loading="lazy")
    span.cosmetic-card__name-sample(v-else-if="category === 'name_color'" :style="nameColorStyle") {{ username }}
    PlayerAvatar(v-else with-username :user="previewUser" :size="36")

  .cosmetic-card__meta(v-if="!previewOnly")
    b.cosmetic-card__title {{ current.name }}
    .cosmetic-card__tags
      Tag.cosmetic-card__rarity(round :class="`cosmetic-card__rarity--${current.rarity}`") {{ $t(`economy.shop.rarity.${current.rarity}`) }}
      Tag.cosmetic-card__free(v-if="free" round) {{ $t('economy.shop.freeChip') }}
      GoldAmount(v-if="original" size="sm" strike muted :amount="original")
    // grid cards always render the row so single- and multi-variant cards keep the same height
    .cosmetic-card__dots(v-if="variants.length > 1 || reserve")
      button.cosmetic-card__dot(
        v-for="(v, i) in variants.length > 1 ? variants : []"
        :key="v.key"
        type="button"
        :aria-label="v.variantName || $t('economy.shop.original')"
        :title="v.variantName || $t('economy.shop.original')"
        :aria-pressed="String(i === index)"
        :style="{ background: dotColor(v) }"
        @click="index = i"
      )
    button.shop-buy.shop-buy--block.shop-buy--owned(v-if="equipped" type="button" disabled)
      AppIcon(name="tabler:check" :width="14" :height="14")
      span {{ $t('economy.shop.equippedLabel') }}
    button.shop-buy.shop-buy--block.shop-buy--ghost(
      v-else-if="owned || free"
      type="button"
      :disabled="equipping"
      @click="$emit('equip', current)"
    )
      Loading(v-if="equipping" color="currentColor" size="14")
      span(v-else) {{ $t('economy.shop.equip') }}
    button.shop-buy.shop-buy--block(v-else type="button" @click="$emit('buy', { item: current, price, fromVitrin: Boolean(original) })")
      // guests see the price too; tapping it opens the auth dialog (ShopView.requireLogin)
      GoldAmount(size="sm" :amount="price")
</template>

<script>
import { createAvatar } from '@dicebear/core'
import * as adventurer from '@dicebear/adventurer'
import { defineComponent, computed, ref } from '@nuxtjs/composition-api'
import { Tag, Loading } from 'vant'

const SLOT = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  name_color: 'nameColor',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

// guests preview cosmetics on the parolla mascot: bald, eyes open, brand background (fixed options, not seed luck)
const GUEST_NAME = 'parolla'
let guestAvatar = null
const guestDiceBear = () =>
  (guestAvatar = guestAvatar || {
    dataImage: createAvatar(adventurer, {
      seed: GUEST_NAME,
      hairProbability: 0,
      eyes: ['variant01'],
      backgroundColor: ['ff7878']
    }).toDataUri()
  })

export default defineComponent({
  components: { Tag, Loading },
  props: {
    // base item first, then its variants
    variants: { type: Array, required: true },
    ownedKeys: { type: Set, default: () => new Set() },
    equippedKeys: { type: Set, default: () => new Set() },
    // free-event items: equippable without owning, not sold meanwhile
    freeKeys: { type: Set, default: () => new Set() },
    balance: { type: Number, default: 0 },
    // viewer's own user (logged in) or null; sample avatar/name come from it
    viewer: { type: Object, default: null },
    // vitrin: discounted price replaces the catalog price of the base item
    vitrinPrice: { type: Number, default: null },
    // fixed-height rows (shop grid)
    reserve: { type: Boolean, default: false },
    previewOnly: { type: Boolean, default: false },
    // an equip request for this card is in flight
    equipping: { type: Boolean, default: false }
  },
  setup(props) {
    const { nameStyle } = useCosmetics()

    const index = ref(0)
    const current = computed(() => props.variants[index.value] || props.variants[0])
    const category = computed(() => current.value.category)
    // ownership follows the selected variant
    const owned = computed(() => props.ownedKeys.has(current.value.key))
    const equipped = computed(() => props.equippedKeys.has(current.value.key))
    const free = computed(() => props.freeKeys.has(current.value.key))

    const username = computed(() => (props.viewer && props.viewer.username) || GUEST_NAME)
    const previewUser = computed(() => {
      const { diceBear, avatarSource, profilePhoto } = props.viewer || { diceBear: guestDiceBear() }

      return { username: username.value, diceBear, avatarSource, profilePhoto, loadout: { [SLOT[category.value]]: current.value.key } }
    })

    const nameColorStyle = computed(() => nameStyle(current.value.key))

    const original = computed(() => (props.vitrinPrice && index.value === 0 ? current.value.price : null))
    const price = computed(() => (original.value ? props.vitrinPrice : current.value.price))
    const discount = computed(() => (original.value ? Math.round((1 - price.value / original.value) * 100) : 0))

    // catalog swatch; hashed hue only for items without one, neutral for the original
    const dotColor = v => {
      if (v.value && v.value.swatch) return v.value.swatch

      if (!v.variantName) return '#9aa0a6'

      let h = 0

      for (const ch of v.variantName) h = (h * 31 + ch.charCodeAt(0)) % 360

      return `hsl(${h} 65% 55%)`
    }

    return {
      index,
      owned,
      equipped,
      free,
      current,
      category,
      username,
      previewUser,
      nameColorStyle,
      original,
      price,
      discount,
      dotColor
    }
  }
})
</script>

<style lang="scss" src="./CosmeticCard.component.scss"></style>
