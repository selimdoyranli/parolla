# Draw Mode — Sistem (Resmi) Odalar

**Tarih:** 2026-05-30
**Branş:** feature/draw-mode
**Repolar:** parolla (FE), parolla-ws (WS), parolla-strapi (içerik, değişiklik yok)

## 1. Overview

Çiz (Draw) modu şu an yalnız "topluluk odası" mantığıyla çalışıyor: kullanıcı kod-tabanlı oda yaratıyor, host oyunu başlatıyor. Bu spec, paralel ikinci bir oda tipi getiriyor: **sistem (resmi) odaları**. Sistem odaları her aktif `DrawWordCategory` için sürekli açık olan, host beklemeyen, 50-turluk döngülerle akan oyun odalarıdır.

Lobi UI'sı iki Vant tab'ına ayrılır:
- **Resmi Odalar** (default): sistem odalarının canlı listesi.
- **Topluluk Odaları**: mevcut host-drawer akışı + "Yeni Oda" butonu (davranış aynı kalır).

## 2. Goals & Non-goals

### Goals
- DrawWordCategory'deki her aktif kategori için bir ana sistem odası (`<slug>`), kapasite aşılınca otomatik sub-room (`<slug>-2`, `<slug>-3`, ...).
- Sistem odası host'suz; oyun sürekli akar, oyuncu her turda anlık katılabilir.
- Min 2 oyuncu olduğunda oyun aktif, altına düşünce "waiting" state'i + canvas overlay.
- 50 tur biten döngü: ~15sn final scoreboard → reset → yeni döngü başlar (skor in-memory, persist yok).
- Sub-room: 0 oyuncuda 60sn sonra GC; ana oda her zaman kalır.
- Lobi listesi reaktif: socket subscribe → oyuncu sayısı, current round, yeni/kapanan sub-room güncellemeleri sayfa yenilemesiz akar.
- URL: `/ciz/oda/<slug>` ve `/ciz/oda/<slug>-2` (Türkçe), `/draw/room/<slug>` (İngilizce). Topluluk odaları aynı `/ciz/oda/<6-char-code>` formunu koruyor.

### Non-goals
- Skor kalıcılığı / daily-score entegrasyonu (in-memory yeterli).
- Strapi'den canlı kategori senkronizasyonu (boot'ta tek seferlik + manuel refresh endpoint yeterli).
- Topluluk oda akışının değişimi (host kontrolleri, oda yaratma, kapasite ayarları aynen kalır).
- Sistem odalarının ayar paneli (kapasite/tur sayısı sabit: 16 / 50).
- Anonim oyuncu desteği (mevcut auth zorunluluğu korunur).

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  parolla-strapi  (içerik kaynağı — değişiklik yok)                       │
│    GET /api/draw-word-categories?filters[isActive]=true                  │
│    GET /api/draw-words?filters[isActive]=true&populate=category          │
└─────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP (boot + manuel refresh)
                              │
┌─────────────────────────────────────────────────────────────────────────┐
│  parolla-ws                                                              │
│                                                                          │
│  state.js                                                                │
│    rooms        : Map<code,   Room>   ← topluluk (mevcut)                │
│    systemRooms  : Map<roomKey, Room>  ← yeni (kind='system')             │
│    playerRoom   : Map<playerId, roomKey>   (her iki türü kapsar)         │
│    lobbySubscribers : Set<ws>     (lobi push hedefleri)                  │
│                                                                          │
│  systemRoomManager.js  ← yeni                                            │
│    bootstrap(): Strapi'den kategorileri çek, her biri için <slug>        │
│                  ana oda yarat (kind='system', state='waiting')          │
│    ensureRoomForJoin(slug): doluysa <slug>-N+1 spawn et, oyuncuyu        │
│                              hangi oda olduğu döner                      │
│    gcLoop(): 30sn'de bir, kind='system' & subIndex>=2 & players=0 &      │
│              emptySince>60sn → odayı sil                                 │
│    refresh(): /api/draw-word-categories tekrar çekilir; eksik kategori   │
│                için yeni ana oda yarat                                   │
│                                                                          │
│  gameLoop.js  ← adapte                                                   │
│    if room.kind==='system':                                              │
│      - DRAW_GAME_START mesajı ignore edilir                              │
│      - <2 oyuncu = state 'waiting' (overlay sinyali)                     │
│      - >=2 oyuncu + state 'waiting' = otomatik startGame                 │
│      - 50. tur sonu = finalScoreboard 15sn → reset → tur 1               │
│      - host concept yok; player join/leave kontrolleri çalışmaya devam   │
│                                                                          │
│  lobbyPusher.js  ← yeni (küçük modül)                                    │
│    pushSystemRoomDelta({op, room}) → tüm lobbySubscribers'a              │
│    pushSystemRoomSnapshot(ws)                                            │
│                                                                          │
│  messageHandler.js  ← genişler                                           │
│    draw_lobby_subscribe / draw_lobby_unsubscribe                         │
│    draw_room_join: kod yerine slug verilirse systemRoomManager'a yönlen  │
└─────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ WebSocket
                              │
┌─────────────────────────────────────────────────────────────────────────┐
│  parolla (Nuxt 2 + composition-api)                                      │
│                                                                          │
│  /ciz  (DrawLobby/index.vue)                                             │
│    Vant Tabs:                                                            │
│      "Resmi Odalar"  → SystemRoomList   (default)                        │
│      "Topluluk Odaları" → CommunityRoomList + create button               │
│    mount: draw_lobby_subscribe gönder + snapshot al                      │
│    unmount: draw_lobby_unsubscribe                                       │
│                                                                          │
│  /ciz/oda/:code                                                          │
│    Aynı sayfa; ilk DRAW_ROOM_STATE cevabında room.kind okur:             │
│      community → mevcut HUD (host badge, "Oyunu Başlat" butonu)          │
│      system    → host UI gizli; 50-tur sayacı görünür                    │
│    DrawCanvas overlay: state==='waiting' iken                            │
│      "Oyuncular bekleniyor (N/2)" ve faded canvas                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. Data model

### Room shape (her iki tür ortak, `kind` ile ayrılır)

```js
{
  // Ortak
  code: 'YEMEKLER' | 'YEMEKLER-2' | 'ABC123',  // routing key (FE URL ile aynı)
  kind: 'system' | 'community',
  hostId: <playerId> | null,        // system için null
  isPublic: bool,                   // system için true (lobide listelenir)
  password: null | string,          // system için her zaman null
  capacity: 16,
  roundCount: 50 | <community-config>,
  roundDurationSec: 60 | <community-config>,
  pickDurationSec: 10,
  locale: 'tr-TR' | 'en',
  categories: ['<slug>'] | [...],   // system: tek slug; community: çoklu (zaten tek slug'a daraltıldı)
  players: Map<id, Player>,
  state: 'waiting' | 'lobby' | 'picking' | 'drawing' | 'roundEnd' | 'finalScoreboard',
  turnQueue: [],
  currentDrawerId: null | string,
  currentRoundIndex: 0..49,
  currentWord: null | string,
  currentWordCategory: null | string,
  pickOptions: null | [{title}, {title}],
  pickEndsAt: null | number,
  drawStartedAt: null | number,
  correctGuessers: [],
  correctGuessSet: Set<id>,
  strokes: [],
  chatHistory: [],
  usedWordTitles: Set<string>,
  // System-only
  slug: 'yemekler' | null,          // base category slug (sub-room'lar paylaşır)
  subIndex: 1 | 2 | 3 | ...,        // ana oda 1
  categoryTitle: 'Yemekler' | null, // lobide gösterim için
  emptySince: null | number,        // GC için (sadece subIndex>=2)
  // Community-only
  // (mevcut alanlar değişmiyor)
}
```

Genişlemiş `state`:
- `waiting`: sistem oda + <2 oyuncu. Overlay gösterilir, oyun başlamaz. Geçişler: 2. oyuncu gelince `startGame()` → `picking`.
- `finalScoreboard`: 50. tur biti. ~15sn boyunca kalır; sonra state=`waiting` (yeterli oyuncu varsa hemen yeni döngü `picking` ile başlar).

### Room key konvansiyonu

- System ana: `slug` upper-case → `YEMEKLER`. URL'de lowercase.
- System sub: `YEMEKLER-2`, `YEMEKLER-3`.
- Community: mevcut 6-char (`ABC123`).

URL ↔ key dönüşümü: `code.toUpperCase()` lookup. State map'leri her zaman upper-case key tutar.

**Lookup precedence (`getRoom(code)`):**
1. `state.systemRooms.get(upperCode)`
2. `state.rooms.get(upperCode)`  (community)

İki map ayrı tutulduğu için aynı key teorik olarak iki tür için var olabilir; sistem oda öncelikli. Pratikte çakışma için sistem slug'ının (a) tam 6-karakter uzunlukta, (b) yalnız `[A-Z2-9]` set'inde olması gerekir; mevcut kategori slug'larında bu yok. Yine de spawn sırasında `code` daha önce community oda olarak alınmışsa sistem oda baz alınır (kullanıcı zaten URL ile gelen slug niyetiyle giriş yapıyor).

## 5. WS protocol changes

### Yeni mesaj türleri (constants/messageTypes.js)

```js
DRAW_LOBBY_SUBSCRIBE     : 'draw_lobby_subscribe'
DRAW_LOBBY_UNSUBSCRIBE   : 'draw_lobby_unsubscribe'
DRAW_LOBBY_SNAPSHOT      : 'draw_lobby_snapshot'   // { systemRooms: [...] }
DRAW_LOBBY_ROOM_UPSERT   : 'draw_lobby_room_upsert' // { room: SummaryDto }
DRAW_LOBBY_ROOM_REMOVE   : 'draw_lobby_room_remove' // { code }
DRAW_FINAL_SCOREBOARD    : 'draw_final_scoreboard'  // { scores: [{playerId, name, score}], nextRoundInMs:15000 }
DRAW_WAITING             : 'draw_waiting'           // { present:N, required:2 }
```

### Lobby summary DTO (push payload — her iki tür için ortak)

```js
// Sistem oda
{
  code: 'YEMEKLER',            // routing key (URL: lowercase)
  kind: 'system',
  slug: 'yemekler',
  subIndex: 1,
  categoryTitle: 'Yemekler',
  playerCount: 4,
  capacity: 16,
  currentRoundIndex: 0..49,
  state: 'waiting' | 'picking' | 'drawing' | 'roundEnd' | 'finalScoreboard',
}

// Topluluk oda
{
  code: 'ABC123',
  kind: 'community',
  hostName: 'selim',            // bilgi amaçlı
  isPublic: true,
  playerCount: 4,
  capacity: 12,
  currentRoundIndex: 0..N,
  state: 'lobby' | 'picking' | 'drawing' | 'roundEnd',
}
```

Snapshot payload her iki tür içerir:
```js
{ type: 'draw_lobby_snapshot', systemRooms: [...], communityRooms: [...] }
```

Upsert/remove tek bir oda taşır; client `kind` alanından doğru store dilimine yazar.

**Mevcut `DRAW_ROOM_LIST_UPDATE` mesajı korunur** (geri uyumluluk; sadece community); yeni lobi sayfası bunu kullanmaz, subscribe modeline geçer.

### Akışlar

**Lobi snapshot/push:**
```
client → draw_lobby_subscribe
WS     → draw_lobby_snapshot { systemRooms:[...], communityRooms:[...] }
... oda durumu değiştiğinde ...
WS     → draw_lobby_room_upsert { room: SummaryDto }
WS     → draw_lobby_room_remove { code }   (sub-room kapandığında)
client → draw_lobby_unsubscribe  (lobi sayfasından ayrılırken)
```

Push tetikleyicileri (debounce'lu — aynı tick'te birden fazla değişiklik tek mesaja paketlenir):
- player add/remove
- state geçişleri (waiting↔picking↔drawing↔roundEnd↔finalScoreboard)
- currentRoundIndex değişimi
- sub-room spawn / GC

**Sistem oda'ya katılım:**
```
client → draw_room_join { code: 'yemekler' }   ← lowercase slug
WS     → resolve: systemRoomManager.ensureRoomForJoin('YEMEKLER', player)
         doluysa: YEMEKLER-2 (yoksa spawn) → oraya ekle
WS     → client'a kabul mesajı + room snapshot (mevcut DRAW_ROOM_STATE)
         + eğer state==='drawing' ise DRAW_STATE_SNAPSHOT (mevcut)
```

`ensureRoomForJoin` atomic (single Node event-loop tick içinde tamamlanır; race yok).

**50. tur sonu:**
```
... 50. tur biter ...
WS     → broadcast DRAW_FINAL_SCOREBOARD { scores, nextRoundInMs: 15000 }
WS     → state = 'finalScoreboard'
15sn sonra:
  reset: currentRoundIndex=0, scores=0, usedWordTitles=∅
  if players.size >= 2: state='picking', beginPickPhase()
  else: state='waiting'
```

**Waiting overlay:**
```
players.size düşer:
  if size < 2 && room.kind==='system':
    clearRoomTimers()
    state = 'waiting'
    broadcast DRAW_WAITING { present: size, required: 2 }

players.size yükselir:
  if size >= 2 && state==='waiting':
    startGame()
```

### Manuel refresh endpoint

`POST /admin/draw/refresh` (Express route içinde, `X-Admin-Token` header'ı ile korumalı; token env'den) → `systemRoomManager.refresh()` → eksik kategoriler için yeni oda yaratılır, push edilir.

## 6. Sistem oda yaşam döngüsü (state machine)

```
                  ┌──────────────────────────┐
                  │   bootstrap (boot zamanı)│
                  └──────────┬───────────────┘
                             │
                             ▼
   ┌────────── waiting ───────────┐
   │ (players < 2, döngüden veya  │
   │  ilk açılıştan)              │
   └──────────┬───────────────────┘
              │ players >= 2
              ▼
        ┌─ picking ─┐                 (existing per-round states)
        │           │
        ▼           ▼
      drawing    (timeout/skip)
        │
        ▼
     roundEnd
        │
        │ if currentRoundIndex < 49 → picking (next round)
        │ if currentRoundIndex == 49 → finalScoreboard (15sn)
        ▼
   finalScoreboard
        │ 15sn dolar
        ▼
  reset (scores=0, round=0, usedWords=∅)
        │ players >= 2 ? → picking : waiting
        ▼
   (döngü tekrar başlar)

Her durumda:
  - players düşerse 2'nin altına: timers temizlenir, state='waiting'
  - oyun ortada çizici terk ederse: mevcut onDrawerLeft logic (skip)
```

## 7. Sub-room spawning

`systemRoomManager.ensureRoomForJoin(baseSlug, player)`:

```js
const baseKey = baseSlug.toUpperCase()
let n = 1
while (true) {
  const key = n === 1 ? baseKey : `${baseKey}-${n}`
  let room = state.systemRooms.get(key)
  if (!room) {
    room = createSystemRoom({ slug: baseSlug, subIndex: n })
    state.systemRooms.set(key, room)
    lobbyPusher.upsert(room)
  }
  if (room.players.size < room.capacity) return room
  n++
  if (n > 50) throw new Error('Too many sub-rooms')   // sanity bound
}
```

Race-free çünkü Node tek thread; tüm operation aynı event-loop tick'inde.

GC döngüsü (30sn'de bir, modül-singleton interval):
```js
for (const room of state.systemRooms.values()) {
  if (room.kind !== 'system' || room.subIndex < 2) continue
  if (room.players.size === 0) {
    if (!room.emptySince) room.emptySince = Date.now()
    else if (Date.now() - room.emptySince > 60_000) {
      state.systemRooms.delete(room.code)
      lobbyPusher.remove(room.code)
    }
  } else {
    room.emptySince = null
  }
}
```

## 8. Frontend

### `/ciz` (DrawLobby/index.vue)

- Vant `Tabs` komponenti, `v-model="activeTab"`. `'official'` default.
- Mount: `draw_lobby_subscribe` gönder, gelen `draw_lobby_snapshot` ile listeleri doldur. `draw_lobby_room_upsert` / `remove` mesajları Vuex/local ref'lerde patch edilir.
- Unmount: `draw_lobby_unsubscribe`.

**Resmi Odalar tabı (SystemRoomList.vue):**
- Liste `groupBy(systemRooms, 'slug')` ile kategoriye göre gruplanır.
- Her grup: kategori başlığı + alt kart listesi (ana + sub'lar).
- Alt kart: `<categoryTitle> <#subIndex if >1>`, oyuncu sayısı (`4/16`), state rozeti (`Bekliyor` / `Çiziliyor` / `Tur 12/50` vb.), "Katıl" butonu.
- Katıl → `router.push('/ciz/oda/' + (subIndex===1 ? slug : slug + '-' + subIndex))`.

**Topluluk Odaları tabı (CommunityRoomList.vue):**
- Mevcut DrawLobby içeriği (publicRooms listesi + "Yeni Oda" + kod ile katıl) buraya taşınır.
- Davranış aynı; sadece DOM hiyerarşisi değişir.

### `/ciz/oda/:code` (DrawRoom/_code.vue)

- URL'den gelen `code` ham olarak WS'ye verilir (`draw_room_join { code }`); WS lower/upper case'i kendi içinde çözer.
- İlk `DRAW_ROOM_STATE` mesajında `room.kind` saklanır.
- `kind === 'community'`: mevcut UI olduğu gibi (host badge, "Oyunu Başlat" butonu, kapasite/tur ayar göstergeleri).
- `kind === 'system'`: host kontrolleri **gizli**; üst HUD'da `<categoryTitle> · Tur N/50` ve oyuncu sayısı.

**DrawCanvas overlay:**
- `state === 'waiting'` iken canvas üstünde yarı saydam katman: ikon + "Oyuncular bekleniyor (N/2)". Sistem oda dışında bu state ortaya çıkmaz; community oda'da var olan "lobby" state ile karışmaz.
- `state === 'finalScoreboard'` iken final tablo (top N) ve "Yeni döngü başlıyor (X)" geri sayım overlay'i.

### Vuex store (`store/draw/`)

- Mevcut `publicRooms` → `communityRooms`.
- Yeni `systemRooms` (array, `code` key'li flat).
- Aksiyonlar: `subscribeLobby`, `unsubscribeLobby`, `upsertRoom`, `removeRoom`.
- Subscription idempotent; lobi sayfası açık değilken WS push gelse store'a yazılır ama UI'da görünmez (zaten unsubscribe yapılır).

### Routing

`nuxt.config.js` zaten `/ciz/oda/:code` tanımlı; aynı pattern hem slug hem kod kabul ediyor. Yeni route eklemeye gerek yok.

## 9. Edge cases

- **Aynı kullanıcı iki tab'da Çiz'i açar:** `draw_lobby_subscribe` set'e iki ws ekler; oda'ya katılım `playerRoom` ile bir defalık tutulur (mevcut davranış; sistem oda'da da geçerli).
- **WS restart:** Tüm in-memory oda + skor kaybolur. Sistem odaları yeniden boot'lanır; client'lar reconnect olunca taze snapshot çeker. Beklenen davranış.
- **Sub-room sürekli yaratılıp GC ediliyor (yo-yo):** 60sn 0-player threshold yeterli; ana odaya direkt katılım nedeniyle sub-room nadiren tek başına dolmalı.
- **Strapi'de kategori deaktif edilirse:** Mevcut sistem odası in-memory kalır (oyuncu varsa kapatma agresif olmaz); manuel `/admin/draw/refresh` çağrısı yeni kategorileri ekler ama kaldırmaz (out of scope; gerekirse sonraki iter'de).
- **Lobi push fırtınası:** Push trigger'ları aynı tick'te toplanır (`process.nextTick` debounce); 1 oda için en fazla 1 upsert/tick.
- **`draw_room_join` race (iki kişi aynı anda son slot için):** `addPlayer` halen `players.size >= capacity` kontrolü yapıyor; ensureRoomForJoin kapasite limitinde döngüye girer, ikinci oyuncu doğal olarak sub-room'a düşer.
- **Çizen 50. turda ayrılırsa:** `onDrawerLeft` → turu skip → `roundEnd` → 50 limitine bakılır → `finalScoreboard`.
- **Kelime havuzu Yetersiz (1 kategori, 50 tur, <50 unique kelime):** `usedWordTitles` doluyunca `pickTwo` fallback `excludeTitles`'ı yok sayar; oyun durmaz, kelimeler tekrar edebilir.

## 10. Testing strategy

Manuel test akışı (TDD test yazımı out-of-scope, mevcut repo'da test altyapısı kurulu değil; smoke script var):

- **WS unit-ish smoke** (`scripts/manual/system-room-smoke.js` — mevcut `draw-smoke.js` benzeri):
  - 1 client `/ciz/oda/yemekler` → state `waiting`, overlay sinyali alır.
  - 2. client gelir → state `picking`, oyun başlar.
  - 16+1 client → 17. client `YEMEKLER-2`'ye yönlendirilir.
  - 60 sn boyunca `YEMEKLER-2`'de 0 oyuncu → kapanır, lobby `remove` push'u görülür.

- **Frontend smoke (manuel):**
  - `/ciz` aç, default tab "Resmi Odalar" görünür, kategori kartları listelenir.
  - Tab değiştir → Topluluk Odaları görünür, "Yeni Oda" butonu çalışır (regresyon).
  - "Yemekler" kartı tıkla → `/ciz/oda/yemekler` açılır, overlay görünür.
  - İkinci sekmede aynı yere git → ikisi de aktif oyuna geçer.

## 11. Out of scope (mevcut iter)

- Daily-score / leaderboard entegrasyonu.
- Strapi webhook ile canlı kategori senkronizasyonu.
- Sistem odası ayar paneli (admin'in kapasite/tur değiştirmesi).
- Sistem odasından oyuncu ban/kick (host yok).
- Sistem oda historic match log/scoreboard.
- Mobil-spesifik tab UI optimizasyonu (mevcut DrawLobby responsive yapı korunur).

## 12. İmplementasyon sırası (yüksek seviye)

1. **WS — state + systemRoomManager iskeleti** (rooms map'i ayır, kind alanı ekle, bootstrap yok ama createSystemRoom helper var).
2. **WS — gameLoop adaptasyonu** (waiting state, host bypass, 50-tur cycle, finalScoreboard).
3. **WS — systemRoomManager.bootstrap + GC + refresh endpoint**.
4. **WS — lobbyPusher + subscribe/unsubscribe + push tetikleyicileri**.
5. **WS — manuel smoke script güncellemesi**.
6. **FE — Vuex store sistem odası kanalı (subscribe/snapshot/upsert/remove)**.
7. **FE — DrawLobby tabs + SystemRoomList + CommunityRoomList ayrımı**.
8. **FE — DrawRoom `kind` switch (host UI gizleme, sistem HUD)**.
9. **FE — DrawCanvas waiting + finalScoreboard overlay'leri**.
10. **Manuel doğrulama (iki tarayıcı sekmesi ile end-to-end test)**.
