// Turkish genitive suffix by vowel harmony: selim'in, murat'ın, doğu'nun, gül'ün
export const genitiveSuffix = name => {
  const lower = String(name).toLocaleLowerCase('tr')
  const vowels = lower.match(/[aeıioöuü]/g)
  const last = vowels ? vowels[vowels.length - 1] : 'i'
  const vowel = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[last]

  return /[aeıioöuü]$/.test(lower) ? `n${vowel}n` : `${vowel}n`
}
