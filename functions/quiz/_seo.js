// Crawler-facing SEO for the quiz pages of the ssr:false SPA. The static shell gets the
// quiz's own title/meta/JSON-LD plus a short text block inside #__nuxt, so crawlers that
// don't run JS (GPTBot, ClaudeBot, PerplexityBot …) see real content. Vue replaces
// #__nuxt on mount, so users never see the block and Google's rendered DOM is unchanged.
//
// Only the small Strapi JSON is cached (Cache API), never the rewritten HTML: the shell
// references hashed /_nuxt bundles that change on every deploy.
// Copy must stay in step with seo.creatorModeQuiz / seo.creatorModeQuizzes in locales/*.js.

const BASE_URL = 'https://www.parolla.app'
const STRAPI_FALLBACK_BASE = 'https://strapi.parolla.app/api'
const FETCH_TIMEOUT_MS = 3000
const DATA_TTL = { quiz: 86400, list: 21600 }
const LIST_SIZE = 30

const COPY = {
  tr: {
    strapiLocale: 'tr-TR',
    quizPath: slug => `/quiz/${slug}`,
    listPath: '/quizler/',
    home: 'Anasayfa',
    quizzes: 'Quizler',
    quizTitle: title => `${title} Quiz Çöz`,
    quizDescription: title => `${title} quizini çöz! Ücretsiz online quiz, hemen oyna.`,
    questions: n => `${n} soru`,
    author: name => `Oluşturan: ${name}`,
    tags: 'Etiketler',
    allQuizzes: 'Tüm quizler',
    listTitle: 'Quiz Çöz – Binlerce Ücretsiz Türkçe Quiz',
    listHeading: 'Quiz Çöz',
    listDescription: 'Oyuncuların oluşturduğu binlerce ücretsiz quizi çöz ya da kendi quizini oluştur.',
    popular: 'Popüler quizler'
  },
  en: {
    strapiLocale: 'en',
    quizPath: slug => `/en/quiz/${slug}`,
    listPath: '/en/quizzes/',
    home: 'Home',
    quizzes: 'Quizzes',
    quizTitle: title => `${title} Quiz`,
    quizDescription: title => `Solve the "${title}" quiz! Free online quiz, play now.`,
    questions: n => `${n} questions`,
    author: name => `Created by ${name}`,
    tags: 'Tags',
    allQuizzes: 'All quizzes',
    listTitle: 'Solve Quizzes – Free Player-made Quizzes',
    listHeading: 'Solve Quizzes',
    listDescription: 'Solve thousands of free quizzes created by players or create your own quiz.',
    popular: 'Popular quizzes'
  }
}

export const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// `<` escaped so user text can never close the script tag
export const jsonLdTag = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

export const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

const cachedJson = async (context, url, ttl) => {
  const cache = caches.default
  const key = new Request(`${new URL(context.request.url).origin}/__seo-data?u=${encodeURIComponent(url)}`)
  const hit = await cache.match(key)

  if (hit) {
    return hit.json()
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

  if (!res.ok) {
    throw new Error(`strapi ${res.status}`)
  }

  const body = await res.text()

  context.waitUntil(
    cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}` } }))
  )

  return JSON.parse(body)
}

const questionCount = room => room.questionCount || room.flashcardCount || room.choices?.length || 0

const coverUrl = room => {
  const url = room.coverPhoto?.url

  if (!url) {
    return null
  }

  return url.startsWith('/') ? `https://strapi.parolla.app${url}` : url
}

// Swaps the shell's homepage head for page-specific values and drops the content block into #__nuxt
const rewrite = (response, { title, description, canonical, image, jsonLd, body }) => {
  const setContent = value => ({
    element(el) {
      el.setAttribute('content', value)
    }
  })

  let rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title)
      }
    })
    .on('meta[data-hid="description"]', setContent(description))
    .on('meta[data-hid="og:title"]', setContent(title))
    .on('meta[data-hid="twitter:title"]', setContent(title))
    .on('meta[data-hid="og:description"]', setContent(description))
    .on('meta[data-hid="twitter:description"]', setContent(description))
    .on('meta[data-hid="og:url"]', setContent(canonical))
    .on('meta[data-hid="twitter:url"]', setContent(canonical))
    .on('meta[data-hid="keywords"]', {
      element(el) {
        el.remove()
      }
    })
    .on('head', {
      element(el) {
        el.append(`<link rel="canonical" href="${escapeHtml(canonical)}">${jsonLd.map(jsonLdTag).join('')}`, { html: true })
      }
    })
    .on('div#__nuxt', {
      element(el) {
        el.prepend(`<main style="display: none">${body}</main>`, { html: true })
      }
    })

  if (image) {
    rewriter = rewriter.on('meta[data-hid="og:image"]', setContent(image)).on('meta[data-hid="twitter:image"]', setContent(image))
  }

  return rewriter.transform(response)
}

// Strapi already forces isPublic on the listing; checked again so a controller change can't leak unlisted quizzes
export const isIndexable = room =>
  Boolean(room?.roomId && room.title) && room.isPublic === true && room.isVisible !== false && !room.isSystemRemovedFromPublic

const noindex = response =>
  new HTMLRewriter()
    .on('meta[data-hid="robots"]', {
      element(el) {
        el.setAttribute('content', 'noindex, follow')
      }
    })
    .transform(response)

const isHtml = response => response.ok && (response.headers.get('Content-Type') || '').includes('text/html')

export const quizPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]
  const slug = context.params.slug

  if (!isHtml(shell) || !slug) {
    return shell
  }

  try {
    // filters[$and] on purpose: the room controller bumps viewCount whenever filters.roomId is
    // set (and findOne always does), so crawler hits would inflate view counts
    const query = `locale=${copy.strapiLocale}&filters[$and][0][roomId][$eq]=${encodeURIComponent(
      slug
    )}&filters[isPublic][$eq]=true&pagination[pageSize]=1`
    const data = await cachedJson(context, `${context.env.STRAPI_API_URL || STRAPI_FALLBACK_BASE}/rooms?${query}`, DATA_TTL.quiz)
    const room = data?.data?.[0]

    // unlisted (isPublic false), hidden, removed or missing: the public listing returns nothing → keep it out of the index
    if (!isIndexable(room)) {
      return noindex(shell)
    }

    const title = `${copy.quizTitle(room.title)} | parolla`
    const description = clip((room.description || '').trim() || copy.quizDescription(room.title), 160)
    const canonical = `${BASE_URL}${copy.quizPath(room.roomId)}`
    const listUrl = `${BASE_URL}${copy.listPath}`
    const tags = (room.roomTags || []).map(tag => tag.title).filter(Boolean)
    const count = questionCount(room)
    const username = room.user?.username
    const facts = [count && copy.questions(count), username && copy.author(username)].filter(Boolean)

    const body = [
      `<h1>${escapeHtml(copy.quizTitle(room.title))}</h1>`,
      `<p>${escapeHtml(description)}</p>`,
      facts.length && `<p>${escapeHtml(facts.join(' · '))}</p>`,
      tags.length && `<p>${copy.tags}: ${escapeHtml(tags.join(', '))}</p>`,
      `<a href="${copy.listPath}">${copy.allQuizzes}</a>`
    ]
      .filter(Boolean)
      .join('')

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: room.title,
        description,
        url: canonical,
        inLanguage: locale,
        isAccessibleForFree: true,
        ...(tags.length && { keywords: tags.join(', ') }),
        ...(room.createdAt && { dateCreated: room.createdAt }),
        ...(room.updatedAt && { dateModified: room.updatedAt }),
        ...(username && { author: { '@type': 'Person', name: username } }),
        publisher: { '@type': 'Organization', name: 'parolla', url: BASE_URL }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: copy.home, item: locale === 'tr' ? BASE_URL : `${BASE_URL}/en` },
          { '@type': 'ListItem', position: 2, name: copy.quizzes, item: listUrl },
          { '@type': 'ListItem', position: 3, name: room.title, item: canonical }
        ]
      }
    ]

    return rewrite(shell, { title, description, canonical, image: coverUrl(room), jsonLd, body })
  } catch (err) {
    console.error('[quiz-seo] quiz page:', String((err && err.message) || err))

    return shell
  }
}

export const quizListPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]

  if (!isHtml(shell)) {
    return shell
  }

  try {
    const query = `locale=${copy.strapiLocale}&filters[isVisible][$eq]=true&filters[isPublic][$eq]=true&sort=viewCount:desc&pagination[pageSize]=${LIST_SIZE}`
    const data = await cachedJson(context, `${context.env.STRAPI_API_URL || STRAPI_FALLBACK_BASE}/rooms?${query}`, DATA_TTL.list)
    const rooms = (data?.data || []).filter(isIndexable)
    const title = `${copy.listTitle} | parolla`
    const canonical = `${BASE_URL}${copy.listPath}`

    const body = [
      `<h1>${copy.listHeading}</h1>`,
      `<p>${copy.listDescription}</p>`,
      rooms.length &&
        `<h2>${copy.popular}</h2><ul>${rooms
          .map(room => `<li><a href="${copy.quizPath(encodeURIComponent(room.roomId))}">${escapeHtml(copy.quizTitle(room.title))}</a></li>`)
          .join('')}</ul>`
    ]
      .filter(Boolean)
      .join('')

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: copy.listTitle,
        description: copy.listDescription,
        url: canonical,
        inLanguage: locale,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: rooms.map((room, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: room.title,
            url: `${BASE_URL}${copy.quizPath(encodeURIComponent(room.roomId))}`
          }))
        }
      }
    ]

    return rewrite(shell, { title, description: copy.listDescription, canonical, image: null, jsonLd, body })
  } catch (err) {
    console.error('[quiz-seo] quiz list:', String((err && err.message) || err))

    return shell
  }
}
