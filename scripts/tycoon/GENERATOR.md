# Tycoon Data Generator Documentation

Bu dokümantasyon Knowledge Kingdom tycoon oyunu için veri üretim scriptlerini, ekonomi modelini ve ilgili parametreleri açıklar.

---

## Genel Bakış / Overview

İki katmanlı bir mimari:

| Dosya | Rol |
|-------|-----|
| `generate-tycoon-data.js` | Temel `TycoonDataGenerator` sınıfı — ekonomi mantığı, isim, tier, emoji |
| `generate-knowledge-kingdom.js` | Knowledge Kingdom config — prefixes, baseItems, existingItems, emojiMap |

---

## Çalıştırma

```bash
node scripts/tycoon/generate-knowledge-kingdom.js
```

Çıktı: `static/data/tycoon/knowledge-kingdom.json`

---

## Ekonomi Modeli (v4+)

### Temel Prensipler

- **GPS = cost / payback** — Her item için `goldPerSecond = baseCost / paybackSeconds`
- **GPS < cost** — Her zaman `goldPerSecond < baseCost` (istismar önlenir)
- **Payback süresi** — Item ne kadar sürede kendini amorti eder (saniye)

### İlk 3 Item (Sabit)

| ID | Base Cost | Payback (s) | GPS |
|----|-----------|-------------|-----|
| 1 | 1 | 60 | 0.0167 |
| 2 | 10 | 120 | 0.083 |
| 3 | 50 | 300 | 0.167 |

Config: `firstCosts: [1, 10, 50]`, `firstPaybacks: [60, 120, 300]`

### Item 4+ (Formül)

**Maliyet (cost):**

- **Tier içinde:** `cost[i] = cost[i-1] × withinTierGrowth` (1.18)
- **Tier sınırında:** `cost[i] = cost[i-1] × tierGateMult` (1.95)
- **Cap:** `min(cost, maxCostCap)` → 999e15 (999Q)

**Payback (saniye):**

```
payback[i] = paybackBase × paybackGrowth^(i - 3)
           = 300 × 1.09^(i - 3)
```

**GPS:**

```
gps[i] = cost[i] / payback[i]
```

### Config Parametreleri (Ekonomi)

| Parametre | Varsayılan | Açıklama |
|-----------|------------|----------|
| `firstCosts` | [1, 10, 50] | İlk 3 itemın maliyeti |
| `firstPaybacks` | [60, 120, 300] | İlk 3 itemın geri ödeme süresi (saniye) |
| `paybackBase` | 300 | Item 4+ için temel payback |
| `paybackGrowth` | 1.09 | Payback büyüme katsayısı |
| `withinTierGrowth` | 1.18 | Tier içi maliyet çarpanı |
| `tierGateMult` | 1.95 | Tier sınırında maliyet çarpanı |
| `maxCostCap` | 999e15 | Maksimum maliyet (999Q) |

### roundNice

Maliyetleri okunabilir sayılara yuvarlar:

- ≤ 10 → 10'luk hassasiyet
- < 50 → 5'in katı
- < 200 → 10'un katı
- < 1000 → 50'nin katı
- ≥ 1000 → logaritmik yuvarlama

---

## Tier Sistemi

### Hesaplama

```
tierCount = 20
targetItemsCount = 150
itemsPerTier = 150 / 20 = 7.5

tier = min(tierCount, ceil(id / itemsPerTier))
```

- ID 1–8 → Tier 1  
- ID 9–16 → Tier 2  
- …  
- ID 143–150 → Tier 20  

### isFirstItemOfTier

Tier sınırındaki itemlar `tierGateMult` ile çarpan alır; diğerleri `withinTierGrowth`.

```javascript
tier = ceil(id / itemsPerTier)
prevTier = ceil((id - 1) / itemsPerTier)
isFirstItemOfTier = (tier !== prevTier) || (id === 1)
```

---

## İsim Havuzu

1. **existingItems** — Önce kullanılır (örn. Kitap, Defter, Mürekkep Şişesi…)
2. **baseItems** — Shuffle edilip eklenir
3. **prefixes + baseItems** — `"Antik Kalem"`, `"Dijital Kütüphane"` vb.

### Seed

- Varsayılan: `42`
- Farklı seed = farklı item sırası (deterministik LCG)

---

## Emoji / Icon

### Öncelik Sırası

1. **emojiMap** — İsimde anahtar geçiyorsa (örn. "Kalem" → ✏️)
2. **prefixEmoji** — Prefix geçiyorsa (örn. "Antik" → 🏺)
3. **diverseEmojis** — İsim hash'ine göre seçim (deterministik)
4. **Fallback** — `❓`

---

## Store Entegrasyonu

### economyVersion

- `state.economyVersion` ile kayıtlı versiyon tutulur
- `loadItems` sırasında `economyVersion !== 'v4'` ise `RESET_ECONOMY` tetiklenir
- Reset: gold=0, ownedItems={}, economyVersion güncellenir

### Milestone Çarpanları

| Sahip Olunan | Çarpan |
|--------------|--------|
| 10+ | ×2 |
| 25+ | ×2 |
| 50+ | ×2.5 |
| 100+ | ×4 |
| 200+ | ×8 |

Aynı itemdan 10 adet → GPS ×2; 25 adet → ×4; 50 adet → ×10; vb.

### Tekrar Satın Alma Maliyeti

```
cost = baseCost × 1.15^ownedCount
```

### Tick

- Her saniye `tick`; `tickCount % tickSeconds === 0` ise item gelir üretir
- Tüm itemlar `tickSeconds: 1`

---

## Çıktı Formatı

```json
{
  "game": "Knowledge Kingdom Tycoon",
  "currency": "gold",
  "tickSeconds": 1,
  "items": [
    {
      "id": 1,
      "name": "Kitap",
      "tier": 1,
      "icon": "📚",
      "baseCost": 1,
      "goldPerSecond": 0.02,
      "tickSeconds": 1
    },
    ...
  ]
}
```

---

## Config Parametreleri Özeti

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| `gameName` | string | 'Generic Tycoon' | Oyun adı |
| `currency` | string | 'gold' | Para birimi |
| `tickSeconds` | number | 1 | Tick süresi (saniye) |
| `targetItemsCount` | number | 150 | Toplam item sayısı |
| `tierCount` | number | 20 | Tier sayısı |
| `prefixes` | string[] | [] | İsim önekleri |
| `baseItems` | string[] | [] | Temel item isimleri |
| `existingItems` | object[] | [] | Başlangıç item'ları |
| `seed` | number | 42 | Rastgelelik seed'i |
| `emojiMap` | object | {} | Kelime → emoji |
| `prefixEmoji` | object | {} | Prefix → emoji |
| `diverseEmojis` | string[] | [] | Hash ile seçilen emoji listesi |
| `outputPath` | string | — | JSON çıktı dosya yolu |
| `firstCosts` | number[] | [1, 10, 50] | İlk 3 item maliyeti |
| `firstPaybacks` | number[] | [60, 120, 300] | İlk 3 item payback (sn) |
| `paybackBase` | number | 300 | Item 4+ temel payback |
| `paybackGrowth` | number | 1.09 | Payback büyüme |
| `withinTierGrowth` | number | 1.18 | Tier içi cost çarpanı |
| `tierGateMult` | number | 1.95 | Tier sınırı cost çarpanı |
| `maxCostCap` | number | 999e15 | Maksimum maliyet |

---

## Doğrulama (Verify)

`outputPath` verilirse generator çalışma sonunda otomatik doğrulama yapar:

- Benzersiz isim kontrolü
- Sıralı ID kontrolü
- Örnek item'ların konsola yazdırılması

---

## Yeni Tycoon Eklemek

1. `generate-tycoon-data.js` sınıfını kullan
2. Yeni config dosyası oluştur (örn. `generate-my-tycoon.js`)
3. `prefixes`, `baseItems`, `existingItems`, `emojiMap` vb. tanımla
4. `outputPath` ile JSON çıktı ver
5. Store'da `economyVersion` ile versiyon yönetimi yap
