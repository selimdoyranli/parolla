<template lang="pug">
.player-avatar(:class="{ 'player-avatar--clickable': openPlayerDialogOnClick }" @click="handleClickPlayerAvatar")
  slot(name="prepend")

  .player-avatar__avatarWrapper(:style="{ width: `${size}px`, height: `${size}px` }")
    // Visitor Badge
    .player-avatar-badge(v-if="isVisitor")
      AppIcon.player-avatar-badge__icon(name="hugeicons:anonymous" color="#fff" :width="16" :height="16")

    // GM Badge
    .player-avatar-badge.player-avatar-badge--gm(v-if="isGm")
      AppIcon.player-avatar-badge__icon(name="tabler:crown" color="#fff" :width="16" :height="16")

    img.player-avatar__avatar(v-if="user" :src="avatarSrc" :alt="user.username" :style="{ width: `inherit`, height: `inherit` }")
    img.player-avatar__avatar.player-avatar__avatar--anon(
      v-else
      :src="avatarSrc"
      :alt="$t('general.anon')"
      :style="{ width: `inherit`, height: `inherit` }"
    )

  span.player-avatar__username(v-if="withUsername")
    template(v-if="user") {{ user.username }}
    template(v-else) {{ $t('general.anon') }}
    span.gm-username-extra(v-if="isGm") &nbsp;(GM)

  slot(name="append")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'
import { Notify } from 'vant'
import { createAvatar } from '@dicebear/core'
import * as adventurer from '@dicebear/adventurer'
import parollaConfig from '@/system/parolla.config'

export default defineComponent({
  components: {
    Notify
  },
  props: {
    size: {
      type: Number,
      required: false,
      default: 32
    },
    name: {
      type: String,
      required: false,
      default: null
    },
    user: {
      type: Object,
      required: false,
      default: null
    },
    withUsername: {
      type: Boolean,
      required: false,
      default: false
    },
    isVisitor: {
      type: Boolean,
      required: false,
      default: false
    },
    openPlayerDialogOnClick: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const store = useStore()

    const openPlayerDialog = async () => {
      store.commit('profile/SET_PLAYER_ID', props.user.id)
      store.commit('profile/SET_PLAYER_USERNAME', props.user.username)
      store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
    }

    const handleClickPlayerAvatar = async () => {
      if (props.openPlayerDialogOnClick) {
        await openPlayerDialog()
      }
    }

    const isGm = computed(() => {
      if (props.user?.id === 257116 || props.user?.id === 258270 || props.user?.id === 262467) {
        return true
      }

      return false
    })

    const generateAvatarDataImage = () => {
      return createAvatar(adventurer, {
        ...parollaConfig.avatar.defaultConfig
      }).toDataUri()
    }

    const avatarSrc = computed(() => {
      if (props.user) {
        if (props.user.diceBear?.dataImage) {
          return props.user.diceBear.dataImage
        }
      }

      return generateAvatarDataImage()
    })

    return { handleClickPlayerAvatar, isGm, avatarSrc }
  }
})
</script>

<style lang="scss" src="./PlayerAvatar.component.scss"></style>
