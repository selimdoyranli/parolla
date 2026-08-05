const { title, meta } = require('../system/head/main/tr')
const { BASE_URL, SAME_AS, GAME_INFO } = require('../scripts/content-pages/site.config')

module.exports = {
  htmlAttrs: {
    lang: 'tr'
  },
  title,
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/meta/icon/favicon.ico' },
    { rel: 'preconnect', href: '//fonts.googleapis.com', crossorigin: 'anonymous' },
    { rel: 'preconnect', href: '//fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'dns-prefetch', href: '//strapi.parolla.app' },
    { rel: 'dns-prefetch', href: '//pagead2.googlesyndication.com' },
    { rel: 'dns-prefetch', href: '//googleads.g.doubleclick.net' },
    { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },
    { rel: 'manifest', href: '/manifest.json' }
  ],
  script: [
    // Apple JS SDK for web "Sign in with Apple" popup (see composables/useAppleSignIn.js)
    {
      src: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
      defer: true,
      async: true
    },
    // JSON-LD baked into the SPA shell so non-JS AI/search crawlers can read it
    {
      hid: 'ld-website',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'parolla',
        url: BASE_URL,
        inLanguage: ['tr', 'en']
      })
    },
    {
      hid: 'ld-organization',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'parolla',
        url: BASE_URL,
        logo: `${BASE_URL}/meta/logo.png`,
        sameAs: SAME_AS
      })
    },
    {
      hid: 'ld-videogame',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: GAME_INFO.name,
        url: BASE_URL,
        description: GAME_INFO.descriptions.tr,
        genre: ['Word game', 'Trivia'],
        gamePlatform: ['Web', 'iOS', 'Android'],
        applicationCategory: 'Game',
        operatingSystem: 'Web, iOS, Android',
        inLanguage: ['tr', 'en'],
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        sameAs: SAME_AS,
        author: { '@type': 'Person', name: 'Selim Doyranlı', url: 'https://selimdoyranli.com' }
      })
    }
  ],
  __dangerouslyDisableSanitizersByTagID: {
    'ld-website': ['innerHTML'],
    'ld-organization': ['innerHTML'],
    'ld-videogame': ['innerHTML']
  },
  meta: [
    { charset: 'utf-8' },
    {
      hid: 'robots',
      name: 'robots',
      content: 'index,follow'
    },
    {
      hid: 'Publisher',
      property: 'Publisher',
      content: 'Selim Doyranlı'
    },
    {
      hid: 'mobile-web-app-capable',
      name: 'mobile-web-app-capable',
      content: 'yes'
    },
    { name: 'Classification', content: 'Game' },
    { name: 'Rating', content: 'General' },
    { name: 'Distribution', content: 'Global' },
    { name: 'Copyright', content: 'parolla' },
    { itemprop: 'copyrightYear', content: new Date().getFullYear().toString() },
    ...meta
  ]
}
