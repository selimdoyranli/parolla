// Crawler-facing SEO for the community pages, same approach as functions/quiz/_seo.js: the static
// shell gets the head that helpers/communitySeo.js builds on the client, plus a hidden text block
// inside #__nuxt for crawlers that don't run JS. Reusing the client helper keeps both heads identical.
//
// Private and hidden communities never get content: private ones are noindex, hidden ones 404 in Strapi.

import { communityHead, communityListHead } from '../../helpers/communitySeo.js'
import { cachedJson, escapeHtml, jsonLdTag, isHtml, noindex } from '../quiz/_seo.js'

const STRAPI_FALLBACK_BASE = 'https://strapi.parolla.app/api'
const DATA_TTL = { community: 21600, list: 21600 }
const LIST_SIZE = 30

// list title/description mirror seo.communityList + seo.main.title in locales/*.js
const COPY = {
  tr: {
    listPath: '/topluluklar/',
    communityPath: slug => `/topluluk/${slug}`,
    listTitle: 'Topluluklar, ortak ilgi alanlarında quiz paylaş - parolla - Kelime oyunu',
    listHeading: 'Topluluklar',
    listDescription: 'Topluluklara katıl, kendi topluluğunu kur ve quizleri birlikte paylaş',
    allCommunities: 'Tüm topluluklar',
    tags: 'Etiketler'
  },
  en: {
    listPath: '/en/communities/',
    communityPath: slug => `/en/community/${slug}`,
    listTitle: 'Communities, share quizzes around shared interests - parolla - Word game',
    listHeading: 'Communities',
    listDescription: 'Join communities, start your own and share quizzes together',
    allCommunities: 'All communities',
    tags: 'Tags'
  }
}

export const isIndexableCommunity = community =>
  Boolean(community?.slug && community.name) && community.visibility !== 'private' && !community.isHidden

const strapiBase = context => context.env.STRAPI_API_URL || STRAPI_FALLBACK_BASE

// Applies a vue-meta style head ({ title, meta, link, script }) to the shell; every meta hid it sets already exists there
const applyHead = (response, head, body) => {
  const rewriter = new HTMLRewriter().on('title', {
    element(el) {
      el.setInnerContent(head.title)
    }
  })

  for (const { hid, content } of head.meta) {
    rewriter.on(`meta[data-hid="${hid}"]`, {
      element(el) {
        el.setAttribute('content', content)
      }
    })
  }

  const links = head.link.map(
    ({ rel, hreflang, href }) => `<link rel="${rel}"${hreflang ? ` hreflang="${hreflang}"` : ''} href="${escapeHtml(href)}">`
  )
  const scripts = head.script.map(({ json }) => jsonLdTag(json))

  return rewriter
    .on('meta[data-hid="keywords"]', {
      element(el) {
        el.remove()
      }
    })
    .on('head', {
      element(el) {
        el.append([...links, ...scripts].join(''), { html: true })
      }
    })
    .on('div#__nuxt', {
      element(el) {
        el.prepend(`<main style="display: none">${body}</main>`, { html: true })
      }
    })
    .transform(response)
}

export const communityPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]
  const slug = context.params.slug

  if (!isHtml(shell) || !slug) {
    return shell
  }

  try {
    const data = await cachedJson(context, `${strapiBase(context)}/communities/slug/${encodeURIComponent(slug)}`, DATA_TTL.community)
    const community = data?.data

    if (!isIndexableCommunity(community)) {
      return noindex(shell)
    }

    const head = communityHead({ locale, community })
    const description = head.meta.find(meta => meta.hid === 'description').content
    const tags = community.tags || []

    const body = [
      `<h1>${escapeHtml(community.name)}</h1>`,
      `<p>${escapeHtml(description)}</p>`,
      tags.length && `<p>${copy.tags}: ${escapeHtml(tags.join(', '))}</p>`,
      `<a href="${copy.listPath}">${copy.allCommunities}</a>`
    ]
      .filter(Boolean)
      .join('')

    return applyHead(shell, head, body)
  } catch (err) {
    // hidden or deleted: Strapi says 404 → keep it out of the index
    if (err?.status === 404) {
      return noindex(shell)
    }

    console.error('[community-seo] community page:', String((err && err.message) || err))

    return shell
  }
}

export const communityListPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]

  if (!isHtml(shell)) {
    return shell
  }

  try {
    // Strapi already leaves private communities out of the list; filtered again so a change there can't leak them
    const data = await cachedJson(context, `${strapiBase(context)}/communities?sort=memberCount&pageSize=${LIST_SIZE}`, DATA_TTL.list)
    const communities = (data?.data || []).filter(isIndexableCommunity)
    const head = communityListHead({ locale, title: copy.listTitle, description: copy.listDescription, communities })

    const body = [
      `<h1>${copy.listHeading}</h1>`,
      `<p>${copy.listDescription}</p>`,
      communities.length &&
        `<ul>${communities
          .map(
            community => `<li><a href="${copy.communityPath(encodeURIComponent(community.slug))}">${escapeHtml(community.name)}</a></li>`
          )
          .join('')}</ul>`
    ]
      .filter(Boolean)
      .join('')

    return applyHead(shell, head, body)
  } catch (err) {
    console.error('[community-seo] community list:', String((err && err.message) || err))

    return shell
  }
}
