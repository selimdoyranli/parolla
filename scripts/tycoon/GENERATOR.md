# Tycoon Data Generator Documentation

Bu dokümantasyon `generate-tycoon-data.js` scriptinin ne yaptığını, parametrelerini ve nasıl kullanılacağını açıklar.

---

## Genel Bakış / Overview

`TycoonDataGenerator`, idle tycoon oyunları için item listesi üreten bir Node.js sınıfıdır. `existingItems` ile başlayıp, `prefixes` + `baseItems` kombinasyonlarıyla benzersiz isimler oluşturur. Her item için maliyet (`baseCost`) ve saniye başı gelir (`goldPerSecond`) değerlerini hesaplar.

---

## Ne Yapar? / What Does It Do?

1. **İsim havuzu oluşturur** — `existingItems` → `baseItems` → `prefixes` + `baseItems` sırasıyla benzersiz isimler toplar
2. **Shuffle** — Seed ile deterministik karıştırma (aynı seed = aynı sıra)
3. **Cost & GPS hesaplar** — Her item için `10 × 1.26^(id-1)` maliyet, ROI ile GPS
4. **roundNice** — Maliyetleri oyun gösterimine uygun sayılara yuvarlar
5. **Tier atar** — Item ID'si = tier (doğrusal)
6. **Emoji atar** — `emojiMap`, `prefixEmoji` veya `diverseEmojis` ile icon seçer
7. **JSON çıktı** — Oyun verisi olarak dosyaya yazar veya obje döner

### Çıktı Formatı

```json
{
  "game": "Knowledge Kingdom Tycoon",
  "currency": "gold",
  "tickSeconds": 1,
  "items": [
    { "id": 1, "name": "Kitap", "baseCost": 10, "goldPerSecond": 1, "tickSeconds": 1, "tier": 1, "icon": "📚" },
    ...
  ]
}
```

---

## Seed

### Nedir?

Seed, **deterministik rastgele sayı üretimi** için kullanılan başlangıç değeridir. Linear Congruential Generator (LCG) algoritması ile çalışır.

### Ne İşe Yarar?

- **Tekrarlanabilirlik**: Aynı seed ile her çalıştırmada aynı sonuç alınır
- **Shuffle sırası**: `baseItems` ve `prefixes` karıştırmasında kullanılır

### Nasıl Çalışır?

```javascript
seededRandom() {
  this.seed = (this.seed * 16807) % 2147483647
  return (this.seed - 1) / 2147483646  // 0–1 arası
}
```

- Varsayılan: `42`
- Farklı seed = farklı item sırası

---

## Ekonomi Matematiği (Economy Math)

Item maliyetleri ve saniye başı gelirleri (GPS) deterministik formüllerle hesaplanır.

### Maliyet (baseCost)

```
exactCost = 10 × 1.26^(id - 1)
exactCost = min(exactCost, 1e12)   // Max 1e12 (Q suffix altında kalır)
finalCost = roundNice(exactCost)
```

- Her item'ın maliyeti bir öncekinden **kesinlikle büyük** olmalıdır (`lastCost + 1` minimum)

### GPS (goldPerSecond)

```
roi = 0.05 × 0.998^id   // Erken item ~%5/sn, geç item ~%2/sn
gps = round(finalCost × roi)
```

- Geri ödeme süresi yaklaşık **20–50 saniye**
- Her item'ın GPS değeri bir öncekinden **en az 1 fazla** olmalıdır

### roundNice

Maliyetleri okunabilir sayılara yuvarlar:

- ≤ 10 → 10
- < 50 → 5'in katı
- < 200 → 10'un katı
- < 1000 → 50'nin katı
- ≥ 1000 → logaritmik yuvarlama

### Tick

Tüm item'lar `tickSeconds: 1` ile her saniye gelir üretir.

---

## Tier

### Nedir?

Tier, item'ın seviye bilgisidir. **ID ile aynıdır** (doğrusal).

### Nasıl Hesaplanır?

```
tier = id
```

- ID 1 → Tier 1  
- ID 50 → Tier 50  
- ID 100 → Tier 100  

### Ne İşe Yarar?

- UI'da renk, ikon veya görsel ayrım
- Oyun mekaniklerinde tier bazlı bonus
- İlerleme göstergesi (örn. `currentTier + 1` kadar item gösterimi)

---

## Emoji / Icon

### Nedir?

Her item'a atanan görsel simge (emoji). Config'deki `emojiMap`, `prefixEmoji` ve `diverseEmojis` ile belirlenir.

### Atama Sırası (Öncelik)

1. **emojiMap** — İsimde anahtar kelime geçiyorsa (örn. "Kalem" → ✏️)
2. **prefixEmoji** — İsimde prefix geçiyorsa (örn. "Antik" → 🏺)
3. **diverseEmojis** — İsimin hash'ine göre listeden seçim (deterministik)
4. **Fallback** — Hiçbiri yoksa `❓`

### Örnek Config

```javascript
emojiMap: {
  Kitap: '📚',
  Kalem: '✏️',
  Kütüphane: '🏛️'
},
prefixEmoji: {
  Antik: '🏺',
  Dijital: '💻',
  Kozmik: '🌌'
},
diverseEmojis: ['🎒', '💼', '📱', ...]  // Hash ile seçilir
```

### hashString

Emoji seçimi için isimden 32-bit hash üretilir. Aynı isim her zaman aynı emojiyi alır (deterministik).

---

## Config Parametreleri Özeti

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| `gameName` | string | 'Generic Tycoon' | Oyun adı |
| `currency` | string | 'gold' | Para birimi |
| `tickSeconds` | number | 1 | Tick süresi (saniye) |
| `targetItemsCount` | number | 100 | Üretilecek toplam item sayısı |
| `prefixes` | string[] | [] | İsim önekleri |
| `baseItems` | string[] | [] | Temel item isimleri |
| `existingItems` | object[] | [] | Başlangıç item'ları (örn. `[{ name: 'Kitap' }]`) |
| `seed` | number | 42 | Rastgelelik seed'i |
| `emojiMap` | object | {} | Kelime → emoji eşlemesi |
| `prefixEmoji` | object | {} | Prefix → emoji eşlemesi |
| `diverseEmojis` | string[] | [] | Hash ile seçilen emoji listesi |
| `outputPath` | string | — | JSON çıktı dosya yolu |

---

## Kullanım

```bash
node scripts/tycoon/generate-tycoon-data.js
```

Veya programatik:

```javascript
const TycoonDataGenerator = require('./scripts/tycoon/generate-tycoon-data.js')

const config = {
  gameName: 'My Tycoon',
  targetItemsCount: 500,
  seed: 123,
  outputPath: './static/data/my-tycoon.json',
  prefixes: ['Antik', 'Dijital'],
  baseItems: ['Kalem', 'Defter'],
  existingItems: [{ name: 'Kitap' }],
  emojiMap: {},
  prefixEmoji: {},
  diverseEmojis: []
}

const generator = new TycoonDataGenerator(config)
const output = generator.generate()
```

---

## Doğrulama (Verify)

`outputPath` verilirse, generator çalışma sonunda otomatik doğrulama yapar:

- Benzersiz isim kontrolü
- Sıralı ID kontrolü
- Örnek item'ların konsola yazdırılması
