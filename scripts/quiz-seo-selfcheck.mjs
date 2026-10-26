// Self-check for functions/quiz/_seo.js helpers — run: node scripts/quiz-seo-selfcheck.mjs
import assert from 'node:assert'
import { escapeHtml, jsonLdTag, clip, isIndexable } from '../functions/quiz/_seo.js'

assert.strictEqual(escapeHtml('<b>"Tom" & Jerry\'s</b>'), '&lt;b&gt;&quot;Tom&quot; &amp; Jerry&#39;s&lt;/b&gt;')
assert.strictEqual(escapeHtml(null), '')

// user text must not be able to close the JSON-LD script tag
const tag = jsonLdTag({ name: '</script><script>alert(1)</script>' })
assert.ok(!tag.slice(0, -9).includes('</script>'))
assert.deepStrictEqual(JSON.parse(tag.slice(35, -9)), { name: '</script><script>alert(1)</script>' })

assert.strictEqual(clip('kısa', 160), 'kısa')
assert.strictEqual(clip('x'.repeat(200), 160).length, 160)

const room = { roomId: 'abc', title: 'Başkentler', isPublic: true, isVisible: true }
assert.strictEqual(isIndexable(room), true)
assert.strictEqual(isIndexable({ ...room, isPublic: false }), false)
assert.strictEqual(isIndexable({ ...room, isPublic: undefined }), false)
assert.strictEqual(isIndexable({ ...room, isVisible: false }), false)
assert.strictEqual(isIndexable({ ...room, isSystemRemovedFromPublic: true }), false)
assert.strictEqual(isIndexable(undefined), false)

console.log('quiz-seo selfcheck OK')
