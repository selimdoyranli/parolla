// Draw mode category ordering: a small, deliberate priority list comes first
// (genel, yemekler, meslekler) so the "most generic" tabs appear at the top
// regardless of locale-specific Strapi sort. Everything else falls back to
// alphabetical by title, ignoring locale-specific accents.
const PRIORITY_SLUGS = ['genel', 'yemekler', 'meslekler']

function categoryTitle(item) {
  return String(item.title || item.categoryTitle || item.slug || '')
}

export function sortDrawCategories(cats) {
  if (!Array.isArray(cats)) return []
  const cmp = (a, b) => {
    const ia = PRIORITY_SLUGS.indexOf(a.slug)
    const ib = PRIORITY_SLUGS.indexOf(b.slug)

    if (ia !== -1 && ib !== -1) return ia - ib

    if (ia !== -1) return -1

    if (ib !== -1) return 1

    return categoryTitle(a).localeCompare(categoryTitle(b), 'tr')
  }

  return [...cats].sort(cmp)
}

export function buildCategoryTitleMap(cats) {
  const map = {}

  if (!Array.isArray(cats)) return map

  for (const c of cats) {
    if (c && c.slug) map[c.slug] = c.title || c.slug
  }

  return map
}
