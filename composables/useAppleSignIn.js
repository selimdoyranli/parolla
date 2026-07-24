// Wraps Apple's JS SDK (AppleID.auth.js) for the web "Sign in with Apple" popup — the
// desktop/browser equivalent of the native iOS flow. The SDK is loaded as a global <script>
// via nuxt-config/head.js; this composable lazy-initializes it on first call and returns the
// same { identityToken, authorizationCode, nonce, fullName } payload the native bridge does,
// so it POSTs to the exact same Strapi endpoint (auth/apple/callback). Mirrors the Dizge web app.

const sha256Hex = async input => {
  const buf = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', buf)

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// The SDK is loaded deferred, so a click within the first few hundred ms can race the
// script load. Wait up to timeoutMs for window.AppleID to appear.
const waitForSdk = (timeoutMs = 5000) => {
  if (typeof window === 'undefined') return Promise.resolve(false)

  if (window.AppleID) return Promise.resolve(true)

  const start = Date.now()

  return new Promise(resolve => {
    const tick = () => {
      if (window.AppleID) return resolve(true)

      if (Date.now() - start >= timeoutMs) return resolve(false)

      setTimeout(tick, 50)
    }

    tick()
  })
}

let initialized = false

export const useAppleSignIn = () => {
  const servicesId = process.env.APPLE_SERVICES_ID || ''
  // Apple requires a registered Return URL. In popup mode it isn't navigated to, but it
  // MUST match what's configured on the Services ID in the Apple Developer Console.
  const redirectURI = process.env.APPLE_REDIRECT_URI || ''

  const ensureInitialized = async () => {
    if (initialized) return

    const ready = await waitForSdk()

    if (!ready) throw new Error('AppleID SDK not loaded')

    if (!servicesId || !redirectURI) throw new Error('Apple Services ID or redirect URI not configured')

    window.AppleID.auth.init({
      clientId: servicesId,
      scope: 'name email',
      redirectURI,
      usePopup: true
    })

    initialized = true
  }

  const signIn = async () => {
    try {
      await ensureInitialized()

      // Replay protection: generate a random nonce, hash it with SHA-256, and pass the HASH
      // to Apple (the web SDK does not hash for us, unlike the iOS native API). Apple echoes
      // the hash in the JWT's `nonce` claim; Strapi hashes the RAW nonce we send alongside
      // the token and asserts equality.
      const rawNonce = crypto.randomUUID()
      const hashedNonce = await sha256Hex(rawNonce)

      const res = await window.AppleID.auth.signIn({ nonce: hashedNonce })

      const fullName = res.user?.name
        ? {
            givenName: res.user.name.firstName ?? null,
            familyName: res.user.name.lastName ?? null
          }
        : undefined

      return {
        ok: true,
        identityToken: res.authorization.id_token,
        authorizationCode: res.authorization.code,
        nonce: rawNonce,
        fullName
      }
    } catch (err) {
      if (err?.error === 'popup_closed_by_user' || err?.error === 'user_cancelled_authorize') {
        return { ok: false, reason: 'cancelled' }
      }

      const message = err?.message || err?.error || 'Unknown Apple Sign-In error'

      return { ok: false, reason: 'error', message }
    }
  }

  return { signIn }
}
