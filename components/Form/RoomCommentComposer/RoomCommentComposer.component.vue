<template lang="pug">
.room-comment-composer
  PlayerAvatar.room-comment-composer__avatar(v-if="$auth.loggedIn" :user="$auth.user" :size="32")
  Field.room-comment-composer__field(
    v-model="form.content"
    type="textarea"
    :placeholder="$auth.loggedIn ? $t('comments.placeholder') : $t('comments.loginPlaceholder')"
    rows="1"
    autosize
    auth-control
    :maxlength="512"
    :readonly="!$auth.loggedIn"
    :autofocus="autofocus"
  )
  Button.room-comment-composer__send(
    type="primary"
    size="small"
    plain
    auth-control
    :loading="form.pending"
    :disabled="$auth.loggedIn && !form.content.trim()"
    @click="submit"
  )
    AppIcon(:name="$auth.loggedIn ? 'tabler:send' : 'tabler:login-2'")
</template>

<script>
import { defineComponent, reactive, useStore, useContext } from '@nuxtjs/composition-api'
import { Field, Button, Toast } from 'vant'

export default defineComponent({
  components: { Field, Button },
  props: {
    roomId: { type: Number, required: true },
    parent: { type: String, default: null },
    mention: { type: String, default: null },
    autofocus: { type: Boolean, default: false }
  },
  emits: ['posted', 'cancel'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const { censorBadwords } = useCensorBadwords()

    const form = reactive({
      content: props.mention ? `@${props.mention} ` : '',
      pending: false
    })

    const submit = async () => {
      const content = form.content.trim()

      if (!content || form.pending) return

      form.pending = true
      const { data, error } = await store.dispatch('comment/postComment', {
        roomId: props.roomId,
        content: censorBadwords(content),
        parent: props.parent
      })
      form.pending = false

      if (error) {
        Toast(error.message || i18n.t('comments.error'))

        return
      }

      form.content = ''
      emit('posted', data.item)
    }

    return { form, submit }
  }
})
</script>

<style lang="scss" src="./RoomCommentComposer.component.scss"></style>
