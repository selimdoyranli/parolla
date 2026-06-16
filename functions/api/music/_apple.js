const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const APPLE_MUSIC_HOME = 'https://music.apple.com/us/new'
const AMP_BASE = 'https://amp-api.music.apple.com/v1/catalog'
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
const KV_KEY = 'amp_token'

const decodeJwtExp = token => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(payload))

    return typeof json.exp === 'number' ? json.exp : 0
  } catch {
    return 0
  }
}

const scrapeToken = async () => {
  const homeRes = await fetch(APPLE_MUSIC_HOME, { headers: { 'User-Agent': DESKTOP_UA } })

  if (!homeRes.ok) {
    throw new Error(`Apple Music home fetch failed: ${homeRes.status}`)
  }

  const html = await homeRes.text()
  const paths = [...html.matchAll(/\/assets\/index[^"' ]*\.js/g)].map(m => m[0])
  const unique = [...new Set(paths)].filter(p => !p.includes('legacy'))

  if (!unique.length) {
    throw new Error('Apple Music JS bundle not found')
  }

  for (const path of unique) {
    const res = await fetch(`https://music.apple.com${path}`, { headers: { 'User-Agent': DESKTOP_UA } })

    if (!res.ok) {
      continue
    }

    const js = await res.text()
    const match = js.match(JWT_REGEX)

    if (match) {
      return match[0]
    }
  }

  throw new Error('Apple Music token not found')
}

const putToken = async (env, token) => {
  if (!env.MUSIC_KV) {
    return
  }

  const exp = decodeJwtExp(token)
  const now = Math.floor(Date.now() / 1000)

  await env.MUSIC_KV.put(KV_KEY, token, exp - now > 60 ? { expiration: exp } : { expirationTtl: 3600 })
}

export const getToken = async env => {
  if (env.APPLE_MUSIC_TOKEN) {
    return env.APPLE_MUSIC_TOKEN
  }

  const cached = env.MUSIC_KV ? await env.MUSIC_KV.get(KV_KEY) : null

  if (cached && decodeJwtExp(cached) - 60 > Math.floor(Date.now() / 1000)) {
    return cached
  }

  const token = await scrapeToken()

  await putToken(env, token)

  return token
}

export const localeToStorefront = locale => (locale === 'tr' ? 'tr' : 'us')

export const localeToLang = locale => (locale === 'tr' ? 'tr' : 'en-US')

const defaultStorefront = env => env.APPLE_MUSIC_STOREFRONT || 'us'

export const ampFetch = async (env, path, storefront) => {
  const sf = storefront || defaultStorefront(env)
  const doFetch = token =>
    fetch(`${AMP_BASE}/${sf}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: 'https://music.apple.com',
        'User-Agent': DESKTOP_UA
      }
    })

  let token = await getToken(env)
  let res = await doFetch(token)

  if (res.status === 401 && !env.APPLE_MUSIC_TOKEN) {
    if (env.MUSIC_KV) {
      await env.MUSIC_KV.delete(KV_KEY)
    }

    token = await scrapeToken()
    await putToken(env, token)
    res = await doFetch(token)
  }

  if (!res.ok) {
    throw new Error(`AMP request failed: ${res.status} ${path}`)
  }

  return res.json()
}

export const formatArtwork = (url, size) => {
  if (!url) {
    return null
  }

  return url.replace('{w}', String(size)).replace('{h}', String(size)).replace('{f}', 'jpg')
}

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  })
