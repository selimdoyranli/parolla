// Self-check for scripts/content-pages/route-heads.js — run: node scripts/route-heads-selfcheck.js
const assert = require('assert')
const { applyRouteHead, fileFor } = require('./content-pages/route-heads')

const shell = [
  '<html><head><title>home</title>',
  '<meta data-hid="description" name="description" content="home">',
  '<meta data-hid="keywords" name="keywords" content="home">',
  ...['og:title', 'og:description', 'og:url', 'twitter:title', 'twitter:description', 'twitter:url'].map(
    hid => `<meta data-hid="${hid}" property="${hid}" content="home">`
  ),
  '</head><body><div id="__nuxt"></div></body></html>'
].join('')

const head = {
  title: 'A & B $1 - parolla',
  description: '"quoted" $& text',
  canonical: 'https://www.parolla.app/x/',
  keywords: null,
  headTags: '<link rel="canonical" href="https://www.parolla.app/x/">',
  body: '<h1>x</h1>'
}
const html = applyRouteHead(shell, head)

// `$` sequences stay literal, text is escaped, the homepage keywords go away
assert.ok(html.includes('<title>A &amp; B $1 - parolla</title>'))
assert.ok(html.includes('content="&quot;quoted&quot; $&amp; text"'))
assert.ok(!html.includes('data-hid="keywords"'))
assert.ok(html.includes('<link rel="canonical" href="https://www.parolla.app/x/"></head>'))
assert.ok(html.includes('<div id="__nuxt"><main style="display: none"><h1>x</h1></main></div>'))

// a shell without the tags the rewrite relies on fails the build instead of shipping the homepage head
assert.throws(() => applyRouteHead('<html><head></head></html>', head))

assert.strictEqual(fileFor('/d', '/gunluk/'), '/d/gunluk/index.html')
assert.strictEqual(fileFor('/d', '/kelimeblok/6-harf'), '/d/kelimeblok/6-harf.html')

console.log('route-heads selfcheck OK')
