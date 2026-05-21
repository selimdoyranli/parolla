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
