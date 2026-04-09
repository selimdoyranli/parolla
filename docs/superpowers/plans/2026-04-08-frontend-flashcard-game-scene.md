# Frontend Flashcard Game Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flashcard game scene where users flip cards (front/back) and navigate with left/right arrows, following the ChoicesGameScene pattern.

**Architecture:** New `useFlashcards` composable manages card state (current index, isFlipped). New `FlashcardGameScene` component renders a flippable card with navigation arrows. Room page routes to this scene when `quizType === FLASHCARDS`. HowToPlayDialog gets a flashcard content variant.

**Tech Stack:** Nuxt 2, Vue 2 + Composition API, Vant UI, Pug, SCSS (CSS 3D transforms for card flip)

**Frontend repo:** `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `composables/useFlashcards.js` | Create | Flashcard game state — current card, flip, navigation |
| `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue` | Create | Game scene — card display, flip interaction, nav arrows |
| `components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss` | Create | Card flip animation, layout, nav styling |
| `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.vue` | Create | How-to-play instructions for flashcards |
| `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.scss` | Create | Minimal styling |
| `components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue` | Modify | Add flashcard content variant |
| `pages/CreatorMode/CreatorModeRoom/_slug.vue` | Modify | Route to FlashcardGameScene |
| `locales/en.js` | Modify | Flashcard game scene i18n keys |
| `locales/tr.js` | Modify | Flashcard game scene i18n keys (Turkish) |

---

### Task 1: useFlashcards Composable

**Files:**
- Create: `composables/useFlashcards.js`

- [ ] **Step 1: Create the composable**

Create `composables/useFlashcards.js`:

```javascript
import { ref, computed } from '@nuxtjs/composition-api'

export default () => {
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(false)

  const currentCard = computed(() => {
    return flashcards.value[currentIndex.value] || null
  })

  const totalCards = computed(() => flashcards.value.length)

  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === flashcards.value.length - 1)

  const initGame = flashcardsArray => {
    if (!flashcardsArray || flashcardsArray.length === 0) return

    flashcards.value = [...flashcardsArray].sort((a, b) => a.order - b.order)
    currentIndex.value = 0
    isFlipped.value = false
  }

  const flipCard = () => {
    isFlipped.value = !isFlipped.value
  }

  const nextCard = () => {
    if (currentIndex.value < flashcards.value.length - 1) {
      isFlipped.value = false
      currentIndex.value++
    }
  }

  const prevCard = () => {
    if (currentIndex.value > 0) {
      isFlipped.value = false
      currentIndex.value--
    }
  }

  return {
    flashcards,
    currentIndex,
    isFlipped,
    currentCard,
    totalCards,
    isFirst,
    isLast,
    initGame,
    flipCard,
    nextCard,
    prevCard
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useFlashcards.js
git commit -m "feat: add useFlashcards composable for flashcard game state"
```

---

### Task 2: FlashcardGameScene Component

**Files:**
- Create: `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue`
- Create: `components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss`

- [ ] **Step 1: Create FlashcardGameScene.component.vue**

Create `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue`:

```vue
<template lang="pug">
.scene.game-scene.flashcard-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  .scene__inner.game-scene__inner
    // Info header
    .room-info
      .room-info__title {{ room.title }}
      .card-counter {{ currentIndex + 1 }} / {{ totalCards }}

    // Card area
    .flashcard-area(v-if="currentCard")
      .flashcard-wrapper(@click="flipCard")
        .flashcard(:class="{ 'is-flipped': isFlipped }")
          .flashcard__face.flashcard__front
            .flashcard__label {{ $t('flashcardScene.front') }}
            .flashcard__text {{ currentCard.cardFrontText }}
          .flashcard__face.flashcard__back
            .flashcard__label {{ $t('flashcardScene.back') }}
            .flashcard__text {{ currentCard.cardBackText }}

      // Tap hint
      p.flashcard-area__hint {{ $t('flashcardScene.tapToFlip') }}

    // Navigation
    .flashcard-nav
      Button.flashcard-nav__button(
        icon="arrow-left"
        round
        plain
        :disabled="isFirst"
        native-type="button"
        @click="prevCard"
      )

      Button.flashcard-nav__button.flashcard-nav__flip(
        round
        type="info"
        plain
        native-type="button"
        @click="flipCard"
      )
        AppIcon(name="tabler:rotate" size="20")
        |  {{ $t('flashcardScene.flip') }}

      Button.flashcard-nav__button(
        icon="arrow"
        round
        plain
        :disabled="isLast"
        native-type="button"
        @click="nextCard"
      )

  // How To Play Dialog
  HowToPlayDialog(:isOpen="dialog.howToPlay.isOpen" @closed="startGame")
</template>

<script>
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed, watch } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const store = useStore()
    const { $ua } = useContext()

    const rootRef = ref(null)

    const { setRootRef, dialog, startGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = useGameScene()
    const { initGame, flipCard, nextCard, prevCard, currentCard, currentIndex, totalCards, isFlipped, isFirst, isLast } = useFlashcards()

    const room = computed(() => store.getters['creator/room'])

    const resetGame = () => {
      dialog.howToPlay.isOpen = true
      initGame(room.value?.flashcards || [])
    }

    watch(
      () => room.value,
      () => {
        resetGame()
      }
    )

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

    onMounted(() => {
      setRootRef(rootRef.value)
      resetGame()

      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('beforeunload', event => handleBeforeUnload(event))
      window.addEventListener('scroll', scrollTop)
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('scroll', scrollTop)
    })

    const gameSceneClasses = computed(() => {
      return {
        'game-scene--isMobileDevice': $ua.isFromMobilephone()
      }
    })

    return {
      rootRef,
      room,
      dialog,
      startGame,
      resetGame,
      gameSceneClasses,
      flipCard,
      nextCard,
      prevCard,
      currentCard,
      currentIndex,
      totalCards,
      isFlipped,
      isFirst,
      isLast
    }
  }
})
</script>

<style lang="scss" src="./FlashcardGameScene.component.scss"></style>
```

- [ ] **Step 2: Create FlashcardGameScene.component.scss**

Create `components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss`:

```scss
@import '@/assets/style/scss/shared/_game-scene.scss';

.flashcard-game-scene {
  --room-info-height: 60px;

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .scene__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 0;
    padding-block-start: var(--room-info-height);
  }

  .room-info {
    position: fixed;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: var(--layout-max-width);
    height: var(--room-info-height);
    background-color: var(--color-ui-02);
    border-bottom: 1px solid var(--color-border-03);
    transform: translateX(-50%);
    inset-block-start: var(--header-height);
    inset-inline-start: 50%;

    &__title {
      width: 100%;
      overflow: hidden;
      color: var(--color-brand-02);
      font-size: var(--font-size-7);
      white-space: nowrap;
      text-align: center;
      text-overflow: ellipsis;
      padding-inline: $spacer;
      padding-block-end: $spacer;

      @include font-weight-semi-bold;
    }

    .card-counter {
      color: var(--color-text-02);
      font-size: var(--font-size-8);
      text-align: center;
    }
  }

  // Card area
  .flashcard-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 480px;
    padding: $spacer * 4;

    &__hint {
      margin-block-start: $spacer * 3;
      color: var(--color-text-03);
      font-size: var(--font-size-8);
      text-align: center;
    }
  }

  // Flashcard with flip
  .flashcard-wrapper {
    width: 100%;
    aspect-ratio: 3 / 2;
    perspective: 1000px;
    cursor: pointer;

    @include media-breakpoint-down(mobile) {
      aspect-ratio: 4 / 3;
    }
  }

  .flashcard {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.5s ease;
    transform-style: preserve-3d;

    &.is-flipped {
      transform: rotateY(180deg);
    }

    &__face {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: $spacer * 4;
      overflow-y: auto;
      border-radius: $spacer * 2;
      backface-visibility: hidden;
    }

    &__front {
      background-color: var(--color-ui-01);
      border: 2px solid var(--color-border-02);
    }

    &__back {
      background-color: var(--color-brand-02);
      color: var(--color-text-inverse);
      transform: rotateY(180deg);
    }

    &__label {
      position: absolute;
      inset-block-start: $spacer * 2;
      inset-inline-start: $spacer * 3;
      font-size: var(--font-size-9);
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.5;

      @include font-weight-semi-bold;
    }

    &__text {
      font-size: var(--font-size-text-2);
      text-align: center;
      word-break: break-word;

      @include font-weight-semi-bold;

      @include media-breakpoint-down(mobile) {
        font-size: var(--font-size-text-3);
      }
    }
  }

  // Navigation
  .flashcard-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacer * 4;
    padding: $spacer * 4;
    padding-block-end: $spacer * 6;

    &__button {
      min-width: 48px;
      height: 48px;
    }

    &__flip {
      min-width: 100px;
    }

    @include media-breakpoint-down(mobile) {
      padding-block-end: calc($spacer * 6 + max(0px, env(safe-area-inset-bottom)));
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue components/Scene/FlashcardGameScene/FlashcardGameScene.component.scss
git commit -m "feat: add FlashcardGameScene component with card flip and navigation"
```

---

### Task 3: HowToPlay Flashcard Content & Dialog Integration

**Files:**
- Create: `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.vue`
- Create: `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.scss`
- Modify: `components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue`

- [ ] **Step 1: Create HowToPlayFlashcardsContent**

Create `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.vue`:

```vue
<template lang="pug">
.how-to-play-flashcards-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      div(v-html="$t('dialog.howToPlay.creator.flashcards.description', { cardCount: String(room.flashcardCount || 0) })")
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.creator.flashcards.extra')")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()

    const room = computed(() => store.getters['creator/room'])

    return {
      room
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayFlashcardsContent.component.scss"></style>
```

Create `components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.scss`:

```scss
.how-to-play-flashcards-content {
  p {
    line-height: 1.6;
  }
}
```

- [ ] **Step 2: Add flashcard variant to HowToPlayDialog**

In `components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue`, add after the `HowToPlayThisOrThatContent` line (line 15):

```pug
    HowToPlayFlashcardsContent(v-if="room && room.quizType === quizTypeEnum.FLASHCARDS")
```

In the `dialogTitle` computed (inside the `activeGameMode === gameModeKeyEnum.CREATOR` block), add after the CHOICES check (after line 83):

```javascript
        if (room.value.quizType === quizTypeEnum.FLASHCARDS) {
          return i18n.t('dialog.howToPlay.creator.flashcards.title')
        }
```

- [ ] **Step 3: Commit**

```bash
git add components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.vue components/Content/HowToPlayFlashcardsContent/HowToPlayFlashcardsContent.component.scss components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue
git commit -m "feat: add HowToPlay flashcards content and dialog integration"
```

---

### Task 4: Room Page Routing

**Files:**
- Modify: `pages/CreatorMode/CreatorModeRoom/_slug.vue`

- [ ] **Step 1: Add FlashcardGameScene route to room page**

In `pages/CreatorMode/CreatorModeRoom/_slug.vue`, add after the ChoicesGameScene line (line 12):

```pug
    FlashcardGameScene(v-if="room.quizType === quizTypeEnum.FLASHCARDS")
```

The template `v-else` section should now look like:

```pug
  template(v-else)
    CreatorModeGameScene(v-if="room.quizType === quizTypeEnum.QA || !room.quizType")
    ChoicesGameScene(v-if="room.quizType === quizTypeEnum.CHOICES")
    FlashcardGameScene(v-if="room.quizType === quizTypeEnum.FLASHCARDS")
```

- [ ] **Step 2: Commit**

```bash
git add pages/CreatorMode/CreatorModeRoom/_slug.vue
git commit -m "feat: route flashcard quizType to FlashcardGameScene in room page"
```

---

### Task 5: Internationalization (i18n)

**Files:**
- Modify: `locales/en.js`
- Modify: `locales/tr.js`

- [ ] **Step 1: Add flashcard game scene keys to en.js**

In `locales/en.js`, add a new top-level `flashcardScene` section:

```javascript
  flashcardScene: {
    front: 'FRONT',
    back: 'BACK',
    flip: 'Flip',
    tapToFlip: 'Tap the card to flip'
  },
```

Add howToPlay flashcards content in `dialog.howToPlay.creator` section:

```javascript
      flashcards: {
        title: 'Flashcards',
        description: 'This quiz has <strong>{cardCount} flashcards</strong>.',
        extra: 'Tap a card to flip it. Use arrows to navigate between cards.'
      },
```

- [ ] **Step 2: Add flashcard game scene keys to tr.js**

In `locales/tr.js`, add the same structure in Turkish:

```javascript
  flashcardScene: {
    front: 'ÖN YÜZ',
    back: 'ARKA YÜZ',
    flip: 'Çevir',
    tapToFlip: 'Kartı çevirmek için dokun'
  },
```

Add howToPlay flashcards content:

```javascript
      flashcards: {
        title: 'Kartlar',
        description: 'Bu quizde <strong>{cardCount} kart</strong> var.',
        extra: 'Kartı çevirmek için üzerine dokun. Kartlar arasında geçiş yapmak için okları kullan.'
      },
```

- [ ] **Step 3: Commit**

```bash
git add locales/en.js locales/tr.js
git commit -m "feat: add flashcard game scene i18n keys for en and tr locales"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Verify dev server starts**

Run: `yarn dev`
Expected: Dev server starts without errors

- [ ] **Step 2: Manual test — navigate to flashcard room**

Create a flashcard room, navigate to its play page. Verify:
- HowToPlay dialog shows with flashcard instructions
- Card displays front text
- Clicking card flips to show back text
- Left/right arrows navigate between cards
- Card counter shows "1 / N"
- Keyboard arrows (left/right) and Space/Enter for flip work

- [ ] **Step 3: Verify all changes committed**

Run: `git status`
Expected: Clean working tree
