// Self-check for helpers/communitySeo.js — run: node scripts/community-seo-selfcheck.mjs
import assert from 'node:assert'
import { communityListHead, communityHead, communityPostHead } from '../helpers/communitySeo.js'

const meta = (head, key) => head.meta.find(m => m.hid === key)?.content
const link = (head, key) => head.link.find(l => l.hid === key)?.href
const graph = head => head.script[0].json['@graph']

const community = {
  slug: 'kelime-avcilari',
  name: 'Kelime Avcıları',
  description: 'Kelime oyunu sevenler',
  avatar: 'https://cdn.example/a.png',
  coverPhoto: 'https://cdn.example/c.jpg',
  visibility: 'public',
  tags: ['kelime', 'oyun'],
  memberCount: 12,
  postCount: 3,
  owner: { username: 'selim' },
  createdAt: '2026-10-01T00:00:00.000Z'
}
const post = {
  documentId: 'p1',
  note: 'Bunu deneyin',
  createdAt: '2026-10-02T00:00:00.000Z',
  likeCount: 4,
  commentCount: 2,
  author: { username: 'ayse' },
  community: { slug: community.slug, name: community.name },
  room: { roomId: 'abc', title: 'Başkentler', locale: 'en', coverPhoto: null }
}

// list: canonical ignores the query, own lists / searches are noindex
const list = communityListHead({ locale: 'tr', title: 'T', description: 'D', communities: [community] })
assert.strictEqual(link(list, 'canonical'), 'https://www.parolla.app/topluluklar/')
assert.strictEqual(link(list, 'alternate-en'), 'https://www.parolla.app/en/communities/')
assert.match(meta(list, 'robots'), /^index/)
assert.strictEqual(graph(list)[0].mainEntity.itemListElement[0].url, 'https://www.parolla.app/topluluk/kelime-avcilari')
assert.match(meta(communityListHead({ locale: 'en', title: 'T', description: 'D', filtered: true }), 'robots'), /^noindex/)

// community: cover as og image, counts in the description, private → noindex
const detail = communityHead({ locale: 'en', community, posts: [post] })
assert.strictEqual(link(detail, 'canonical'), 'https://www.parolla.app/en/community/kelime-avcilari')
assert.strictEqual(meta(detail, 'og:image'), community.coverPhoto)
assert.match(meta(detail, 'description'), /12 members and 3 posts/)
assert.strictEqual(graph(detail)[0].hasPart[0].url, 'https://www.parolla.app/en/community/kelime-avcilari/post/p1')
assert.match(meta(communityHead({ locale: 'tr', community: { ...community, visibility: 'private' } }), 'robots'), /^noindex/)
assert.ok(!graph(communityHead({ locale: 'tr', community })).at(0).hasPart, 'no posts → no hasPart')

// post: forum posting, the quiz linked in its own edition
const single = communityPostHead({ locale: 'tr', post })
const posting = graph(single)[0]
assert.strictEqual(posting['@type'], 'DiscussionForumPosting')
assert.strictEqual(link(single, 'canonical'), 'https://www.parolla.app/topluluk/kelime-avcilari/gonderi/p1')
assert.strictEqual(posting.sharedContent.url, 'https://www.parolla.app/en/quiz/abc')
assert.strictEqual(posting.author.url, 'https://www.parolla.app/profil/ayse')
assert.strictEqual(posting.commentCount, 2)
assert.ok(meta(single, 'description').length <= 300)
assert.ok(!posting.comment, 'no comments → no comment field')

// comments: deleted ones skipped, preview replies nested
const reply = { documentId: 'c2', content: 'katılıyorum', createdAt: '2026-10-03T00:00:00.000Z', user: { username: 'selim' } }
const comments = [
  {
    documentId: 'c1',
    content: 'harika',
    createdAt: '2026-10-02T01:00:00.000Z',
    user: { username: 'ayse' },
    likeCount: 1,
    previewReplies: [reply]
  },
  { documentId: 'c3', content: null, isDeleted: true, createdAt: '2026-10-02T02:00:00.000Z', user: null }
]
const withComments = graph(communityPostHead({ locale: 'tr', post, comments }))[0]
assert.strictEqual(withComments.comment.length, 1)
assert.strictEqual(withComments.comment[0]['@type'], 'Comment')
assert.strictEqual(withComments.comment[0].text, 'harika')
assert.strictEqual(withComments.comment[0].url, 'https://www.parolla.app/topluluk/kelime-avcilari/gonderi/p1?comment=c1')
assert.strictEqual(withComments.comment[0].comment[0].author.url, 'https://www.parolla.app/profil/selim')

// every head is valid JSON for the ld+json script
for (const head of [list, detail, single]) JSON.parse(JSON.stringify(head.script[0].json))

console.log('community-seo self-check: ok')
