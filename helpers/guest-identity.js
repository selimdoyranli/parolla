const ADJECTIVES = [
  'Mutlu',
  'Hizli',
  'Cesur',
  'Bilge',
  'Sirin',
  'Komik',
  'Gizli',
  'Yildizli',
  'Kirmizi',
  'Mavi',
  'Sari',
  'Yesil',
  'Mor',
  'Beyaz',
  'Siyah',
  'Altin',
  'Gumus',
  'Buyuk',
  'Kucuk',
  'Tatli',
  'Hayalci',
  'Atik',
  'Sessiz',
  'Neseli',
  'Sevimli',
  'Asik',
  'Yalniz',
  'Yarim',
  'Tasli',
  'Buzlu',
  'Atesli',
  'Ruzgar',
  'Yagmurlu',
  'Karli',
  'Gunesli',
  'Pastel',
  'Parlak',
  'Solgun',
  'Yumusak',
  'Sert',
  'Kibar',
  'Hain',
  'Sakar',
  'Acemi',
  'Usta',
  'Tembel',
  'Calikan',
  'Yaramaz',
  'Uslu',
  'Genc'
]

const NOUNS = [
  'Kedi',
  'Kaplan',
  'Kartal',
  'Yildiz',
  'Aslan',
  'Kus',
  'Yilan',
  'Balina',
  'Ayi',
  'Kurt',
  'Tilki',
  'Tavsan',
  'Geyik',
  'Sahin',
  'Baykus',
  'Karga',
  'Penguen',
  'Yunus',
  'Kobra',
  'Panter',
  'Cita',
  'Maymun',
  'Fil',
  'Zurafa',
  'Antilop',
  'Bizon',
  'Manda',
  'Kuzu',
  'Ceylan',
  'Sincap',
  'Kunduz',
  'Kirpi',
  'Atmaca',
  'Akrep',
  'Yengec',
  'Ahtapot',
  'Denizyildizi',
  'Mercan',
  'Inci',
  'Yakut',
  'Zumrut',
  'Elmas',
  'Safir',
  'Opal',
  'Aytasi',
  'Gunes',
  'Ay',
  'Komet',
  'Gezegen',
  'Meteor'
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateGuestUsername() {
  const adj = pickRandom(ADJECTIVES)
  const noun = pickRandom(NOUNS)
  const num = Math.floor(Math.random() * 9990) + 10 // 10..9999

  return `${adj}${noun}${num}`
}

// crypto.randomUUID is available in all evergreen browsers + Node 14.17+. We
// guard for older runtimes anyway because parolla is shipped as a static SPA
// that's been opened from very stale browser sessions in the past.
function uuidV4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback per RFC 4122 §4.4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8

    return v.toString(16)
  })
}

export function generateGuestIdentity() {
  return {
    id: uuidV4(),
    name: generateGuestUsername(),
    avatarSeed: uuidV4()
  }
}

export { generateGuestUsername, uuidV4 }
