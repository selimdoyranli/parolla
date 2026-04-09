# Flashcard More Options (Shuffle & Watchlist) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "More" ActionSheet to the flashcard game scene with two toggle options: Shuffle (randomize card order) and Watchlist (cross/checkmark tracking mode that replaces arrow navigation).

**Architecture:** Extend `useFlashcards` composable with shuffle state (preserves current card on toggle), watchlist state (`stillProgress`/`inMemory` lists), and tracking navigation. FlashcardGameScene gets a Vant ActionSheet with Cell+Switch toggles, conditional watchlist UI (cross/check buttons, progress labels), and hides nav arrows when watchlist is active.

**Tech Stack:** Nuxt 2, Vue 2 + Composition API, Vant (ActionSheet, Cell, Switch), Pug, SCSS

**Frontend repo:** `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `composables/useFlashcards.js` | Modify | Add shuffle, watchlist state & methods |
| `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue` | Modify | Add ActionSheet, watchlist UI, conditional nav |
| `components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss` | Modify | Styles for ActionSheet content, watchlist buttons, labels |
| `locales/en.js` | Modify | i18n keys for new options |
| `locales/tr.js` | Modify | i18n keys for new options (Turkish) |

---

### Task 1: useFlashcards — Shuffle Logic

**Files:**
- Modify: `composables/useFlashcards.js`

- [ ] **Step 1: Add originalFlashcards ref and isShuffled state**

Add after the `isFlipped` ref (line 6):

```javascript
  const originalFlashcards = ref([])
  const isShuffled = ref(false)
```

- [ ] **Step 2: Store original order in initGame**

Change `initGame` from:

```javascript
  const initGame = flashcardsArray => {
    if (!flashcardsArray || flashcardsArray.length === 0) return

    flashcards.value = [...flashcardsArray].sort((a, b) => a.order - b.order)
    currentIndex.value = 0
    isFlipped.value = true
  }
```

To:

```javascript
  const initGame = flashcardsArray => {
    if (!flashcardsArray || flashcardsArray.length === 0) return

    const sorted = [...flashcardsArray].sort((a, b) => a.order - b.order)
    originalFlashcards.value = sorted
    flashcards.value = [...sorted]
    currentIndex.value = 0
    isFlipped.value = true
    isShuffled.value = false
  }
```

- [ ] **Step 3: Add toggleShuffle method**

Add after the `prevCard` method:

```javascript
  const toggleShuffle = () => {
    const currentCardId = currentCard.value?.id || currentCard.value?.documentId
    isShuffled.value = !isShuffled.value

    if (isShuffled.value) {
      // Shuffle: Fisher-Yates
      const shuffled = [...flashcards.value]

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      flashcards.value = shuffled
    } else {
      // Restore original order
      flashcards.value = [...originalFlashcards.value]
    }

    // Stay on the same card
    if (currentCardId) {
      const newIndex = flashcards.value.findIndex(c => (c.id || c.documentId) === currentCardId)

      if (newIndex !== -1) {
        currentIndex.value = newIndex
      }
    }
  }
```

- [ ] **Step 4: Export new state and methods**

Add to the return object:

```javascript
    isShuffled,
    toggleShuffle,
```

- [ ] **Step 5: Commit**

```bash
git add composables/useFlashcards.js
git commit -m "feat(flashcard): add shuffle toggle to useFlashcards composable"
```

---

### Task 2: useFlashcards — Watchlist Logic

**Files:**
- Modify: `composables/useFlashcards.js`

- [ ] **Step 1: Add watchlist state**

Add after `isShuffled` ref:

```javascript
  const isWatchlistActive = ref(false)
  const stillProgress = ref([])
  const inMemory = ref([])
  const isWatchlistComplete = ref(false)
```

- [ ] **Step 2: Add computed for watchlist counts**

Add after existing computed properties:

```javascript
  const stillProgressCount = computed(() => stillProgress.value.length)
  const inMemoryCount = computed(() => inMemory.value.length)
```

- [ ] **Step 3: Add toggleWatchlist method**

Add after `toggleShuffle`:

```javascript
  const toggleWatchlist = () => {
    isWatchlistActive.value = !isWatchlistActive.value

    if (isWatchlistActive.value) {
      // Reset watchlist tracking
      stillProgress.value = []
      inMemory.value = []
      isWatchlistComplete.value = false
    }
  }
```

- [ ] **Step 4: Add markStillProgress and markInMemory methods**

```javascript
  const findNextStillProgressCard = () => {
    // Find next card that is not in inMemory
    const inMemoryIds = inMemory.value.map(c => c.id || c.documentId)

    for (let i = 0; i < flashcards.value.length; i++) {
      const card = flashcards.value[i]
      const cardId = card.id || card.documentId

      if (!inMemoryIds.includes(cardId)) {
        return i
      }
    }

    return -1
  }

  const markStillProgress = () => {
    if (!currentCard.value) return

    const cardId = currentCard.value.id || currentCard.value.documentId
    const alreadyExists = stillProgress.value.some(c => (c.id || c.documentId) === cardId)

    if (!alreadyExists) {
      stillProgress.value.push({ ...currentCard.value })
    }

    // Remove from inMemory if it was there
    inMemory.value = inMemory.value.filter(c => (c.id || c.documentId) !== cardId)

    // Move to next non-inMemory card
    const nextIndex = findNextStillProgressCard()

    if (nextIndex !== -1 && nextIndex !== currentIndex.value) {
      isFlipped.value = true
      currentIndex.value = nextIndex
    } else {
      // Try wrapping around
      const inMemoryIds = inMemory.value.map(c => c.id || c.documentId)
      const remaining = flashcards.value.filter(c => !inMemoryIds.includes(c.id || c.documentId))

      if (remaining.length === 0) {
        isWatchlistComplete.value = true
      } else {
        const firstRemainingIndex = flashcards.value.findIndex(
          c => !inMemoryIds.includes(c.id || c.documentId) && flashcards.value.indexOf(c) !== currentIndex.value
        )

        if (firstRemainingIndex !== -1) {
          isFlipped.value = true
          currentIndex.value = firstRemainingIndex
        }
      }
    }
  }

  const markInMemory = () => {
    if (!currentCard.value) return

    const cardId = currentCard.value.id || currentCard.value.documentId
    const alreadyExists = inMemory.value.some(c => (c.id || c.documentId) === cardId)

    if (!alreadyExists) {
      inMemory.value.push({ ...currentCard.value })
    }

    // Remove from stillProgress if it was there
    stillProgress.value = stillProgress.value.filter(c => (c.id || c.documentId) !== cardId)

    // Check if all cards are now inMemory
    const inMemoryIds = inMemory.value.map(c => c.id || c.documentId)
    const remaining = flashcards.value.filter(c => !inMemoryIds.includes(c.id || c.documentId))

    if (remaining.length === 0) {
      isWatchlistComplete.value = true

      return
    }

    // Move to next non-inMemory card
    const nextAvailable = flashcards.value.findIndex(c => !inMemoryIds.includes(c.id || c.documentId))

    if (nextAvailable !== -1) {
      isFlipped.value = true
      currentIndex.value = nextAvailable
    }
  }
```

- [ ] **Step 5: Export new state and methods**

Add to the return object:

```javascript
    isWatchlistActive,
    stillProgress,
    inMemory,
    isWatchlistComplete,
    stillProgressCount,
    inMemoryCount,
    toggleWatchlist,
    markStillProgress,
    markInMemory,
```

- [ ] **Step 6: Commit**

```bash
git add composables/useFlashcards.js
git commit -m "feat(flashcard): add watchlist tracking mode to useFlashcards"
```

---

### Task 3: FlashcardGameScene — ActionSheet & More Button

**Files:**
- Modify: `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue`

- [ ] **Step 1: Add Vant imports**

Change the import from:

```javascript
import { Button } from 'vant'
```

To:

```javascript
import { Button, ActionSheet, Cell, Switch } from 'vant'
```

Update components:

```javascript
  components: {
    Button,
    ActionSheet: ActionSheet,
    Cell,
    VanSwitch: Switch
  },
```

- [ ] **Step 2: Add ActionSheet state and new composable refs**

In setup(), add `isMoreSheetOpen` ref:

```javascript
    const isMoreSheetOpen = ref(false)
```

Update the useFlashcards destructure to include new methods:

```javascript
    const {
      initGame, flipCard, nextCard, prevCard, currentCard, currentIndex, totalCards,
      isFlipped, isFirst, isLast, isShuffled, toggleShuffle,
      isWatchlistActive, isWatchlistComplete, stillProgressCount, inMemoryCount,
      toggleWatchlist, markStillProgress, markInMemory
    } = useFlashcards()
```

- [ ] **Step 3: Update handleKeydown to respect watchlist**

Change:

```javascript
    const handleKeydown = event => {
      if (event.key === 'ArrowLeft') {
        prevCard()
      } else if (event.key === 'ArrowRight') {
        nextCard()
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        flipCard()
      }
    }
```

To:

```javascript
    const handleKeydown = event => {
      if (event.key === 'ArrowLeft' && !isWatchlistActive.value) {
        prevCard()
      } else if (event.key === 'ArrowRight' && !isWatchlistActive.value) {
        nextCard()
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        flipCard()
      }
    }
```

- [ ] **Step 4: Add template — watchlist labels above card**

In the template, add watchlist labels inside `.flashcard-area`, BEFORE `.flashcard-wrapper`:

```pug
      // Watchlist progress labels
      .watchlist-labels(v-if="isWatchlistActive && !isWatchlistComplete")
        .watchlist-labels__item.watchlist-labels__item--still-progress
          AppIcon(name="tabler:x" :width="14" :height="14")
          span {{ $t('flashcardScene.more.watchlist.stillProgress') }}: {{ stillProgressCount }}
        .watchlist-labels__item.watchlist-labels__item--in-memory
          AppIcon(name="tabler:check" :width="14" :height="14")
          span {{ $t('flashcardScene.more.watchlist.inMemory') }}: {{ inMemoryCount }}
```

- [ ] **Step 5: Add template — watchlist complete state**

After `.flashcard-area`, add a complete state block:

```pug
    // Watchlist complete
    .watchlist-complete(v-if="isWatchlistActive && isWatchlistComplete")
      AppIcon(name="tabler:circle-check" :width="64" :height="64" color="var(--color-success-01)")
      p.watchlist-complete__text {{ $t('flashcardScene.more.watchlist.complete') }}
      .watchlist-complete__stats
        span {{ $t('flashcardScene.more.watchlist.inMemory') }}: {{ inMemoryCount }}
      Button(type="info" plain round native-type="button" @click="resetGame") {{ $t('general.playAgain') }}
```

- [ ] **Step 6: Add template — watchlist action buttons below card**

Inside `.flashcard-area`, AFTER `.flashcard-area__hint`, add:

```pug
      // Watchlist action buttons
      .watchlist-actions(v-if="isWatchlistActive && !isWatchlistComplete")
        Button.watchlist-actions__button.watchlist-actions__button--cross(round native-type="button" @click="markStillProgress")
          AppIcon(name="tabler:x" :width="24" :height="24")
        Button.watchlist-actions__button.watchlist-actions__button--check(round native-type="button" @click="markInMemory")
          AppIcon(name="tabler:check" :width="24" :height="24")
```

- [ ] **Step 7: Update navigation — hide arrows when watchlist active, add more button**

Replace the entire `.flashcard-nav` section with:

```pug
    // Navigation
    .flashcard-nav(v-if="!isWatchlistComplete")
      Button.flashcard-nav__button.flashcard-nav__prev(v-if="!isWatchlistActive" round plain native-type="button" :disabled="isFirst" @click="prevCard")
        AppIcon(name="tabler:chevron-left" :width="22" :height="22")

      Button.flashcard-nav__button.flashcard-nav__flip(round plain native-type="button" @click="flipCard")
        span.flashcard-nav__flip-inner
          AppIcon(name="tabler:refresh" :width="18" :height="18")
          span {{ $t('flashcardScene.flip') }}

      Button.flashcard-nav__button.flashcard-nav__next(v-if="!isWatchlistActive" round plain native-type="button" :disabled="isLast" @click="nextCard")
        AppIcon(name="tabler:chevron-right" :width="22" :height="22")

    // More button
    .flashcard-more
      Button.flashcard-more__button(round plain size="small" native-type="button" @click="isMoreSheetOpen = true")
        AppIcon(name="tabler:dots" :width="16" :height="16")
        span {{ $t('flashcardScene.more.title') }}
```

- [ ] **Step 8: Add ActionSheet template**

After the HowToPlayDialog, add:

```pug
  // More Options ActionSheet
  ActionSheet(v-model="isMoreSheetOpen" :title="$t('flashcardScene.more.title')")
    template(#default)
      .flashcard-options
        Cell.flashcard-options__item(:title="$t('flashcardScene.more.shuffle.label')")
          template(#right-icon)
            VanSwitch(:value="isShuffled" :size="24" @input="toggleShuffle")
        Cell.flashcard-options__item(:title="$t('flashcardScene.more.watchlist.label')")
          template(#right-icon)
            VanSwitch(:value="isWatchlistActive" :size="24" @input="toggleWatchlist")
```

- [ ] **Step 9: Export everything in return**

Add to the return object:

```javascript
      isMoreSheetOpen,
      isShuffled,
      toggleShuffle,
      isWatchlistActive,
      isWatchlistComplete,
      stillProgressCount,
      inMemoryCount,
      toggleWatchlist,
      markStillProgress,
      markInMemory
```

- [ ] **Step 10: Commit**

```bash
git add components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue
git commit -m "feat(flashcard): add more options ActionSheet with shuffle and watchlist"
```

---

### Task 4: FlashcardGameScene — SCSS

**Files:**
- Modify: `components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss`

- [ ] **Step 1: Add watchlist labels styles**

Add after `.flashcard-area` block (before `.flashcard-wrapper`):

```scss
  // Watchlist progress labels
  .watchlist-labels {
    display: flex;
    gap: $spacer * 4;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 480px;
    padding-inline: $spacer * 4;
    margin-block-end: $spacer * 2;

    &__item {
      display: inline-flex;
      gap: $spacer;
      align-items: center;
      font-size: var(--font-size-text-9);

      @include font-weight-semi-bold;

      &--still-progress {
        color: var(--color-danger-01);
      }

      &--in-memory {
        color: var(--color-success-01);
      }

      .app-icon {
        display: flex;
        color: currentColor;
      }
    }
  }
```

- [ ] **Step 2: Add watchlist action buttons styles**

Add after the hint styles:

```scss
  // Watchlist action buttons
  .watchlist-actions {
    display: flex;
    gap: $spacer * 6;
    align-items: center;
    justify-content: center;
    margin-block-start: $spacer * 4;

    &__button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;

      .app-icon {
        display: flex;
        color: currentColor;
      }

      &--cross {
        color: var(--color-danger-01);
        border-color: var(--color-danger-01);
      }

      &--check {
        color: var(--color-success-01);
        border-color: var(--color-success-01);
      }
    }
  }
```

- [ ] **Step 3: Add watchlist complete styles**

```scss
  // Watchlist complete
  .watchlist-complete {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $spacer * 4;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: $spacer * 8;
    text-align: center;

    &__text {
      color: var(--color-text-01);
      font-size: var(--font-size-text-4);

      @include font-weight-semi-bold;
    }

    &__stats {
      color: var(--color-text-03);
      font-size: var(--font-size-text-8);
    }
  }
```

- [ ] **Step 4: Add more button and ActionSheet styles**

```scss
  // More button
  .flashcard-more {
    display: flex;
    justify-content: center;
    padding-block-end: $spacer * 3;

    @include media-breakpoint-down(mobile) {
      padding-block-end: calc($spacer * 3 + max(0px, env(safe-area-inset-bottom)));
    }

    &__button {
      color: var(--color-text-03);
      font-size: var(--font-size-text-9);
      border-color: transparent;

      .app-icon {
        display: flex;
        margin-inline-end: $spacer;
        color: currentColor;
      }
    }
  }

  // ActionSheet options
  .flashcard-options {
    padding-block-end: $spacer * 4;

    &__item {
      .van-cell__title {
        color: var(--color-text-01);

        @include font-weight-semi-bold;
      }
    }
  }
```

- [ ] **Step 5: Commit**

```bash
git add components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss
git commit -m "style(flashcard): add styles for watchlist, shuffle, and more options"
```

---

### Task 5: Internationalization (i18n)

**Files:**
- Modify: `locales/en.js`
- Modify: `locales/tr.js`

- [ ] **Step 1: Add keys to en.js**

Find `flashcardScene` section and replace with:

```javascript
  flashcardScene: {
    front: 'FRONT',
    back: 'BACK',
    flip: 'Flip',
    tapToFlip: 'Tap the card to flip',
    more: {
      title: 'More',
      shuffle: {
        label: 'Shuffle'
      },
      watchlist: {
        label: 'Watchlist',
        stillProgress: 'Keep',
        inMemory: 'Don\'t show again',
        complete: 'No more cards to show'
      }
    }
  },
```

- [ ] **Step 2: Add keys to tr.js**

Find `flashcardScene` section and replace with:

```javascript
  flashcardScene: {
    front: 'ÖN YÜZ',
    back: 'ARKA YÜZ',
    flip: 'Çevir',
    tapToFlip: 'Kartı çevirmek için dokun',
    more: {
      title: 'Daha fazla',
      shuffle: {
        label: 'Karıştır'
      },
      watchlist: {
        label: 'İzleme listesi',
        stillProgress: 'Kalsın',
        inMemory: 'Tekrar gösterme',
        complete: 'Görünecek başka kart yok'
      }
    }
  },
```

- [ ] **Step 3: Commit**

```bash
git add locales/en.js locales/tr.js
git commit -m "feat(flashcard): add i18n keys for shuffle and watchlist options"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Manual test — Shuffle toggle**

Open a flashcard room. Tap "More" → toggle "Shuffle" on → cards should randomize but stay on current card. Toggle off → original order restored, still on same card.

- [ ] **Step 2: Manual test — Watchlist toggle**

Toggle "Watchlist" on:
- Nav arrows disappear
- Cross/checkmark buttons appear below card
- Progress labels appear above card ("Keep: 0", "Don't show again: 0")
- Cross → card goes to "Keep" list, moves to next non-memorized card
- Checkmark → card goes to "Don't show again" list, moves to next
- When all cards memorized → "No more cards to show" message

- [ ] **Step 3: Verify all changes committed**

```bash
git status
```
Expected: Clean working tree
