<template lang="pug">
.login-form(:class="[loginFormVariantClass]")
  template(v-if="variant === 'default'")
    span.login-form__title(role="button" @click="handleGoogleLogin") {{ $t('dialog.auth.login') }}

    hr.login-form__separator

  .login-form__social-buttons
    Button.login-form__social-button.login-form__social-button--google(native-type="button" @click="handleGoogleLogin")
      AppIcon.login-form__social-button-icon(name="devicon:google" :width="20" :height="20")
      span.login-form__social-button-text {{ $t('dialog.auth.loginWithGoogle') }}

    Button.login-form__social-button.login-form__social-button--apple(native-type="button" @click="handleAppleLogin")
      AppIcon.login-form__social-button-icon(name="devicon:apple" :width="20" :height="20")
      span.login-form__social-button-text {{ $t('dialog.auth.loginWithApple') }}
</template>

<script>
import { defineComponent, useContext, computed } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  props: {
    variant: {
      type: String,
      required: false,
      default: 'default' // default | full
    }
  },
  setup(props) {
    const context = useContext()

    const { isExpoWebView, postToNative } = useNativeBridge()

    const handleGoogleLogin = () => {
      if (isExpoWebView.value) {
        postToNative('google-auth-request')

        return
      }

      window.location.href = `${process.env.API_URL}/connect/google`
    }

    const handleAppleLogin = () => {
      if (isExpoWebView.value) {
        postToNative('apple-auth-request')

        return
      }

      // Desktop / normal web: Sign in with Apple (Services ID) web flow. The Strapi
      // POST /auth/apple/callback endpoint already accepts the Services-ID audience,
      // so the web flow can hand its identity token to the same backend.
      window.location.href = `${process.env.API_URL}/connect/apple`
    }

    const loginFormVariantClass = computed(() => {
      return {
        [`login-form--${props.variant}`]: props.variant
      }
    })

    return {
      handleGoogleLogin,
      handleAppleLogin,
      loginFormVariantClass
    }
  }
})
</script>

<style lang="scss" src="./LoginForm.component.scss"></style>
