// Profile page head (pages/Profile/_username.vue): client-rendered on purpose, Google indexes the rendered SPA
const SITE_URL = 'https://www.parolla.app'

const PATHS = {
  tr: { root: '/profil', tabs: { quizzes: 'quizler', reviews: 'yorumlar', scores: 'skorlar', achievements: 'basarimlar' } },
  en: { root: '/en/profile', tabs: { quizzes: 'quizzes', reviews: 'comments', scores: 'scores', achievements: 'achievements' } }
}

const TEXT = {
  tr: {
    tabs: { reviews: 'Yorumlar', scores: 'Skorlar', achievements: 'Başarımlar' },
    about: username => `${username} adlı oyuncunun parolla profili: oluşturduğu quizler, yorumları ve skorları.`
  },
  en: {
    tabs: { reviews: 'Comments', scores: 'Scores', achievements: 'Achievements' },
    about: username => `${username}'s parolla profile: the quizzes they created, their comments and scores.`
  }
}

const langOf = locale => (locale === 'en' ? 'en' : 'tr')

const profileUrl = (locale, username, tab) => {
  const { root, tabs } = PATHS[langOf(locale)]

  return `${SITE_URL}${root}/${encodeURIComponent(username)}${tab ? `/${tabs[tab]}` : ''}`
}

// quizCount is null until the profile stats load
const buildProfileSeo = ({ player, locale, tab = null, quizCount = null }) => {
  const lang = langOf(locale)
  const text = TEXT[lang]
  const { username } = player
  const name = player.fullname ? `${player.fullname} (@${username})` : `@${username}`
  const title = [name, text.tabs[tab], 'parolla'].filter(Boolean).join(' - ')
  const description = `${player.bio ? `${player.bio.trim()} · ` : ''}${text.about(username)}`.slice(0, 300)
  // the quizzes tab lists the same quizzes as the profile root
  const canonicalTab = tab === 'quizzes' ? null : tab
  const canonical = profileUrl(lang, username, canonicalTab)
  const photo = player.avatarSource === 'profilePhoto' && player.profilePhoto?.url
  const image = photo || `${SITE_URL}/meta/og-main-${lang}.jpg`

  const person = {
    '@type': 'Person',
    name: player.fullname || username,
    alternateName: username,
    identifier: String(player.id),
    url: profileUrl(lang, username),
    image
  }

  if (player.bio) person.description = player.bio

  if (quizCount !== null) {
    person.agentInteractionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WriteAction',
      userInteractionCount: quizCount
    }
  }

  return {
    lang,
    title,
    description,
    canonical,
    alternates: { tr: profileUrl('tr', username, canonicalTab), en: profileUrl('en', username, canonicalTab) },
    image,
    hasPhoto: Boolean(photo),
    // achievements are owner-only; banned or deleted accounts stay out of the index
    noindex: tab === 'achievements' || Boolean(player.blocked || player.isDeleted),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: canonical,
      name: title,
      inLanguage: lang,
      dateCreated: player.createdAt,
      dateModified: player.updatedAt,
      mainEntity: person
    }
  }
}

export const profileHead = args => {
  const seo = buildProfileSeo(args)

  return {
    title: seo.title,
    link: [
      { hid: 'canonical', rel: 'canonical', href: seo.canonical },
      { hid: 'alternate-tr', rel: 'alternate', hreflang: 'tr', href: seo.alternates.tr },
      { hid: 'alternate-en', rel: 'alternate', hreflang: 'en', href: seo.alternates.en },
      { hid: 'alternate-x-default', rel: 'alternate', hreflang: 'x-default', href: seo.alternates.tr }
    ],
    meta: [
      { hid: 'description', name: 'description', content: seo.description },
      { hid: 'robots', name: 'robots', content: seo.noindex ? 'noindex,follow' : 'index,follow' },
      { hid: 'og:type', property: 'og:type', content: 'profile' },
      { hid: 'og:title', property: 'og:title', content: seo.title },
      { hid: 'og:description', property: 'og:description', content: seo.description },
      { hid: 'og:url', property: 'og:url', content: seo.canonical },
      { hid: 'og:image', property: 'og:image', content: seo.image },
      { hid: 'profile:username', property: 'profile:username', content: args.player.username },
      { hid: 'twitter:card', name: 'twitter:card', content: seo.hasPhoto ? 'summary' : 'summary_large_image' },
      { hid: 'twitter:title', name: 'twitter:title', content: seo.title },
      { hid: 'twitter:description', name: 'twitter:description', content: seo.description },
      { hid: 'twitter:url', name: 'twitter:url', content: seo.canonical },
      { hid: 'twitter:image', name: 'twitter:image', content: seo.image }
    ],
    script: [{ hid: 'ld-profile', type: 'application/ld+json', json: seo.jsonLd }]
  }
}
