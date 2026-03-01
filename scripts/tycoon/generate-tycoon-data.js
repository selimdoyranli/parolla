const fs = require('fs')
const path = require('path')

class TycoonDataGenerator {
  constructor(config = {}) {
    this.config = config
    this.usedNames = new Set()
    this.seed = config.seed || 42
  }

  seededRandom() {
    this.seed = (this.seed * 16807) % 2147483647

    return (this.seed - 1) / 2147483646
  }

  shuffle(array) {
    const arr = [...array]

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    return arr
  }

  hashString(str) {
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return Math.abs(hash)
  }

  assignEmoji(name) {
    const { emojiMap = {}, prefixEmoji = {}, diverseEmojis = [] } = this.config

    // Exact or suffix/root match
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (name.includes(key)) return emoji
    }

    // Prefix match
    for (const [key, emoji] of Object.entries(prefixEmoji)) {
      if (name.includes(key)) return emoji
    }

    // Diverse emoji fallback via deterministic hash
    if (diverseEmojis && diverseEmojis.length > 0) {
      const index = this.hashString(name) % diverseEmojis.length

      return diverseEmojis[index]
    }

    return '❓'
  }

  getTier(id) {
    if (id <= 100) return 1

    if (id <= 200) return 2

    if (id <= 300) return 3

    if (id <= 400) return 4

    if (id <= 500) return 5

    if (id <= 600) return 6

    if (id <= 700) return 7

    if (id <= 800) return 8

    if (id <= 900) return 9

    return 10
  }

  generate() {
    const {
      gameName = 'Generic Tycoon',
      currency = 'gold',
      tickSeconds = 1,
      targetItemsCount = 1000,
      prefixes = [],
      baseItems = [],
      existingItems = [],
      costMultRange = [1.015, 1.03],
      gpsMultRange = [1.013, 1.025],
      outputPath
    } = this.config

    const allItems = [...existingItems]

    for (const item of allItems) {
      if (!item.icon) {
        item.icon = this.assignEmoji(item.name)
      }
      this.usedNames.add(item.name)
    }

    const allNames = []
    const shuffledBases = this.shuffle(baseItems)

    for (const base of shuffledBases) {
      if (!this.usedNames.has(base)) {
        allNames.push(base)
        this.usedNames.add(base)
      }
    }

    const shuffledPrefixes = this.shuffle(prefixes)

    for (const prefix of shuffledPrefixes) {
      for (const base of this.shuffle(baseItems)) {
        const name = `${prefix} ${base}`

        if (!this.usedNames.has(name)) {
          allNames.push(name)
          this.usedNames.add(name)
        }

        if (allNames.length + allItems.length >= targetItemsCount) break
      }

      if (allNames.length + allItems.length >= targetItemsCount) break
    }

    let currentCost = allItems.length > 0 ? allItems[allItems.length - 1].cost : 10
    let currentGPS = allItems.length > 0 ? allItems[allItems.length - 1].goldPerSecond : 1
    let nextId = allItems.length > 0 ? allItems[allItems.length - 1].id + 1 : 1

    let nameIndex = 0
    while (allItems.length < targetItemsCount && nameIndex < allNames.length) {
      const costMult = costMultRange[0] + this.seededRandom() * (costMultRange[1] - costMultRange[0])
      const gpsMult = gpsMultRange[0] + this.seededRandom() * (gpsMultRange[1] - gpsMultRange[0])

      currentCost = Math.round(currentCost * costMult)
      currentGPS = Math.round(currentGPS * gpsMult)

      const id = nextId++
      const name = allNames[nameIndex++]
      const tier = this.getTier(id)
      const icon = this.assignEmoji(name)

      allItems.push({
        id,
        name,
        cost: currentCost,
        goldPerSecond: currentGPS,
        tier,
        icon
      })
    }

    const output = {
      game: gameName,
      currency: currency,
      tickSeconds: tickSeconds,
      items: allItems
    }

    if (outputPath) {
      const dir = path.dirname(outputPath)

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const jsonStr = JSON.stringify(output, null, 2)
      fs.writeFileSync(outputPath, jsonStr, 'utf-8')
      console.log(`\nSaved to ${outputPath}`)
      console.log(`Total items: ${allItems.length}`)
      console.log(`File size: ${(Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2)} MB`)

      this.verify(allItems)
    }

    return output
  }

  verify(allItems) {
    const nameSet = new Set(allItems.map(i => i.name))
    console.log(`\nUnique names: ${nameSet.size} / ${allItems.length}`)

    if (nameSet.size !== allItems.length) {
      console.error('WARNING: Duplicate names detected!')
    }

    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].id !== i + 1) {
        console.error(`ID mismatch at index ${i}: expected ${i + 1}, got ${allItems[i].id}`)
        break
      }
    }
    console.log('All IDs sequential: OK\n')
    console.log('Sample items:')

    for (const sampleId of [1, 24, 25, 50, 100, 200, 300, 500, 750, 1000]) {
      const item = allItems[sampleId - 1]

      if (item) {
        console.log(
          `  #${item.id} [Tier ${item.tier}] ${item.icon} "${
            item.name
          }" - Cost: ${item.cost.toLocaleString()}, GPS: ${item.goldPerSecond.toLocaleString()}`
        )
      }
    }
  }
}

module.exports = TycoonDataGenerator

if (require.main === module) {
  const prefixes = [
    'Antik',
    'Dijital',
    'Altın',
    'Gümüş',
    'Bronz',
    'Kristal',
    'Elmas',
    'Zümrüt',
    'Yakut',
    'Safir',
    'Titan',
    'Kozmik',
    'Mistik',
    'Kadim',
    'Kutsal',
    'İmparatorluk',
    'Kraliyet',
    'Ejderha',
    'Anka',
    'Sihirli',
    'Büyülü',
    'Efsanevi',
    'Mitolojik',
    'Galaktik',
    'Yıldız',
    'Güneş',
    'Ay',
    'Fırtına',
    'Şimşek',
    'Volkanik',
    'Okyanus',
    'Bulut',
    'Rüzgar',
    'Ateş',
    'Buz',
    'Gölge',
    'Işık',
    'Karanlık',
    'Parlak',
    'Gökkuşağı',
    'Platin',
    'Obsidyen',
    'Ametist',
    'Opal',
    'Mercan',
    'İnci',
    'Kehribar',
    'Turkuaz',
    'Lapis',
    'Oniks',
    'Akik',
    'Granit',
    'Mermer',
    'Sedef',
    'Fildişi',
    'Abanoz',
    'Çelik',
    'Bakır',
    'Tunç',
    'Demir',
    'Krom',
    'Nikel',
    'Kobalt',
    'Volfram',
    'İridyum',
    'Osmiyum',
    'Paladyum',
    'Rodyum',
    'Rutenyum',
    'Neon',
    'Argon',
    'Helyum',
    'Xenon',
    'Foton',
    'Kuark',
    'Nötron',
    'Proton',
    'Elektron',
    'Plazma',
    'Graviton',
    'Cennet',
    'Şafak',
    'Alacakaranlık',
    'Seher',
    'İkindi',
    'Gece',
    'Tan',
    'Akşam',
    'Bahar',
    'Yaz',
    'Sonbahar',
    'Kış',
    'Ekinoks',
    'Gündönümü',
    'Samanyolu',
    'Nebula',
    'Pulsar',
    'Kuasar',
    'Süpernova',
    'Devasa',
    'Minyatür',
    'Nano',
    'Mikro',
    'Mega',
    'Hiper',
    'Süper',
    'Ultra',
    'Proto',
    'Meta',
    'İlahi',
    'Olimpik',
    'Atlas',
    'Feniks',
    'Griffin',
    'Pegasus',
    'Astral',
    'Epik',
    'Senfonik',
    'Harmonik',
    'Kuantum',
    'Nöral',
    'Genetik',
    'Atomik',
    'Moleküler',
    'Holografik',
    'Lazer',
    'Fiber',
    'Kripto',
    'Siber',
    'Hibrit',
    'Organik',
    'Sentetik',
    'Mekanik',
    'Manyetik',
    'Optik',
    'Kinetik',
    'Dinamik',
    'Floresan',
    'Prizma',
    'Spektral',
    'Zırhlı',
    'Kanatlı',
    'Uçan',
    'Yüzen',
    'Dönen',
    'Parlayan',
    'Titreşen',
    'Kutup',
    'Çöl',
    'Orman',
    'Dağ',
    'Deniz',
    'Göl',
    'Nehir',
    'Vadi',
    'Ova',
    'İpek',
    'Kadife',
    'Keten',
    'Yün',
    'Pamuk',
    'Deri',
    'Kürk',
    'Amber',
    'Lavanta',
    'Sandal',
    'Sedir',
    'Çam',
    'Meşe',
    'Ceviz',
    'Bambu',
    'Kaplan',
    'Aslan',
    'Kartal',
    'Şahin',
    'Turna',
    'Baykuş',
    'Karga',
    'Tavus'
  ]

  const baseItems = [
    // Yazı ve Kırtasiye
    'Kalem',
    'Kalemlik',
    'Silgi',
    'Cetvel',
    'Pergel',
    'Not Defteri',
    'Ajanda',
    'Takvim',
    'Yapışkan Not',
    'Klasör',
    'Zımba',
    'Makas',
    'Mürekkep',
    'Hokka',
    'Divit',
    'Tüy Kalem',
    'Dolma Kalem',
    'Kurşun Kalem',
    'Boya Kalemi',
    'Pastel Boya',
    'Suluboya',
    'Fırça',
    'Palet',
    'Tuval',
    'Çerçeve',
    'Kağıt',
    'Parşömen',
    'Papirüs',
    'Rulo',
    'Mektup',
    'Zarf',
    'Pul',
    'Mühür',
    'Damga',

    // Kitap ve Yayın
    'Ansiklopedi',
    'Atlas',
    'Harita',
    'Dergi',
    'Gazete',
    'El Kitabı',
    'Rehber',
    'Roman',
    'Hikaye',
    'Şiir Kitabı',
    'Antoloji',
    'Katalog',
    'Cilt',
    'Broşür',
    'Afiş',
    'Poster',
    'Davetiye',
    'Kartpostal',
    'Rozet',
    'Madalya',
    'Plaket',
    'Kupa',
    'Ödül',

    // Dil ve Eğitim
    'Alfabe Seti',
    'Hece Tablosu',
    'Kelime Kartı',
    'Gramer Kitabı',
    'Okuma Kitabı',
    'Yazma Defteri',
    'Kaligrafi Seti',
    'Hat Takımı',
    'Tezhip Seti',
    'Dil Kursu',
    'Ders Planı',
    'Müfredat',
    'Diploma',
    'Sertifika',
    'Burs Belgesi',
    'Tez',
    'Bildiri',
    'Sunum',
    'Rapor',

    // Teknoloji
    'Yazılım',
    'Uygulama',
    'Algoritma',
    'Veritabanı',
    'Sunucu',
    'Bulut Sistemi',
    'Motor',
    'Derleyici',
    'Çözümleyici',
    'Optimize Edici',
    'Şifreleyici',
    'İşlemci',
    'Bellek',
    'Depolama',
    'Ağ Kartı',
    'Sensör',
    'Kontrol Ünitesi',
    'Panel',
    'Ekran',
    'Terminal',
    'Konsol',
    'Arayüz',
    'Modül',
    'Bileşen',

    // Yapı
    'Kütüphane',
    'Arşiv',
    'Müze',
    'Galeri',
    'Stüdyo',
    'Atölye',
    'Laboratuvar',
    'Akademi',
    'Enstitü',
    'Seminer Odası',
    'Konferans Salonu',
    'Tiyatro',
    'Opera',
    'Sergi Salonu',
    'Kongre Merkezi',
    'Teknoloji Parkı',
    'Hub',
    'Kampüs',
    'Kule',
    'Saray',
    'Kale',
    'Hisar',

    // İleri Teknoloji
    'Çeviri Motoru',
    'Dil İşlemcisi',
    'Metin Analizörü',
    'Nöral Ağ',
    'Konuşma Tanıma',
    'Ses Sentezi',
    'Robot',
    'Drone',
    'Uydu',
    'Teleskop',
    'Radar',
    'Hologram',
    'Simülasyon',
    'Sanal Gerçeklik',

    // Fantastik
    'Büyü Kitabı',
    'Tılsım',
    'Muska',
    'Runa Taşı',
    'Kristal Küre',
    'Sihir Asası',
    'Gizemli Harita',
    'Hazine Sandığı',
    'Altın Taç',
    'Kraliyet Asası',
    'Ejderha Kalkanı',
    'Anka Tüyü',
    'Zaman Saati',
    'Boyut Kapısı',
    'Portal Anahtarı',
    'Evrensel Pusula',
    'Kader Çarkı',
    'Güç Yüzüğü',
    'Bilgelik Tacı',
    'Adalet Terazisi',

    // Kozmik
    'Yıldız Haritası',
    'Gezegen Atlası',
    'Galaksi Rehberi',
    'Gözlemevi',
    'Asteroid Madeni',
    'Meteor Parçası',
    'Güneş Paneli',
    'Ay Üssü',
    'Mars Kolonisi',
    'Uzay İstasyonu',

    // Soyut
    'Bilgi Havuzu',
    'Bilgelik Kaynağı',
    'İlham Deposu',
    'Hayal Gücü',
    'Strateji Merkezi',
    'Başarı Formülü',
    'Zafer Anahtarı',
    'Güç Sembolü',
    'Sonsuzluk İşareti',
    'Ölümsüzlük İksiri',
    'Filozofların Taşı',

    // Araçlar
    'Pusula',
    'Dürbün',
    'Mikroskop',
    'Büyüteç',
    'Ayna',
    'Mercek',
    'Terazi',
    'Saat',
    'Kronograf',
    'Metronom',
    'Jeneratör',
    'Türbin',
    'Kompresör',
    'Filtre',
    'Katalizör',
    'Dönüştürücü',
    'Çip',
    'Anakart',
    'Soğutucu',
    'Hoparlör',
    'Mikrofon',
    'Kamera',
    'Yazıcı',
    'Tarayıcı',
    'Tablet',
    'Dikilitaş',
    'Piramit',
    'Tapınak',
    'Totem',
    'Boncuk',
    'Nazarlık',
    'Tesbih'
  ]

  const existingItems = [
    { id: 1, name: 'Kitap', cost: 10, goldPerSecond: 1, tier: 1 },
    { id: 2, name: 'Defter', cost: 25, goldPerSecond: 2, tier: 1 },
    { id: 3, name: 'Mürekkep Şişesi', cost: 50, goldPerSecond: 4, tier: 1 },
    { id: 4, name: 'Yazı Masası', cost: 120, goldPerSecond: 8, tier: 1 },
    { id: 5, name: 'Mini Kütüphane', cost: 300, goldPerSecond: 15, tier: 2 },
    { id: 6, name: 'Dil Kartları Seti', cost: 650, goldPerSecond: 30, tier: 2 },
    { id: 7, name: 'Sözlük', cost: 1200, goldPerSecond: 55, tier: 2 },
    { id: 8, name: 'Yayın Masası', cost: 2500, goldPerSecond: 95, tier: 2 },
    { id: 9, name: 'Araştırma Raporu', cost: 5000, goldPerSecond: 160, tier: 3 },
    { id: 10, name: 'Akademik Makale', cost: 9500, goldPerSecond: 260, tier: 3 },
    { id: 11, name: 'Dil Laboratuvarı', cost: 18000, goldPerSecond: 420, tier: 3 },
    { id: 12, name: 'Profesör Ekibi', cost: 35000, goldPerSecond: 700, tier: 3 },
    { id: 13, name: 'Yayın Evi', cost: 70000, goldPerSecond: 1200, tier: 3 },
    { id: 14, name: 'Ulusal Kütüphane', cost: 140000, goldPerSecond: 2100, tier: 4 },
    { id: 15, name: 'Dil Akademisi', cost: 300000, goldPerSecond: 3800, tier: 4 },
    { id: 16, name: 'AI Kelime Analizörü', cost: 650000, goldPerSecond: 7200, tier: 5 },
    { id: 17, name: 'Çeviri Sunucusu', cost: 1400000, goldPerSecond: 13500, tier: 5 },
    { id: 18, name: 'Global Yayın Ağı', cost: 3000000, goldPerSecond: 26000, tier: 5 },
    { id: 19, name: 'Dil Veri Merkezi', cost: 7000000, goldPerSecond: 52000, tier: 6 },
    { id: 20, name: 'Küresel Bilgi Ağı', cost: 15000000, goldPerSecond: 105000, tier: 6 },
    { id: 21, name: 'Nöral Dil Motoru', cost: 35000000, goldPerSecond: 210000, tier: 6 },
    { id: 22, name: 'Kuantum Çeviri Çekirdeği', cost: 80000000, goldPerSecond: 420000, tier: 7 },
    { id: 23, name: 'Evrensel Dil Arşivi', cost: 180000000, goldPerSecond: 850000, tier: 7 },
    { id: 24, name: 'Bilgi İmparatorluğu Merkezi', cost: 400000000, goldPerSecond: 1700000, tier: 7 }
  ]

  const emojiMap = {
    Kitap: '📚',
    Kalem: '✏️',
    Defter: '📓',
    Kağıt: '📄',
    Masal: '🦄',
    Efsane: '🐉',
    Destan: '📜',
    Şiir: '📝',
    Roman: '📖',
    Alfabe: '🔤',
    Kelime: '💬',
    Cümle: '🗨️',
    Paragraf: '📑',
    Yazı: '✍️',
    Harf: '🅰️',
    Okul: '🏫',
    Mürekkep: '🖋️',
    Kütüphane: '🏛️',
    Bilgi: '🧠',
    Zeka: '💡',
    Fikir: '💭',
    Düşünce: '🤔',
    Akıl: '🧠',
    Söz: '🗣️',
    Kitaplık: '🗄️',
    Basım: '🖨️',
    Dergi: '📰',
    Gazete: '🗞️',
    Arşiv: '🗃️',
    Ansiklopedi: '📚',
    Sözlük: '📕',
    Atlas: '🗺️',
    Kılavuz: '🧭',
    Cilt: '📔',
    Makale: '📃',
    Eser: '🖼️',
    Tablet: '📱',
    Matbaa: '🎰',
    Belge: '📄',
    Evrak: '📁'
  }

  const prefixEmoji = {
    Antik: '🏺',
    Dijital: '💻',
    Altın: '🪙',
    Gümüş: '🥈',
    Bronz: '🥉',
    Kristal: '🔮',
    Elmas: '💎',
    Zümrüt: '❇️',
    Yakut: '♦️',
    Safir: '🔹',
    Titan: '🛡️',
    Kozmik: '🌌',
    Mistik: '✨',
    Kadim: '🗿',
    Kutsal: '👼',
    İmparatorluk: '👑',
    Kraliyet: '🏰',
    Ejderha: '🐉',
    Anka: '🦅',
    Sihirli: '🪄',
    Büyülü: '🧙‍♂️',
    Efsanevi: '🌟',
    Mitolojik: '🧜‍♀️',
    Galaktik: '🛸',
    Yıldız: '⭐',
    Güneş: '☀️',
    Ay: '🌙',
    Fırtına: '⛈️',
    Şimşek: '⚡',
    Volkanik: '🌋',
    Okyanus: '🌊',
    Bulut: '☁️',
    Rüzgar: '💨',
    Ateş: '🔥',
    Buz: '🧊',
    Gölge: '👤',
    Işık: '💡',
    Karanlık: '🌑',
    Parlak: '🔆',
    Gökkuşağı: '🌈',
    Platin: '💿',
    Obsidyen: '⬛',
    Ametist: '🟣',
    Opal: '🪨',
    Mercan: '🪸',
    İnci: '⚪',
    Kehribar: '🟠',
    Turkuaz: '🩵',
    Lapis: '🟦',
    Oniks: '⚫',
    Akik: '🟤',
    Göktaşı: '☄️',
    Uzay: '🚀',
    Yaman: '💪',
    Harika: '🤩',
    Muazzam: '😲',
    Görkemli: '🏛️',
    Ulu: '🏔️'
  }

  const diverseEmojis = [
    '🎒',
    '💼',
    '👝',
    '👛',
    '🧳',
    '☂️',
    '🌂',
    '🧵',
    '🪡',
    '🪢',
    '🧶',
    '👓',
    '🕶️',
    '🥽',
    '🥼',
    '🦺',
    '👔',
    '👕',
    '👖',
    '🧣',
    '🧤',
    '🧥',
    '🧦',
    '👗',
    '👘',
    '🥻',
    '🩱',
    '🩲',
    '🩳',
    '👙',
    '👚',
    '👛',
    '👜',
    '👝',
    '🎒',
    '👞',
    '👟',
    '🥾',
    '🥿',
    '👠',
    '👡',
    '🩰',
    '👢',
    '👑',
    '👒',
    '🎩',
    '🎓',
    '🧢',
    '⛑️',
    '🪖',
    '💄',
    '💍',
    '🌂',
    '☂️',
    '🔇',
    '🔈',
    '🔉',
    '🔊',
    '📢',
    '📣',
    '📯',
    '🔔',
    '🔕',
    '🎼',
    '🎵',
    '🎶',
    '🎙️',
    '🎚️',
    '🎛️',
    '🎤',
    '🎧',
    '📻',
    '🎷',
    '🪗',
    '🎸',
    '🎹',
    '🎺',
    '🎻',
    '🪕',
    '🥁',
    '📱',
    '📲',
    '☎️',
    '📞',
    '📟',
    '📠',
    '🔋',
    '🔌',
    '💻',
    '🖥️',
    '🖨️',
    '⌨️',
    '🖱️',
    '🖲️',
    '💽',
    '💾',
    '💿',
    '📀',
    '🧮',
    '🎥',
    '🎞️',
    '📽️',
    '🎬',
    '📺',
    '📷',
    '📸',
    '📹',
    '📼',
    '🔍',
    '🔎',
    '🕯️',
    '💡',
    '🔦',
    '🏮',
    '🪔',
    '📔',
    '📕',
    '📖',
    '📗',
    '📘',
    '📙',
    '📚',
    '📓',
    '📒',
    '📃',
    '📜',
    '📄',
    '📰',
    '🗞️',
    '📑',
    '🔖',
    '🏷️',
    '💰',
    '🪙',
    '💴',
    '💵',
    '💶',
    '💷',
    '💸',
    '💳',
    '🧾',
    '💱',
    '💲',
    '✉️',
    '📧',
    '📨',
    '📩',
    '📤',
    '📥',
    '📦',
    '📫',
    '📪',
    '📬',
    '📭',
    '📮',
    '🗳️',
    '✏️',
    '✒️',
    '🖋️',
    '🖊️',
    '🖌️',
    '🖍️',
    '📝',
    '💼',
    '📁',
    '📂',
    '🗂️',
    '📅',
    '📆',
    '🗒️',
    '🗓️',
    '📇',
    '📈',
    '📉',
    '📊',
    '📋',
    '📌',
    '📍',
    '📎',
    '🖇️',
    '📏',
    '📐',
    '✂️',
    '🗃️',
    '🗄️',
    '🗑️',
    '🔒',
    '🔓',
    '🔏',
    '🔐',
    '🔑',
    '🗝️',
    '🔨',
    '🪓',
    '⛏️',
    '⚒️',
    '🛠️',
    '🗡️',
    '⚔️',
    '🔫',
    '🪪',
    '🛡️',
    '🔧',
    '🔩',
    '⚙️',
    '🗜️',
    '⚖️',
    '🦯',
    '🔗',
    '⛓️',
    '🪝',
    '🧰',
    '🧲',
    '🪜',
    '⚗️',
    '🧪',
    '🧫',
    '🧬',
    '🔬',
    '🔭',
    '📡',
    '💉',
    '🩸',
    '💊',
    '🩹',
    '🩼',
    '🩺',
    '🚪',
    '🛗',
    '🪞',
    '🪟',
    '🛏️',
    '🛋️',
    '🪑',
    '🚽',
    '🪠',
    '🚿',
    '🛁',
    '🪤',
    '🪒',
    '🧴',
    '🧷',
    '🧹',
    '🧺',
    '🧻',
    '🪣',
    '🧼',
    '🫧',
    '🪥',
    '🧽',
    '🧯',
    '🛒',
    '🚬',
    '⚰️',
    '🪦',
    '⚱️',
    '🗿',
    '🪧',
    '🪪'
  ]

  const config = {
    gameName: 'Knowledge Kingdom Tycoon',
    currency: 'gold',
    tickSeconds: 1,
    targetItemsCount: 1000,
    prefixes,
    baseItems,
    existingItems,
    emojiMap,
    prefixEmoji,
    diverseEmojis,
    seed: 42,
    costMultRange: [1.015, 1.03],
    gpsMultRange: [1.013, 1.025],
    //  outputPath: path.resolve(__dirname, '../../static/data/word_idle_tycoon_items.json')
    outputPath: path.join(process.cwd(), 'static/data/tycoon/tycoon_items.json')
  }

  const generator = new TycoonDataGenerator(config)
  generator.generate()
}
