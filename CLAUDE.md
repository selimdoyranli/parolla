# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**parolla** is a Turkish word game web app (parolla.app) built with **Nuxt 2 (Vue 2)**, deployed as a static SPA. It features multiple game modes: daily quizzes, unlimited mode, user-created quizzes, tournaments, word puzzles (Wordblock), music guessing, and a tycoon sim.

## Commands

```bash
yarn dev              # Dev server at localhost:3000
yarn generate         # Static site generation (production build)
yarn build            # Nuxt build (without SSG)
yarn start            # Serve production build
yarn lint:eslint      # Run ESLint
yarn lint:eslint:fix  # Fix ESLint issues
yarn lint:stylelint   # Run Stylelint
yarn lint:stylelint:fix # Fix Stylelint issues
yarn prettier         # Format code with Prettier
yarn commit           # Commitizen conventional commit
yarn changelog        # Generate changelog with changelogen
```

No test runner is configured. Pre-commit hooks (Husky + lint-staged) run ESLint, Stylelint, and Prettier on staged files.

## Tech Stack

- **Framework:** Nuxt 2.17.1 / Vue 2 (target: `static`, ssr: `false`)
- **Language:** JavaScript (no TypeScript), uses `@nuxtjs/composition-api` for Vue 3-style composables
- **Templates:** Pug (all `.vue` files use `<template lang="pug">`)
- **Styling:** SCSS with Bootstrap 5.2.3, scoped component styles
- **State:** Vuex (modular, persisted to localStorage via vuex-persist)
- **i18n:** Turkish (default, no prefix) and English (`/en` prefix) via `@nuxtjs/i18n`
- **Auth:** `@nuxtjs/auth-next` with Google OAuth
- **Package manager:** Yarn 4.6.0 / Node 22.11.0

## Architecture

### Component Pattern

Components live in `components/` organized by UI type (Button, Card, Dialog, Form, etc.). Each component is a folder containing:
- `ComponentName.component.vue` — Pug template + Composition API script
- `ComponentName.component.scss` — Scoped styles

Components are auto-imported with the `Component` suffix stripped from the name (e.g., `ChoiceCard.component.vue` → `<ChoiceCard />`).

### Pages & Game Modes

Pages use Nuxt file-based routing in `pages/`. Each game mode has its own directory, store module, and localized routes:
- `DailyMode/` → `/gunluk` (tr), `/daily` (en)
- `UnlimitedMode/` → `/limitsiz`, `/unlimited`
- `CreatorMode/` → `/yaratici`, `/creator` (with sub-routes for rooms, compose, edit)
- `TourMode/` → `/tur`, `/tour`
- `WordblockMode/` → `/kelimeblok`, `/wordblock`
- `MusicMode/` → `/muzik`, `/music`
- `Tycoon/KnowledgeKingdom/` → `/bilgi-kralligi`, `/knowledge-kingdom`

Localized route mappings are defined in `nuxt.config.js` under the i18n `pages` option.

### Vuex Store

Modular store in `store/` with one module per feature: `app/`, `auth/`, `daily/`, `unlimited/`, `creator/`, `tour/`, `wordblock/`, `music/`, `profile/`, `preloader/`, `tycoon/`. Root store (`store/index.js`) runs `nuxtClientInit` for auth setup on client load.

### Composables

14 auto-imported composables in `composables/` (via `unplugin-auto-import`): `useAuth`, `useAvatar`, `useCensorBadwords`, `useChoices`, `useCreatorForm`, `useDeviceInfo`, `useDialog`, `useFile`, `useFormatter`, `useGameMode`, `useGameScene`, `useScroll`, `useTime`, `useWordblock`.

### Data Layer

- **API client:** `$appFetch` plugin (`plugins/app-fetch.js`) wraps Axios with locale transformation, returning `{ data, error }` tuples
- **Backend:** Strapi API at `API_URL` env var (default: `https://strapi.parolla.app/api`)
- **WebSocket:** Real-time features via `isomorphic-ws` at `WS_URL` env var
- **Transformers:** `transformers/` directory for normalizing API data (room, user, roomReview, scoreboard)

### Enums

`enums/` contains frozen object enums: `gameModeKeyEnum`, `wsTypeEnum`, quiz enums (`choiceTypeEnum`, `questionTypeEnum`), `reportTypeEnum`.

### System Constants

`system/constant.js` defines app-wide constants: game rules (`GAME_TIME_LIMIT`: 5min, `ANSWER_CHAR_LENGTH`: 64, `WORDBLOCK_MAX_ATTEMPTS`: 6, `WORDBLOCK_AVAILABLE_LENGTHS`: [5,6,7]), validation regexes, and app metadata.

## Code Style

- **No semicolons**, trailing commas, arrow parens only as-needed
- **Max line length:** 150 characters
- **Blank lines** required before `return`, `if`, `switch`, `for`, `function`, and after imports
- **Vue component ordering** enforced by `vue/order-in-components`
- **Pug print width:** 140 characters
- **SCSS:** Stylelint with rational property ordering
- **Commits:** Conventional commits (commitizen with `cz-conventional-changelog`)

## Global SCSS

`assets/style/scss/app.scss` is the global entry point. Bootstrap functions/variables/mixins and custom overrides are auto-injected into all components via `styleResources` in nuxt.config. Custom SCSS functions in `assets/style/scss/functions/` and mixins in `assets/style/scss/mixins/`.

## Environment Variables

```
API_URL               # Backend API URL (default: https://strapi.parolla.app/api)
WS_URL                   # WebSocket URL (default: wss://0.0.0.0:1881)
GOOGLE_AUTH_CLIENT_ID    # Google OAuth client ID
GOOGLE_AUTH_REDIRECT_URI # Google OAuth redirect URI
```

## Deployment

Static site generation deployed to Cloudflare (with redirect preparation via `.cloudflare/scripts/redirects.js`) and Vercel. The `generate` command runs `nuxt generate` followed by Cloudflare redirect setup.

## Mobile WebView Bridge

This web app is embedded inside native WebViews by two mobile shells:
- **`parolla-mobile`** — the current Expo (React Native) app. See its companion `CLAUDE.md` in the sibling `parolla-mobile` repo for the native side of the bridge.
- **Legacy Flutter app** — still in production. It listens for the same `window` message events, so it must not be broken by changes here.

### `useNativeBridge` composable

`composables/useNativeBridge.js` is auto-imported like the other composables (used without an `import` statement). It exposes:

```js
const { isWebView, isExpoWebView, isFlutterWebView, postToNative } = useNativeBridge()
```

- `isFlutterWebView` (computed) — `true` when `window.flutter_inappwebview` is present.
- `isExpoWebView` (computed) — `true` when `window.ReactNativeWebView` is present or the user agent matches `/ParollaApp/i`.
- `isWebView` (computed) — `true` when either of the above is `true`.
- `postToNative(type, data)` — sends `{ type, data }` to the native shell via `window.postMessage(...)`.

### Message contract (web → native)

| `type`                 | Payload           | Native behavior                                      |
|------------------------|-------------------|-------------------------------------------------------|
| `sharer`                | `string` (share text) | Native copies text to clipboard and opens the native Share sheet. |
| `google-auth-request`   | none              | Native opens the Google sign-in sheet.                |
| `end-game`              | `true`            | Received natively; currently a no-op on the native side. |

All messages currently flow **web → native** only.

### Critical rule: do not change the transport

`postToNative` calls `window.postMessage({ type, data }, '*')` — this **must remain the transport**. The legacy Flutter app in production listens for these `window` message events. Do **not**:
- Call `window.ReactNativeWebView.postMessage` (or any Expo-specific API) directly from web code instead of going through `postToNative`.
- Rename or repurpose the `type` strings (`sharer`, `google-auth-request`, `end-game`) without first retiring the Flutter bridge.

Both native shells listen for the same `window.postMessage` events, so any change to the contract is a breaking change for whichever shell isn't updated in lockstep.

### Google login bridge path

In `components/Form/Auth/LoginForm/LoginForm.component.vue`, `handleGoogleLogin` checks `isExpoWebView.value`:
- Inside the Expo webview: calls `postToNative('google-auth-request')` and returns (no redirect). The native app then runs Google sign-in via the **native Google Sign-In SDK** — a native account picker, no browser and no extra layer (Google blocks OAuth inside embedded WebViews).
- Everywhere else (normal browsers and the Flutter app): falls back to `window.location.href = \`${process.env.API_URL}/connect/google\``.

**Native auth completion (`plugins/native-auth.js`).** The Expo app does Google sign-in natively and hands back a Google **access token** by calling `window.__parollaMobileAuthComplete(accessToken)` inside the WebView. This plugin registers that global: it exchanges the token with Strapi via the existing `auth/fetchGoogleUser` (`auth/google/callback?access_token=…`) → `auth/setGoogleUser` → `auth/fetchMe` actions and sets the authed user in the Vuex store **in place** — the current page becomes authenticated with no navigation, reload, or extra layer. Registered in `nuxt.config.js` as a client-only plugin (`ssr: false`). Only the native shell ever calls this global; desktop and Flutter are unaffected.

### Where `postToNative` is used

- `sharer` — sent from `MenuDialog`'s `openAppSharer` and from the per-mode stats/result dialogs (`DailyModeStatsDialog`, `UnlimitedModeStatsDialog`, `CreatorModeStatsDialog`, `CreatorModeCreatedRoomDialog`, `WordblockModeStatsDialog`, `GuessTheSongStatsDialog`), each alongside the existing clipboard/`navigator.share` fallback.
- `google-auth-request` — sent from `LoginForm.component.vue`'s `handleGoogleLogin`.
- `end-game` — sent from `composables/useGameScene.js`'s `endGame()` when a game finishes.
