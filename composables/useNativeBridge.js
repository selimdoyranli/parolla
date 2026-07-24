import { computed } from '@nuxtjs/composition-api'

export const useNativeBridge = () => {
  const isClient = typeof window !== 'undefined'

  const isFlutterWebView = computed(() => isClient && !!window.flutter_inappwebview)

  const isExpoWebView = computed(() => {
    if (!isClient) return false

    return !!window.ReactNativeWebView || /ParollaApp/i.test(window.navigator.userAgent || '')
  })

  const isWebView = computed(() => isFlutterWebView.value || isExpoWebView.value)

  const postToNative = (type, data) => {
    if (!isClient) return

    window.postMessage({ type, data }, '*')
  }

  return {
    isFlutterWebView,
    isExpoWebView,
    isWebView,
    postToNative
  }
}
