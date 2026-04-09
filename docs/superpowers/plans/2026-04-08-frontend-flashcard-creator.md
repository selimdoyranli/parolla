# Frontend Flashcard Creator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add flashcard quiz type support to the Parolla frontend creator mode, allowing users to create, edit, and view rooms with flashcard items (front/back text pairs).

**Architecture:** Follows existing choiceList/qaList pattern. New `FLASHCARDS` quizType in enum, new FlashcardList/FlashcardItem partial components, useCreatorForm composable extended with flashcard state/methods, store actions updated to transform flashcardList for API, and a new compose page + quiz selection dialog entry.

**Tech Stack:** Nuxt 2, Vue 2 + Composition API, Vuex, Vant UI, Pug templates, SCSS

**Frontend repo:** `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`
**Backend spec:** `docs/superpowers/specs/2026-04-08-room-flashcard-embedded-crud-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `enums/quiz.enum.js` | Modify | Add `FLASHCARDS` to `quizTypeEnum` |
| `transformers/room.transformer.js` | Modify | Add `flashcards`, `flashcardCount` mapping |
| `store/creator/actions.js` | Modify | Add `flashcardList` transform in `postRoom`/`editRoom` |
| `composables/useCreatorForm.js` | Modify | Add flashcard form state, add/remove/reorder methods, submit logic |
| `components/Form/CreatorModeComposeForm/partials/FlashcardList.vue` | Create | Flashcard list container component |
| `components/Form/CreatorModeComposeForm/partials/FlashcardList.scss` | Create | Flashcard list styles |
| `components/Form/CreatorModeComposeForm/partials/FlashcardItem.vue` | Create | Individual flashcard item (front/back text) |
| `components/Form/CreatorModeComposeForm/partials/FlashcardItem.scss` | Create | Flashcard item styles |
| `components/Form/CreatorModeComposeForm/CreatorModeComposeForm.component.vue` | Modify | Add FlashcardList conditional rendering |
| `components/Dialog/CreateQuizSelectionDialog/CreateQuizSelectionDialog.component.vue` | Modify | Add flashcard quiz type option |
| `pages/CreatorMode/CreatorModeCompose/Flashcards.vue` | Create | Flashcard compose page wrapper |
| `locales/en.js` | Modify | Add flashcard i18n keys |
| `locales/tr.js` | Modify | Add flashcard i18n keys |

---

### Task 1: Enum, Transformer & Store Actions

**Files:**
- Modify: `enums/quiz.enum.js:1-4`
- Modify: `transformers/room.transformer.js:18-58`
- Modify: `store/creator/actions.js:5-67` (postRoom) and `69-132` (editRoom)

- [ ] **Step 1: Add FLASHCARDS to quizTypeEnum**

In `enums/quiz.enum.js`, change:

```javascript
export const quizTypeEnum = Object.freeze({
  QA: 'qa',
  CHOICES: 'choices'
})
```

To:

```javascript
export const quizTypeEnum = Object.freeze({
  QA: 'qa',
  CHOICES: 'choices',
  FLASHCARDS: 'flashcards'
})
```

- [ ] **Step 2: Add flashcards to room transformer**

In `transformers/room.transformer.js`, add a `flashcardItemTransformer` helper function before the default export:

```javascript
const flashcardItemTransformer = model => {
  return {
    id: model.id,
    documentId: model.documentId,
    cardFrontText: model.cardFrontText,
    cardBackText: model.cardBackText,
    order: model.order,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt
  }
}
```

Then add these two fields to the default export object, after the `winnerChoices` line:

```javascript
flashcards: model.flashcards?.map(flashcardItemTransformer),
flashcardCount: model.flashcardCount,
```

- [ ] **Step 3: Add flashcardList transform in postRoom action**

In `store/creator/actions.js`, inside the `postRoom` action's `transform` function (line 8-47), add `flashcardList` after the `choiceList` mapping (after line 42):

```javascript
flashcardList: (form.flashcardList || []).map((item, index) => {
  return {
    cardFrontText: item.cardFrontText,
    cardBackText: item.cardBackText,
    order: index
  }
}),
```

- [ ] **Step 4: Add flashcardList transform in editRoom action**

In `store/creator/actions.js`, inside the `editRoom` action's `transform` function (line 72-112), add `flashcardList` after the `choiceList` mapping (after line 107):

```javascript
flashcardList: (form.flashcardList || []).map((item, index) => {
  return {
    documentId: item.documentId,
    cardFrontText: item.cardFrontText,
    cardBackText: item.cardBackText,
    order: index
  }
}),
```

- [ ] **Step 5: Commit**

```bash
git add enums/quiz.enum.js transformers/room.transformer.js store/creator/actions.js
git commit -m "feat: add flashcard quizType enum, transformer, and store actions"
```

---

### Task 2: useCreatorForm Composable — Flashcard State & Methods

**Files:**
- Modify: `composables/useCreatorForm.js:1-672`

- [ ] **Step 1: Add flashcardList to form reactive state**

In the `form` reactive object (line 21-43), add `flashcardList` after `choices` (line 41):

```javascript
flashcardList:
  initialQuizType === quizTypeEnum.FLASHCARDS && props.room?.flashcards
    ? props.room.flashcards.map((fc, idx) => ({
        ...fc,
        id: fc.id || Date.now() + idx,
        order: idx
      }))
    : [],
```

- [ ] **Step 2: Update initialQuizType to detect Flashcards page**

Change the `initialQuizType` logic (line 16-19) from:

```javascript
const initialQuizType =
  route.value.query.mode === quizTypeEnum.CHOICES || getRouteBaseName(route.value) === 'CreatorMode-CreatorModeCompose-Choices'
    ? quizTypeEnum.CHOICES
    : props.room?.quizType || quizTypeEnum.QA
```

To:

```javascript
const initialQuizType = (() => {
  if (route.value.query.mode === quizTypeEnum.CHOICES || getRouteBaseName(route.value) === 'CreatorMode-CreatorModeCompose-Choices') {
    return quizTypeEnum.CHOICES
  }
  if (route.value.query.mode === quizTypeEnum.FLASHCARDS || getRouteBaseName(route.value) === 'CreatorMode-CreatorModeCompose-Flashcards') {
    return quizTypeEnum.FLASHCARDS
  }
  return props.room?.quizType || quizTypeEnum.QA
})()
```

- [ ] **Step 3: Add flashcard handling to addItem method**

In the `addItem` function (line 131-163), add a FLASHCARDS block after the QA block:

```javascript
if (form.quizType === quizTypeEnum.FLASHCARDS) {
  form.flashcardList.push({
    id: Date.now() + Math.random(),
    cardFrontText: '',
    cardBackText: '',
    order: form.flashcardList.length
  })
}
```

- [ ] **Step 4: Add flashcard handling to removeItem method**

In the `removeItem` function (line 165-173), add after the QA block:

```javascript
if (form.quizType === quizTypeEnum.FLASHCARDS) {
  form.flashcardList.splice(index, 1)
  form.flashcardList.forEach((item, idx) => {
    item.order = idx
  })
}
```

- [ ] **Step 5: Add flashcard handling to moveUp/moveDown methods**

In `moveUp` (line 175-183), add after the QA block:

```javascript
if (form.quizType === quizTypeEnum.FLASHCARDS) {
  const item = form.flashcardList.splice(index, 1)[0]
  form.flashcardList.splice(index - 1, 0, item)
  form.flashcardList.forEach((item, idx) => {
    item.order = idx
  })
}
```

In `moveDown` (line 185-192), add after the QA block:

```javascript
if (form.quizType === quizTypeEnum.FLASHCARDS) {
  if (index === form.flashcardList.length - 1) return
  const item = form.flashcardList.splice(index, 1)[0]
  form.flashcardList.splice(index + 1, 0, item)
  form.flashcardList.forEach((item, idx) => {
    item.order = idx
  })
}
```

- [ ] **Step 6: Add flashcard validation and payload in handleSubmit**

In `handleSubmit` (line 403-610), add validation block after the QA validation block (after line 457):

```javascript
if (form.quizType === quizTypeEnum.FLASHCARDS) {
  if (form.flashcardList.length < 1 || form.flashcardList.length > 100) {
    getErrorNotify({
      error: {
        message: i18n.t('error.flashcardListLength', { min: 1, max: 100 })
      }
    })
    form.isBusy = false
    closeCreatingRoomModal()

    return
  }

  const invalidItems = form.flashcardList.filter(
    item => !item.cardFrontText || item.cardFrontText.trim() === '' || !item.cardBackText || item.cardBackText.trim() === ''
  )

  if (invalidItems.length > 0) isValid = false
}
```

Update the `payload` object (line 480-486) to include flashcardList:

Change from:

```javascript
const payload = {
  ...form,
  qaList: form.quizType === quizTypeEnum.QA ? form.qaList : [],
  choices: form.quizType === quizTypeEnum.CHOICES ? form.choices : [],
  gameTimeLimit: form.quizType === quizTypeEnum.QA ? form.gameTimeLimit : null,
  isVisible: getQuizVisibility()
}
```

To:

```javascript
const payload = {
  ...form,
  qaList: form.quizType === quizTypeEnum.QA ? form.qaList : [],
  choices: form.quizType === quizTypeEnum.CHOICES ? form.choices : [],
  flashcardList: form.quizType === quizTypeEnum.FLASHCARDS ? form.flashcardList : [],
  gameTimeLimit: form.quizType === quizTypeEnum.QA ? form.gameTimeLimit : null,
  isVisible: getQuizVisibility()
}
```

Also update `itemsWithMedia` section — flashcards have no media, so no change needed there. The `selectedMediaCount` will be 0 for flashcards, which is correct (no media upload step).

- [ ] **Step 7: Update isVisibleSaveDraftButton and handleBeforeUnload**

Update `isVisibleSaveDraftButton` (line 616-620):

Change from:

```javascript
const isVisibleSaveDraftButton = computed(() => {
  const hasItems = (form.qaList && form.qaList.length > 0) || (form.choices && form.choices.length > 0)

  return hasItems && (!props.room || (props.room && !props.room.isVisible))
})
```

To:

```javascript
const isVisibleSaveDraftButton = computed(() => {
  const hasItems =
    (form.qaList && form.qaList.length > 0) ||
    (form.choices && form.choices.length > 0) ||
    (form.flashcardList && form.flashcardList.length > 0)

  return hasItems && (!props.room || (props.room && !props.room.isVisible))
})
```

Update `handleBeforeUnload` (line 623-632):

Change from:

```javascript
const hasContent = form.roomTitle.length > 0 || form.qaList.length > 0 || form.choices.length > 0 || form.tags.length > 0
```

To:

```javascript
const hasContent = form.roomTitle.length > 0 || form.qaList.length > 0 || form.choices.length > 0 || form.flashcardList.length > 0 || form.tags.length > 0
```

- [ ] **Step 8: Commit**

```bash
git add composables/useCreatorForm.js
git commit -m "feat: add flashcard state and methods to useCreatorForm composable"
```

---

### Task 3: FlashcardItem Component

**Files:**
- Create: `components/Form/CreatorModeComposeForm/partials/FlashcardItem.vue`
- Create: `components/Form/CreatorModeComposeForm/partials/FlashcardItem.scss`

- [ ] **Step 1: Create FlashcardItem.vue**

Create `components/Form/CreatorModeComposeForm/partials/FlashcardItem.vue`:

```vue
<template lang="pug">
.compose-qa-card.flashcard-item
  Field.creator-mode-compose-form__questionField(
    v-model="item.cardFrontText"
    name="cardFrontText"
    :label="$t('form.creatorModeCompose.flashcards.front.label')"
    :placeholder="$t('form.creatorModeCompose.flashcards.front.placeholder')"
    maxlength="256"
    rows="2"
    type="textarea"
    autosize
    show-word-limit
    :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.flashcards.front.label') }) }]"
  )

  Field.creator-mode-compose-form__questionField(
    v-model="item.cardBackText"
    name="cardBackText"
    :label="$t('form.creatorModeCompose.flashcards.back.label')"
    :placeholder="$t('form.creatorModeCompose.flashcards.back.placeholder')"
    maxlength="256"
    rows="2"
    type="textarea"
    autosize
    show-word-limit
    :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.flashcards.back.label') }) }]"
  )

  .compose-qa-card__actions
    label.compose-qa-card__index {{ index + 1 }}. {{ $t('form.creatorModeCompose.flashcards.card') }}

    .compose-qa-card__orderButtons
      Button.compose-qa-card__orderButton(
        v-if="index > 0"
        icon="arrow-up"
        plain
        native-type="button"
        round
        size="small"
        @click="$emit('move-up', index)"
      )
      Button.compose-qa-card__orderButton(
        v-if="!isLast"
        icon="arrow-down"
        plain
        native-type="button"
        round
        size="small"
        @click="$emit('move-down', index)"
      )

    Button.compose-qa-card__removeButton(
      type="danger"
      icon="cross"
      plain
      native-type="button"
      round
      size="small"
      @click="$emit('remove', index)"
    ) {{ $t('form.creatorModeCompose.flashcards.removeCard') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Field, Button } from 'vant'

export default defineComponent({
  name: 'FlashcardItem',
  components: {
    Field,
    Button
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    isLast: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss" src="./FlashcardItem.scss"></style>
```

- [ ] **Step 2: Create FlashcardItem.scss**

Create `components/Form/CreatorModeComposeForm/partials/FlashcardItem.scss`:

```scss
.flashcard-item {
  .compose-qa-card__orderButtons {
    display: inline-flex;
    gap: 4px;
    margin-right: 8px;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Form/CreatorModeComposeForm/partials/FlashcardItem.vue components/Form/CreatorModeComposeForm/partials/FlashcardItem.scss
git commit -m "feat: add FlashcardItem component"
```

---

### Task 4: FlashcardList Component

**Files:**
- Create: `components/Form/CreatorModeComposeForm/partials/FlashcardList.vue`
- Create: `components/Form/CreatorModeComposeForm/partials/FlashcardList.scss`

- [ ] **Step 1: Create FlashcardList.vue**

Create `components/Form/CreatorModeComposeForm/partials/FlashcardList.vue`:

```vue
<template lang="pug">
.flashcard-list
  span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.flashcards.set') }}
  .creator-mode-compose-form__fields
    .compose-qa-list
      // Flashcard List
      template(v-if="flashcardList && flashcardList.length > 0")
        .flashcard-list-item(v-for="(item, index) in flashcardList" :key="item.id")
          FlashcardItem(
            :item="item"
            :index="index"
            :is-last="index === flashcardList.length - 1"
            @remove="$emit('remove', index)"
            @move-up="$emit('move-up', index)"
            @move-down="$emit('move-down', index)"
          )

      // Empty List
      template(v-else)
        Empty.flashcard-list-empty
          template(#image)
            Icon(name="tabler:cards" size="64")
          p.flashcard-list-empty__description {{ $t('form.creatorModeCompose.flashcards.empty.description') }}
          Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="$emit('add-item')")
            | {{ $t('form.creatorModeCompose.flashcards.empty.action') }}

      // Add flashcard button
      Button.compose-qa-list__addQaButton(
        v-if="flashcardList && flashcardList.length > 0"
        type="info"
        icon="plus"
        plain
        native-type="button"
        round
        :loading="isBusy"
        :disabled="isBusy"
        @click="$emit('add-item')"
      )
        | {{ $t('form.creatorModeCompose.flashcards.addMore.action') }}

    p.creator-mode-compose-form__termsDescription
      | {{ $t('form.creatorModeCompose.termsDescription') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import FlashcardItem from './FlashcardItem.vue'

export default defineComponent({
  name: 'FlashcardList',
  components: {
    Empty,
    Button,
    FlashcardItem
  },
  props: {
    flashcardList: {
      type: Array,
      default: () => []
    },
    isBusy: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss" src="./FlashcardList.scss"></style>
```

- [ ] **Step 2: Create FlashcardList.scss**

Create `components/Form/CreatorModeComposeForm/partials/FlashcardList.scss`:

```scss
.flashcard-list {
  .flashcard-list-empty {
    &__description {
      white-space: pre-line;
      text-align: center;
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Form/CreatorModeComposeForm/partials/FlashcardList.vue components/Form/CreatorModeComposeForm/partials/FlashcardList.scss
git commit -m "feat: add FlashcardList component"
```

---

### Task 5: CreatorModeComposeForm — Integrate FlashcardList

**Files:**
- Modify: `components/Form/CreatorModeComposeForm/CreatorModeComposeForm.component.vue:1-228`

- [ ] **Step 1: Import FlashcardList component**

In the script section, add import after line 98 (`import QuestionList`):

```javascript
import FlashcardList from './partials/FlashcardList.vue'
```

Add `FlashcardList` to the components object (after `QuestionList` at line 105):

```javascript
components: {
  Form,
  Tag,
  ChoiceList,
  QuestionList,
  FlashcardList
},
```

- [ ] **Step 2: Add FlashcardList to template**

In the template, the current structure is:
- `ChoiceList` renders when `form.quizType === quizTypeEnum.CHOICES`
- `QuestionList` renders with `v-else`

Change the `QuestionList` from `v-else` to `v-else-if="form.quizType === quizTypeEnum.QA"`, and add FlashcardList after it.

Replace the `QuestionList` block (lines 34-52) and add FlashcardList after it:

Change:

```pug
  QuestionList(
    v-else
    :qa-list.sync="form.qaList"
```

To:

```pug
  QuestionList(
    v-else-if="form.quizType === quizTypeEnum.QA"
    :qa-list.sync="form.qaList"
```

Then add after the QuestionList block (after line 52):

```pug
  FlashcardList(
    v-else-if="form.quizType === quizTypeEnum.FLASHCARDS"
    :flashcard-list.sync="form.flashcardList"
    :is-busy="form.isBusy"
    @add-item="addItem"
    @remove="removeItem"
    @move-up="moveUp"
    @move-down="moveDown"
  )
```

- [ ] **Step 3: Update FormActions qa-list-length prop**

The FormActions component receives `qa-list-length` to control the submit button. Update it to include flashcards.

Change (line 65):

```pug
    :qa-list-length="form.quizType === quizTypeEnum.CHOICES ? form.choices.length : form.qaList.length"
```

To:

```pug
    :qa-list-length="form.quizType === quizTypeEnum.CHOICES ? form.choices.length : form.quizType === quizTypeEnum.FLASHCARDS ? form.flashcardList.length : form.qaList.length"
```

- [ ] **Step 4: Update title display for flashcards**

In the template title section (lines 3-10), add flashcard title variants.

Change lines 4-10 from:

```pug
    template(v-if="room")
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeEdit.choicesTitle') }}
      template(v-else) {{ $t('form.creatorModeEdit.title') }}
      Tag.creator-mode-compose-form__draftTag(v-if="form.isDraft" type="warning") {{ $t('general.draft') }}
    template(v-else)
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeCompose.choicesTitle') }}
      template(v-else) {{ $t('form.creatorModeCompose.title') }}
```

To:

```pug
    template(v-if="room")
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeEdit.choicesTitle') }}
      template(v-else-if="form.quizType === quizTypeEnum.FLASHCARDS") {{ $t('form.creatorModeEdit.flashcardsTitle') }}
      template(v-else) {{ $t('form.creatorModeEdit.title') }}
      Tag.creator-mode-compose-form__draftTag(v-if="form.isDraft" type="warning") {{ $t('general.draft') }}
    template(v-else)
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeCompose.choicesTitle') }}
      template(v-else-if="form.quizType === quizTypeEnum.FLASHCARDS") {{ $t('form.creatorModeCompose.flashcardsTitle') }}
      template(v-else) {{ $t('form.creatorModeCompose.title') }}
```

- [ ] **Step 5: Commit**

```bash
git add components/Form/CreatorModeComposeForm/CreatorModeComposeForm.component.vue
git commit -m "feat: integrate FlashcardList into CreatorModeComposeForm"
```

---

### Task 6: Flashcard Compose Page & Quiz Selection Dialog

**Files:**
- Create: `pages/CreatorMode/CreatorModeCompose/Flashcards.vue`
- Modify: `components/Dialog/CreateQuizSelectionDialog/CreateQuizSelectionDialog.component.vue:1-72`

- [ ] **Step 1: Create Flashcards compose page**

Create `pages/CreatorMode/CreatorModeCompose/Flashcards.vue`:

```vue
<template lang="pug">
.page.creator-mode-compose-page
  CreatorModeComposeForm
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.creatorModeComposeFlashcards.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeCompose.page.scss"></style>
```

- [ ] **Step 2: Add flashcard option to CreateQuizSelectionDialog**

In `components/Dialog/CreateQuizSelectionDialog/CreateQuizSelectionDialog.component.vue`, add a third IntroButton after the "This or That?" option (after line 32):

```pug
    IntroButton.quiz-type-list-item(
      icon="tabler:cards"
      auth-control
      :to="localePath({ name: 'CreatorMode-CreatorModeCompose-Flashcards' })"
      :title="$t('dialog.createQuizSelection.quizType.flashcards.title')"
      :headLabel="{ title: $t('dialog.createQuizSelection.quizType.flashcards.label') }"
      :description="$t('dialog.createQuizSelection.quizType.flashcards.description')"
      :playButtonText="$t('dialog.createQuizSelection.quizType.flashcards.createFlashcardsQuiz')"
    )
```

- [ ] **Step 3: Commit**

```bash
git add pages/CreatorMode/CreatorModeCompose/Flashcards.vue components/Dialog/CreateQuizSelectionDialog/CreateQuizSelectionDialog.component.vue
git commit -m "feat: add flashcard compose page and quiz selection dialog entry"
```

---

### Task 7: Internationalization (i18n)

**Files:**
- Modify: `locales/en.js`
- Modify: `locales/tr.js`

- [ ] **Step 1: Add flashcard form keys to en.js**

In `locales/en.js`, add `flashcardsTitle` at the form.creatorModeCompose level (after `choicesTitle` around line 566):

```javascript
flashcardsTitle: 'CREATE A FLASHCARDS QUIZ',
```

Add the flashcards form section inside `form.creatorModeCompose` (after the `choices` block, after line 677):

```javascript
flashcards: {
  set: 'FLASHCARD SET',
  card: 'Card',
  front: {
    label: 'Front',
    placeholder: 'Card front text'
  },
  back: {
    label: 'Back',
    placeholder: 'Card back text'
  },
  removeCard: 'Remove card',
  empty: {
    description: "You haven't added any flashcard yet\nAt least 1 card, at most 100 cards can be added",
    action: 'Add flashcard'
  },
  addMore: {
    action: 'Add new card'
  }
},
```

Add edit title in `form.creatorModeEdit` section:

```javascript
flashcardsTitle: 'EDIT FLASHCARDS QUIZ',
```

Add quiz selection dialog keys in `dialog.createQuizSelection.quizType` (after the `thisOrThat` block):

```javascript
flashcards: {
  title: 'Flashcards',
  description: 'Create a set of cards with front and back text for studying',
  label: 'Study with flashcards',
  createFlashcardsQuiz: 'Create flashcards quiz'
},
```

Add error key in the `error` section:

```javascript
flashcardListLength: 'Flashcard list must have at least {min} and at most {max} cards',
```

Add SEO keys in the `seo` section:

```javascript
creatorModeComposeFlashcards: {
  title: 'Create Flashcards Quiz',
  description: 'Create a flashcard quiz for studying',
  keywords: 'flashcards, quiz, study, learning'
},
```

- [ ] **Step 2: Add flashcard form keys to tr.js**

Same structure in Turkish. Add `flashcardsTitle` at form.creatorModeCompose level:

```javascript
flashcardsTitle: 'KART QUIZ OLUŞTUR',
```

Add the flashcards form section:

```javascript
flashcards: {
  set: 'KART SETİ',
  card: 'Kart',
  front: {
    label: 'Ön yüz',
    placeholder: 'Kartın ön yüz metni'
  },
  back: {
    label: 'Arka yüz',
    placeholder: 'Kartın arka yüz metni'
  },
  removeCard: 'Kartı kaldır',
  empty: {
    description: "Henüz kart eklemedin\nEn az 1, en fazla 100 kart eklenebilir",
    action: 'Kart ekle'
  },
  addMore: {
    action: 'Yeni kart ekle'
  }
},
```

Add edit title:

```javascript
flashcardsTitle: 'KART QUİZ DÜZENLE',
```

Add quiz selection dialog keys:

```javascript
flashcards: {
  title: 'Kartlar',
  description: 'Çalışma için ön ve arka yüzü olan kartlar oluştur',
  label: 'Kartlarla çalış',
  createFlashcardsQuiz: 'Kart quiz oluştur'
},
```

Add error key:

```javascript
flashcardListLength: 'Kart listesi en az {min}, en fazla {max} kart olmalıdır',
```

Add SEO keys:

```javascript
creatorModeComposeFlashcards: {
  title: 'Kart Quiz Oluştur',
  description: 'Çalışma için kart quiz oluştur',
  keywords: 'kartlar, quiz, çalışma, öğrenme'
},
```

- [ ] **Step 3: Commit**

```bash
git add locales/en.js locales/tr.js
git commit -m "feat: add flashcard i18n keys for en and tr locales"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Verify dev server starts**

Run: `yarn dev`
Expected: Dev server starts without errors

- [ ] **Step 2: Manual test — navigate to quiz selection dialog**

Open browser, navigate to Creator Mode, click "Create Quiz". Verify the flashcard option appears as a third option.

- [ ] **Step 3: Manual test — create flashcard quiz**

Click the flashcard option. Verify:
- The compose form loads with "CREATE A FLASHCARDS QUIZ" title
- Empty state shows with "Add flashcard" button
- Adding cards shows front/back text fields
- Reorder buttons (up/down) work
- Remove button works
- Game time limit field is NOT shown (flashcards don't use it)

- [ ] **Step 4: Verify all changes are committed**

Run: `git status`
Expected: Clean working tree
