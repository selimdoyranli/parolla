// 1-2 letters for the avatar fallback: first letters of the first two words, else the first two letters
const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words.slice(0, 2).map(w => Array.from(w)[0]) : Array.from(words[0] || '').slice(0, 2)

  return letters.join('').toLocaleUpperCase('tr')
}

export default model => ({ ...model, postCount: model.postCount ?? 0, avatarInitials: getInitials(model.name) })
