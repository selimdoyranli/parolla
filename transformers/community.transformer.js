// 1-2 letters for the avatar fallback: first letters of the first two words, else the first two letters
// e.g. getInitials('qa11 b quiz') === 'QB', getInitials('quiz') === 'QU', getInitials('... !') === ''
export const getInitials = (name = '') => {
  const words = name
    .split(/\s+/)
    .filter(w => /[\p{L}\p{N}]/u.test(w))
    .map(w => w.replace(/^[^\p{L}\p{N}]+/u, ''))
  const letters = words.length > 1 ? words.slice(0, 2).map(w => Array.from(w)[0]) : Array.from(words[0] || '').slice(0, 2)

  return letters.join('').toLocaleUpperCase('tr')
}

export default model => ({ ...model, postCount: model.postCount ?? 0, avatarInitials: getInitials(model.name) })
