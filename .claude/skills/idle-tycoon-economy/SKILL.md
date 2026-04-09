---
name: idle-tycoon-economy
description: >
  Boşta kalma tycoon/clicker oyunlarının ekonomilerini sıfırdan tasarlamak, denetlemek ve dengelemek veya bozuk olanları düzeltmek için uzman beceri.
  Kullanıcı istediğinde bu beceriyi kullanın: yeni bir idle oyun ekonomisi oluşturmak, mevcut öğe fiyatlarını/gelir oranlarını gözden geçirmek veya yeniden dengelemek,
  istismar edilebilir yükseltme yollarını düzeltmek (ör. “X'i iki kez satın almak Y'yi satın almaktan daha iyidir”), prestij/çarpan sistemleri tasarlamak,
  ROI eğrilerini, geri ödeme sürelerini veya ilerleme hızını hesaplamak. Kullanıcı boşta kalan oyun, tycoon oyun,
  tıklama ekonomisi, yükseltme dengeleme, saniye başına gelir, ROI, geri ödeme süresi veya “bu öğe çok zayıf/güçlü”,
  “oyuncular bunu bunun yerine satın almalı” veya “ekonomim bozuk/dengesiz” gibi ifadelerden bahsettiğinde bu beceriyi tetikleyin. Herhangi bir ekonomi rakamı yazmadan önce daima bu beceriyi kullanın.
---

# Idle Tycoon Economy Designer & Reviewer

Bu skill, idle/tycoon/clicker oyunları için ekonomi tasarımı ve denetimi konusunda uzmanlaşmış bir ajandır.
Hem sıfırdan ekonomi kurgulama hem de mevcut ekonomiyi düzeltme senaryolarını kapsar.

---

## Temel Kavramlar ve Matematiksel Çerçeve

### Anahtar Metrikler

| Metrik | Formül | Açıklama |
|--------|--------|----------|
| **ROI (Return on Investment)** | `gelir_per_saniye / maliyet` | Yüksek = daha verimli |
| **Payback Süresi** | `maliyet / gelir_per_saniye` | Kaç saniyede kendini amorti eder |
| **Marginal Efficiency** | `ΔROI / ΔMaliyet` | Bir sonraki yükseltme ne kadar daha iyi? |
| **Opportunity Cost** | Alternatif alımın kaybedilen değeri | X mi alayım, Y mi? |

### Kötü Ekonomi Tespiti (Örnek: Kullanıcının Problemi)

```
Item A: 300 altın → 15 altın/sn  →  ROI = 0.050  →  Payback = 20 sn
Item B: 650 altın → 30 altın/sn  →  ROI = 0.046  →  Payback = 21.7 sn

2x Item A: 600 altın → 30 altın/sn  →  ROI = 0.050  →  Payback = 20 sn  ✅ KAZANAN
```

**Sorun:** Item B, Item A'dan daha pahalı ama daha az verimli.
**Kural:** Daha pahalı bir item her zaman daha yüksek ROI'ya sahip olmalıdır (yoksa kimse almaz).

---

## Ekonomi Tasarım Prensipleri

### 1. ROI Hiyerarşisi (Zorunlu)
Daha pahalı itemlar **biraz daha düşük** ROI'ya sahip olabilir — bu normaldir ve "late-game verimi azalır" hissini verir.
Ancak ucuz itemın ROI'su ASLA pahalı itemı geçmemelidir.

```
Önerilen ROI eğrisi:
- Erken itemlar:  yüksek ROI (hızlı dönüş, oyuncuyu motive eder)
- Orta itemlar:   orta ROI  (dengeli ilerleme)
- Geç itemlar:    düşük ROI (ama çok büyük mutlak kazanç)
```

### 2. Payback Süresi Yönetimi

İyi tasarlanmış oyunlarda payback süreleri genellikle şu şekilde ölçeklenir:

| Aşama | Payback Süresi | Neden |
|-------|---------------|-------|
| Erken oyun | 10–30 sn | Oyuncuyu bağlamak |
| Orta oyun | 1–5 dk | Beklenti + ödül döngüsü |
| Geç oyun | 5–30 dk | Uzun vadeli hedef |
| Prestige öncesi | 1–3 saat | Prestige motivasyonu |

### 3. Çarpan (Multiplier) Sistemi

Upgrade seviyeleri için önerilen maliyet çarpanı:

```
Seviye N maliyeti = Temel_Maliyet × Büyüme_Katsayısı^(N-1)

Büyüme katsayısı önerileri:
- Agresif (hızlı cap): 1.15 – 1.25
- Normal:             1.07 – 1.12  ← Önerilen başlangıç
- Yavaş (uzun oyun):  1.03 – 1.06
```

### 4. Item Ailesi Tasarımı

Bir item ailesi (aynı kategoride birden fazla tier) tasarlarken:

```
Kural: Her yeni tier, öncekinden %20-40 daha az verimli AMA
       mutlak geliri en az %80 daha fazla olmalı.

Örnek düzeltme (kullanıcının problemi için):
Item A: 300 altın → 15 altın/sn  → ROI: 0.050  → Payback: 20 sn
Item B: 650 altın → 26 altın/sn  → ROI: 0.040  → Payback: 25 sn  ✅
Item C: 1400 altın → 45 altın/sn → ROI: 0.032  → Payback: 31 sn  ✅
```

---

## Ekonomi Audit Protokolü (Mevcut Ekonomiyi İnceleme)

Kullanıcı mevcut bir ekonomi verirse şu adımları izle:

### Adım 1: Veriyi Tabloya Dök
Her item için ROI ve Payback hesapla.

### Adım 2: ROI Anomalilerini Tespit Et
```python
# Pseudocode
for i in range(1, len(items)):
    if items[i].ROI >= items[i-1].ROI:
        flag("⚠️ Anomali: {} daha ucuz {} kadar/daha verimli".format(items[i-1].name, items[i].name))
```

### Adım 3: Düzeltme Stratejisi Seç

| Strateji | Ne zaman kullan | Nasıl |
|----------|-----------------|-------|
| **Gelir Artır** | Item fiyatı doğruysa | Zayıf itemın gelirini artır |
| **Fiyat Düşür** | Gelir oranı doğruysa | Pahalı itemın fiyatını düşür |
| **Yeni Item Ekle** | Gap çok büyükse | Aradaki boşluğa yeni tier ekle |
| **Kaldır/Birleştir** | Çok fazla item varsa | Gereksiz tierleri birleştir |

### Adım 4: Sonuçları Doğrula
Düzeltme sonrası ROI eğrisinin monoton azaldığını kontrol et.

---

## Sıfırdan Ekonomi Kurma Şablonu

Kullanıcı yeni bir ekonomi istiyorsa şu sorular sor:

1. **Oyun süresi:** Oturum başına kaç dakika oynanması hedefleniyor?
2. **Item sayısı:** Kaç farklı "iş kolu" veya kategori var?
3. **Prestige var mı?** Evet/Hayır
4. **Para birimi:** Tek mi, çoklu mu?
5. **Otomatik gelir mi, aktif tıklama mı ağırlıklı?**

Sonra şu şablonu kullan:

```
Temel Gelir Hesabı:
- Hedef: Oyuncu X dakikada ilk prestij'e ulaşsın
- Prestige öncesi toplam kazanç = son item maliyeti × 3 (kabaca)
- Bu geriye doğru çalışarak başlangıç ekonomisini belirler

Item Fiyatlandırma Eğrisi (10 item için örnek):
Item 1:  100
Item 2:  250   (×2.5)
Item 3:  600   (×2.4)
Item 4:  1,400  (×2.3)
Item 5:  3,200  (×2.3)
Item 6:  7,000  (×2.2)
Item 7:  15,000 (×2.1)
Item 8:  32,000 (×2.1)
Item 9:  65,000 (×2.0)
Item 10: 130,000 (×2.0)

ROI eğrisi (her item için):
Item 1: 0.060 → Payback ~17sn
Item 2: 0.055 → Payback ~18sn
...
Item 10: 0.025 → Payback ~40sn
```

---

## Çıktı Formatı

Her analiz veya tasarım çıktısı şunları içermeli:

1. **Özet Tablo** — Tüm itemlar, maliyet, gelir, ROI, payback
2. **Anomali Raporu** — Hangi itemlar sorunlu, neden
3. **Düzeltilmiş Değerler** — Önce/sonra karşılaştırması
4. **ROI Eğrisi Yorumu** — Monoton mu? Oynanış hissi nasıl?
5. **Opsiyonel:** Python/JS snippet ile hesaplamayı doğrulama

---

## Sık Yapılan Hatalar ve Çözümleri

| Hata | Belirti | Çözüm |
|------|---------|-------|
| Flat ROI | Tüm itemlar aynı verimde | Late-game itemlara ROI cezası ekle |
| Çok hızlı ölçekleme | Oyuncu kısa sürede tüm içeriği bitirir | Büyüme katsayısını artır |
| Çok yavaş ölçekleme | Oyuncu sıkılır, ilerleme hissi yok | İlk birkaç itemın payback süresini kısalt |
| Dominant strateji | Tek item almak her zaman en iyisi | ROI farkını küçük tut (max %15-20) |
| Anlamsız itemlar | Belirli itemlar hiç alınmaz | Tüm itemların makul bir kullanım penceresi olmalı |

---

## Örnek: Kullanıcının Ekonomisini Düzeltme

**Mevcut (Kırık):**
```
Item A: 300 altın → 15/sn  | ROI: 0.050 | Payback: 20sn
Item B: 650 altın → 30/sn  | ROI: 0.046 | Payback: 21.7sn
```
**Problem:** 2x Item A (600 altın, 30/sn) > Item B (650 altın, 30/sn). Item B gereksiz.

**Düzeltme Seçenekleri:**

*Seçenek 1 — Item B gelirini artır:*
```
Item B: 650 altın → 36/sn  | ROI: 0.055 | Payback: 18sn  ✅
(Artık Item B daha verimli, mantıklı bir yükseltme)
```

*Seçenek 2 — Item B fiyatını düşür:*
```
Item B: 500 altın → 30/sn  | ROI: 0.060 | Payback: 16.7sn  ✅
```

*Seçenek 3 — ROI'yu dengeye getir (önerilen):*
```
Item A: 300 altın → 15/sn  | ROI: 0.050 | Payback: 20sn
Item B: 650 altın → 28/sn  | ROI: 0.043 | Payback: 23sn  ✅
(Item B biraz daha az verimli ama kabul edilebilir — late-game feel)
```
