# Tycoon Data Generator Documentation

Bu dokümantasyon `generate-tycoon-data.js` scriptinin ne yaptığını, parametrelerini ve nasıl kullanılacağını açıklar.

---

## Genel Bakış / Overview

`TycoonDataGenerator`, clicker/tycoon tarzı idle oyunlar için item listesi üreten bir Node.js sınıfıdır. Mevcut item'ları temel alarak, prefix + base kombinasyonlarıyla yeni benzersiz isimler oluşturur ve her item için maliyet (cost) ile saniye başı gelir (gold per second / GPS) değerlerini hesaplar.

---

## Ne Yapar? / What Does It Do?

1. **Mevcut item'ları yükler** — `existingItems` ile başlar, eksik icon varsa atar
2. **İsim havuzu oluşturur** — `baseItems` ve `prefixes` kombinasyonlarından benzersiz isimler üretir
3. **Shuffle** — Seed ile deterministik karıştırma (aynı seed = aynı sıra)
4. **Cost & GPS hesaplar** — Her yeni item için `costMultRange` ve `gpsMultRange` ile artış uygular
5. **Tier atar** — Item ID'ye göre 1–10 arası tier belirler
6. **Emoji atar** — `emojiMap`, `prefixEmoji` veya `diverseEmojis` ile icon seçer
7. **JSON çıktı** — Oyun verisi olarak dosyaya yazar veya obje döner

### Çıktı Formatı

```json
{
  "game": "Knowledge Kingdom Tycoon",
  "currency": "gold",
  "tickSeconds": 1,
  "items": [
    { "id": 1, "name": "Kitap", "cost": 10, "goldPerSecond": 1, "tier": 1, "icon": "📚" },
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
- **Cost/GPS çarpanları**: Her item için rastgele seçilen `costMult` ve `gpsMult` değerlerinde kullanılır

### Nasıl Çalışır?

```javascript
seededRandom() {
  this.seed = (this.seed * 16807) % 2147483647
  return (this.seed - 1) / 2147483646  // 0–1 arası
}
```

- Varsayılan: `42`
- Farklı seed = farklı item sırası ve farklı cost/GPS değerleri

---

## costMultRange

### Nedir?

Her yeni item'ın **maliyetinin** bir önceki item'a göre ne kadar artacağını belirleyen `[min, max]` çarpan aralığıdır.

### Ne İşe Yarar?

- Her item için `costMult` = `costMultRange[0]` ile `costMultRange[1]` arasında rastgele seçilir
- `currentCost = Math.round(currentCost * costMult)` ile maliyet güncellenir
- Oyunun zorluk eğrisini kontrol eder: yüksek değerler = daha hızlı maliyet artışı

### Varsayılan ve Örnekler

| Değer | Açıklama |
|-------|----------|
| `[1.015, 1.03]` | Varsayılan — her item ~%1.5–%3 daha pahalı |
| `[1.02, 1.04]` | Daha zor — maliyetler daha hızlı artar |
| `[1.01, 1.02]` | Daha kolay — maliyetler daha yavaş artar |

### Formül

```
costMult = costMultRange[0] + seededRandom() × (costMultRange[1] - costMultRange[0])
currentCost = round(currentCost × costMult)
```

---

## gpsMultRange

### Nedir?

Her yeni item'ın **saniye başı gelirinin** (gold per second) bir önceki item'a göre ne kadar artacağını belirleyen `[min, max]` çarpan aralığıdır.

### Ne İşe Yarar?

- Her item için `gpsMult` = `gpsMultRange[0]` ile `gpsMultRange[1]` arasında rastgele seçilir
- `currentGPS = Math.round(currentGPS * gpsMult)` ile gelir güncellenir
- Oyunun ilerleme hızını kontrol eder: yüksek değerler = daha hızlı gelir artışı

### Varsayılan ve Örnekler

| Değer | Açıklama |
|-------|----------|
| `[1.013, 1.025]` | Varsayılan — her item ~%1.3–%2.5 daha fazla GPS |
| `[1.02, 1.03]` | Daha hızlı ilerleme |
| `[1.01, 1.015]` | Daha yavaş ilerleme |

### Denge Notu

Genelde `costMultRange` ortalaması, `gpsMultRange` ortalamasından biraz yüksek tutulur. Böylece her yeni item biraz daha uzun sürede alınır ve oyun sonsuza kadar kendini oynatmaz; doğal bir ilerleme duvarı oluşur.

---

## Tier

### Nedir?

Tier, item'ın **seviye/katman** bilgisidir. ID'ye göre 1–10 arası sabit bir değer atanır.

### Nasıl Hesaplanır?

| ID Aralığı | Tier |
|------------|------|
| 1 – 100 | 1 |
| 101 – 200 | 2 |
| 201 – 300 | 3 |
| 301 – 400 | 4 |
| 401 – 500 | 5 |
| 501 – 600 | 6 |
| 601 – 700 | 7 |
| 701 – 800 | 8 |
| 801 – 900 | 9 |
| 901 – 1000+ | 10 |

### Ne İşe Yarar?

- UI'da renk, ikon veya görsel ayrım için kullanılabilir
- Oyun mekaniklerinde tier bazlı bonus/multiplier verilebilir
- İlerleme hissi için "seviye" göstergesi olarak kullanılabilir

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
| `targetItemsCount` | number | 1000 | Üretilecek toplam item sayısı |
| `prefixes` | string[] | [] | İsim önekleri |
| `baseItems` | string[] | [] | Temel item isimleri |
| `existingItems` | object[] | [] | Başlangıç item'ları |
| `seed` | number | 42 | Rastgelelik seed'i |
| `costMultRange` | [number, number] | [1.015, 1.03] | Maliyet artış çarpan aralığı |
| `gpsMultRange` | [number, number] | [1.013, 1.025] | GPS artış çarpan aralığı |
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
  costMultRange: [1.02, 1.035],
  gpsMultRange: [1.018, 1.028],
  outputPath: './static/data/my-tycoon.json',
  // ... diğer parametreler
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
