// Self-check for functions/quiz/_seo.js helpers — run: node scripts/quiz-seo-selfcheck.mjs
import assert from 'node:assert'
import { escapeHtml, jsonLdTag, clip, isIndexable, HAS_QUIZ } from '../functions/quiz/_seo.js'
import { isIndexableCommunity } from '../functions/topluluk/_seo.js'

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

// quiz titles: no repeated "quiz", Turkish casing included
assert.ok(['Futbol Quiz', 'FUTBOL QUİZ', 'quiz: başkentler', 'Quız'].every(t => HAS_QUIZ.test(t)))
assert.ok(!['Başkentler', 'Squad'].some(t => HAS_QUIZ.test(t)))

// communities: private and hidden ones never get indexed
assert.ok(isIndexableCommunity({ slug: 'tarih', name: 'Tarih', visibility: 'public' }))
assert.ok(isIndexableCommunity({ slug: 'derin', name: 'Derin', visibility: 'restricted' }))
assert.ok(!isIndexableCommunity({ slug: 'gizli', name: 'Gizli', visibility: 'private' }))
assert.ok(!isIndexableCommunity({ slug: 'x', name: 'X', visibility: 'public', isHidden: true }))
assert.ok(!isIndexableCommunity(undefined))

console.log('quiz-seo selfcheck OK')
