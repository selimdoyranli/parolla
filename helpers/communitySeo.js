// Community page heads (list, community, post): client-rendered on purpose like profileSeo, Google indexes the rendered SPA
const SITE_URL = 'https://www.parolla.app'

// communities aren't per edition: the same community/post lives under both locale paths
const PATHS = {
  tr: { list: '/topluluklar', community: '/topluluk', post: 'gonderi', profile: '/profil', quiz: '/quiz' },
  en: { list: '/en/communities', community: '/en/community', post: 'post', profile: '/en/profile', quiz: '/quiz' }
}

const TEXT = {
  tr: {
    brand: 'parolla toplulukları',
    home: 'Ana sayfa',
    list: 'Topluluklar',
    about: (name, members, posts) =>
      `${name}: ${members} üyeli parolla topluluğu, ${posts} gönderi. Quizleri paylaş, yorum yap, birlikte oyna.`,
    postAbout: (author, community) => `${author}, ${community} topluluğunda paylaştı.`
  },
  en: {
    brand: 'parolla communities',
    home: 'Home',
    list: 'Communities',
    about: (name, members, posts) =>
      `${name}: a parolla community with ${members} members and ${posts} posts. Share quizzes, comment and play together.`,
    postAbout: (author, community) => `Shared by ${author} in the ${community} community.`
  }
}

const langOf = locale => (locale === 'en' ? 'en' : 'tr')
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)
const ogImage = lang => `${SITE_URL}/meta/og-main-${lang}.jpg`

// trailing slash: the static host 308s /topluluklar to /topluluklar/, a canonical must not redirect
export const communityListUrl = lang => `${SITE_URL}${PATHS[lang].list}/`
export const communityUrl = (lang, slug) => `${SITE_URL}${PATHS[lang].community}/${encodeURIComponent(slug)}`
export const communityPostUrl = (lang, slug, postId) => `${communityUrl(lang, slug)}/${PATHS[lang].post}/${encodeURIComponent(postId)}`
const profileUrl = (lang, username) => `${SITE_URL}${PATHS[lang].profile}/${encodeURIComponent(username)}`

const person = (lang, user) =>
  user?.username
    ? { '@type': 'Person', name: user.fullname || user.username, alternateName: user.username, url: profileUrl(lang, user.username) }
    : { '@type': 'Person', name: 'parolla' }

const counter = (type, count) => ({
  '@type': 'InteractionCounter',
  interactionType: `https://schema.org/${type}`,
  userInteractionCount: Number(count) || 0
})

const breadcrumb = (lang, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: TEXT[lang].home, item: `${SITE_URL}${lang === 'en' ? '/en' : '/'}` }, ...items].map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    ...entry
  }))
})

// shared head shape: canonical + reciprocal hreflang, og/twitter, robots, one JSON-LD graph
const toHead = ({ title, description, canonical, alternates, image, type = 'website', noindex = false, jsonLd }) => ({
  title,
  link: [
    { hid: 'canonical', rel: 'canonical', href: canonical },
    { hid: 'alternate-tr', rel: 'alternate', hreflang: 'tr', href: alternates.tr },
    { hid: 'alternate-en', rel: 'alternate', hreflang: 'en', href: alternates.en },
    { hid: 'alternate-x-default', rel: 'alternate', hreflang: 'x-default', href: alternates.tr }
  ],
  meta: [
    { hid: 'description', name: 'description', content: description },
    { hid: 'robots', name: 'robots', content: noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large' },
    { hid: 'og:type', property: 'og:type', content: type },
    { hid: 'og:title', property: 'og:title', content: title },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'og:url', property: 'og:url', content: canonical },
    { hid: 'og:image', property: 'og:image', content: image },
    { hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { hid: 'twitter:title', name: 'twitter:title', content: title },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    { hid: 'twitter:url', name: 'twitter:url', content: canonical },
    { hid: 'twitter:image', name: 'twitter:image', content: image }
  ],
  script: [{ hid: 'ld-community', type: 'application/ld+json', json: { '@context': 'https://schema.org', '@graph': jsonLd } }]
})

/**
 * Communities list. Searches and the viewer's own lists (joined/owned) stay out of the index.
 * @param {{ locale: string, title: string, description: string, communities: object[], filtered: boolean }} args
 */
export const communityListHead = ({ locale, title, description, communities = [], filtered = false }) => {
  const lang = langOf(locale)
  const canonical = communityListUrl(lang)

  return toHead({
    title,
    description,
    canonical,
    alternates: { tr: communityListUrl('tr'), en: communityListUrl('en') },
    image: ogImage(lang),
    noindex: filtered,
    jsonLd: [
      {
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: title,
        description,
        inLanguage: lang,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: communities.slice(0, 20).map((community, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: communityUrl(lang, community.slug),
            name: community.name
          }))
        }
      },
      breadcrumb(lang, [{ name: TEXT[lang].list, item: canonical }])
    ]
  })
}

/**
 * One community: an Organization-like group with its latest posts as forum threads.
 * Private and hidden communities are noindex (their feed is members-only anyway).
 */
export const communityHead = ({ locale, community, posts = [] }) => {
  const lang = langOf(locale)
  const text = TEXT[lang]
  const canonical = communityUrl(lang, community.slug)
  const title = `${community.name} - ${text.brand}`
  const members = Number(community.memberCount) || 0
  const postCount = Number(community.postCount) || 0
  const description = clip(
    community.description
      ? `${community.description.trim()} · ${text.about(community.name, members, postCount)}`
      : text.about(community.name, members, postCount),
    300
  )

  return toHead({
    title,
    description,
    canonical,
    alternates: { tr: communityUrl('tr', community.slug), en: communityUrl('en', community.slug) },
    image: community.coverPhoto || community.avatar || ogImage(lang),
    noindex: community.visibility === 'private' || Boolean(community.isHidden),
    jsonLd: [
      {
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: title,
        description,
        inLanguage: lang,
        dateCreated: community.createdAt,
        mainEntity: {
          '@type': 'Organization',
          name: community.name,
          url: canonical,
          ...(community.description && { description: community.description }),
          ...(community.avatar && { logo: community.avatar }),
          ...(community.coverPhoto && { image: community.coverPhoto }),
          ...(community.tags?.length && { keywords: community.tags.join(', ') }),
          foundingDate: community.createdAt,
          ...(community.owner?.username && { founder: person(lang, community.owner) }),
          interactionStatistic: [counter('JoinAction', members), counter('WriteAction', postCount)]
        },
        ...(posts.length && {
          hasPart: posts.slice(0, 10).map(post => ({
            '@type': 'DiscussionForumPosting',
            url: communityPostUrl(lang, community.slug, post.documentId),
            headline: clip(post.room?.title || post.note || community.name, 110),
            author: person(lang, post.author),
            datePublished: post.createdAt
          }))
        })
      },
      breadcrumb(lang, [
        { name: text.list, item: communityListUrl(lang) },
        { name: community.name, item: canonical }
      ])
    ]
  })
}

/**
 * One post: Google's DiscussionForumPosting (forum rich result), the shared quiz as its sharedContent.
 */
export const communityPostHead = ({ locale, post }) => {
  const lang = langOf(locale)
  const text = TEXT[lang]
  const { community, room, author } = post
  const canonical = communityPostUrl(lang, community.slug, post.documentId)
  const authorName = author?.username || 'parolla'
  const headline = clip(room?.title || post.note || community.name, 110)
  const title = `${headline} - ${community.name} - ${text.brand}`
  const description = clip(
    post.note ? `${post.note.trim()} · ${text.postAbout(authorName, community.name)}` : text.postAbout(authorName, community.name),
    300
  )
  // a quiz lives in one edition (tr-TR / tr / en): link it there, like the card does
  const quizUrl = room && `${SITE_URL}${room.locale?.startsWith('en') ? '/en' : ''}/quiz/${encodeURIComponent(room.roomId)}`

  return toHead({
    title,
    description,
    canonical,
    alternates: {
      tr: communityPostUrl('tr', community.slug, post.documentId),
      en: communityPostUrl('en', community.slug, post.documentId)
    },
    image: room?.coverPhoto?.url || community.coverPhoto || ogImage(lang),
    type: 'article',
    noindex: community.visibility === 'private' || Boolean(community.isHidden),
    jsonLd: [
      {
        '@type': 'DiscussionForumPosting',
        '@id': canonical,
        url: canonical,
        mainEntityOfPage: canonical,
        headline,
        ...(post.note && { text: post.note }),
        inLanguage: lang,
        author: person(lang, author),
        datePublished: post.createdAt,
        isPartOf: { '@type': 'CollectionPage', url: communityUrl(lang, community.slug), name: community.name },
        commentCount: Number(post.commentCount) || 0,
        interactionStatistic: [counter('LikeAction', post.likeCount), counter('CommentAction', post.commentCount)],
        ...(room && {
          sharedContent: { '@type': 'Quiz', name: room.title, url: quizUrl, ...(room.coverPhoto?.url && { image: room.coverPhoto.url }) }
        })
      },
      breadcrumb(lang, [
        { name: text.list, item: communityListUrl(lang) },
        { name: community.name, item: communityUrl(lang, community.slug) },
        { name: headline, item: canonical }
      ])
    ]
  })
}
