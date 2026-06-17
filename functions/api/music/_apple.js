const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const APPLE_MUSIC_HOME = 'https://music.apple.com/us/new'
// ID lookups (/playlists, /artists) work fine from CF on the default host.
// /search is rate-limited (429) on the default host from CF IPs but works on
// the edge host (which the music.apple.com web client uses) — see ampFetch opts.
const AMP_BASE = 'https://amp-api.music.apple.com/v1/catalog'
const AMP_EDGE_BASE = 'https://amp-api-edge.music.apple.com/v1/catalog'
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
const KV_KEY = 'amp_token'
const FETCH_TIMEOUT_MS = 8000

// Workers' fetch has no default timeout — a hanging upstream would hang the whole
// function and surface as a Cloudflare 502. Abort after FETCH_TIMEOUT_MS so the
// failure is fast, caught, and observable instead.
const fetchWithTimeout = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

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
  const homeRes = await fetchWithTimeout(APPLE_MUSIC_HOME, { headers: { 'User-Agent': DESKTOP_UA } })

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
    const res = await fetchWithTimeout(`https://music.apple.com${path}`, { headers: { 'User-Agent': DESKTOP_UA } })

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
    console.log('[amp] token source: APPLE_MUSIC_TOKEN env var')

    return env.APPLE_MUSIC_TOKEN
  }

  const cached = env.MUSIC_KV ? await env.MUSIC_KV.get(KV_KEY) : null

  if (cached && decodeJwtExp(cached) - 60 > Math.floor(Date.now() / 1000)) {
    console.log('[amp] token source: KV cache')

    return cached
  }

  console.log('[amp] token source: scraping music.apple.com (no env token / cache miss)')

  const token = await scrapeToken()

  await putToken(env, token)

  return token
}

export const localeToStorefront = locale => (locale === 'tr' ? 'tr' : 'us')

export const localeToLang = locale => (locale === 'tr' ? 'tr' : 'en-US')

export const localeToStrapi = locale => {
  if (locale === 'tr') {
    return 'tr-TR'
  }

  if (locale === 'en') {
    return 'en'
  }

  return 'tr-TR'
}

const defaultStorefront = env => env.APPLE_MUSIC_STOREFRONT || 'us'

export const ampFetch = async (env, path, storefront, { edge = false } = {}) => {
  const sf = storefront || defaultStorefront(env)
  const base = edge ? AMP_EDGE_BASE : AMP_BASE
  const doFetch = token =>
    fetchWithTimeout(`${base}/${sf}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: 'https://music.apple.com',
        'User-Agent': DESKTOP_UA
      }
    })

  let token = await getToken(env)
  let res

  try {
    res = await doFetch(token)
  } catch (err) {
    console.error('[amp] request errored (timeout/network):', path, String((err && err.message) || err))
    throw err
  }

  if (res.status === 401 && !env.APPLE_MUSIC_TOKEN) {
    if (env.MUSIC_KV) {
      await env.MUSIC_KV.delete(KV_KEY)
    }

    token = await scrapeToken()
    await putToken(env, token)
    res = await doFetch(token)
  }

  if (!res.ok) {
    console.error('[amp] request failed:', res.status, path)
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

// TTLs are long on purpose: featured lists come from Strapi (rarely change),
// playlist contents change slowly, search results are stable. A Strapi edit
// surfaces after at most CACHE_TTL.featured seconds.
export const CACHE_TTL = {
  featured: 86400, // 24h — featured-playlists, featured-artists
  playlistSongs: 43200, // 12h
  search: 21600 // 6h — search-playlists, search-playlists-by-tag
}

export const jsonResponse = (body, status = 200, { maxAge = 0 } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': maxAge > 0 ? `public, max-age=${maxAge}` : 'no-store'
    }
  })

// Serves from Cloudflare's edge cache when warm, skipping the expensive AMP
// fetch + token scrape entirely. The worker still gets invoked, but a cache hit
// returns before any upstream work. Only responses the handler marks cacheable
// (a positive max-age via jsonResponse) are stored — errors and empties aren't.
export const withCache = async (context, handler) => {
  const cache = caches.default
  const cacheKey = new Request(new URL(context.request.url).toString(), { method: 'GET' })
  const hit = await cache.match(cacheKey)

  if (hit) {
    return hit
  }

  const response = await handler()
  const cacheControl = response.headers.get('Cache-Control') || ''

  if (response.status === 200 && cacheControl.includes('max-age') && !cacheControl.includes('no-store')) {
    context.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
}
