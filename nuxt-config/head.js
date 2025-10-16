const { title, meta } = require('../system/head/main/tr')

module.exports = {
  htmlAttrs: {
    lang: 'tr'
  },
  title,
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/meta/icon/favicon.ico' },
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'dns-prefetch', href: '//strapi.parolla.app' },
    { rel: 'dns-prefetch', href: '//pagead2.googlesyndication.com' },
    { rel: 'dns-prefetch', href: '//googleads.g.doubleclick.net' },
    { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },
    { rel: 'manifest', href: '/manifest.json' }
  ],
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
