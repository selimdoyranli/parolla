# ACS (Audio CSS) UI Sound Effects — Design

**Date:** 2026-05-23
**Branch:** `feature/acs-sfx` (derived from `feature/ui-ux`)
**Repo:** `parolla` (Nuxt 2 / Vue 2)

## Goal

Add ambient UI sound effects to every detectable interaction in the Parolla
frontend using [acs-audio](https://audiocss.dev) (ACS — Audio Cascading
Style Sheets). Sounds must be globally muted when the existing MenuDialog
"soundFx" switch is off and must respect the OS-level
`prefers-reduced-sound: reduce` accessibility setting. In-game gameplay
sounds (Howler-driven `.wav` files in `useGameScene.js`) are left untouched
but are also silenced by the same toggle.

## Background

- The app uses **vant** (Vue 2 port) for almost all interactive UI primitives:
  `Dialog`, `Button`, `Cell`, `CellGroup`, `Switch`, `Tab`, `Toast`, `Popup`,
  `Dropdown`. This gives us a stable, well-known set of CSS class names
  (`.van-button`, `.van-switch`, `.van-cell`, `.van-dialog`, `.van-popup`,
  `.van-toast`, `.van-tab`, …) we can target declaratively.
- Vuex already exposes `app.soundFx.isActive` (default `true`) with the
  `app/SET_IS_ACTIVE_SOUND_FX` mutation and the `app/isActiveSoundFx` getter.
  The state is persisted via `vuex-persist`. MenuDialog already renders a
  `SwitchInput` bound to this flag.
- `useGameScene.js` consumes the same getter to mute/unmute Howler
  instances. ACS will plug into the same getter — no schema change needed.
- The project targets `static` (SSR off) but ACS still must not run during
  build; it requires `window`, so the plugin is registered client-only.

## Architecture (Hybrid)

Two layers cooperate so we get blanket coverage without touching dozens of
components, while still keeping precise control for imperative call sites
(toasts, switch direction).

1. **Declarative layer — `assets/sound/parolla.acs`**
   A single `.acs` stylesheet maps vant CSS classes to ACS sound presets.
   Covers buttons, cells, tabs, dropdowns, dialogs, popups (drawer), inputs
   (keystroke + focus), and the generic toast appearance. Served as a
   static asset; loaded via `<link rel="audiostyle">`.
2. **Imperative layer — `useSfx` composable + `showToast` helper**
   A thin composable wraps `window.ACS.helpers.play(preset, opts)`. A
   `helpers/toast.js` wrapper around vant's `Toast` programmatic API pairs
   each toast variant (success / fail / info / default) with the matching
   ACS preset. Three explicit `useSfx().play(...)` calls handle the vant
   `Switch` toggle direction in MenuDialog.

### File plan

**New files**
- `assets/sound/parolla.acs` — declarative ACS stylesheet (source-of-truth
  for the sound palette).
- `static/sound/parolla.acs` — built/copied copy served at
  `/sound/parolla.acs`. (Nuxt 2 serves `static/` verbatim.)
- `plugins/acs.client.js` — client-only Nuxt plugin: imports `acs-audio`,
  injects `<link rel="audiostyle">`, syncs `window.ACS.setEnabled(...)`
  with the Vuex `app/isActiveSoundFx` getter (initial value + watcher).
- `composables/useSfx.js` — auto-imported composable, exposes
  `play(preset, opts)` and a no-op fallback when ACS isn't loaded yet
  (SSR/early-mount safety).
- `helpers/toast.js` — `showToast.success/fail/error/info/default(msg, opts)`
  wrapper that calls vant `Toast({...})` with the right `type` and triggers
  the matching ACS preset.

**Modified files**
- `package.json` — add `"acs-audio": "^<latest>"` to `dependencies`.
- `nuxt.config.js` — register the plugin
  (`{ src: '~/plugins/acs.client.js', mode: 'client' }`).
- `components/Dialog/MenuDialog/MenuDialog.component.vue` — three handlers
  (`toggleDarkTheme`, `toggleSoundFx`, `toggleWordblockKeyboard`) gain one
  `sfx.play(isChecked ? 'toggle-on' : 'toggle-off')` line. The two existing
  `Toast({ message, position: 'bottom' })` calls swap to
  `showToast.default(...)`.
- Other `Toast({ ... })` call sites across `components/`, `pages/`,
  `composables/` (~12 files) — migrate to `showToast.default(...)` (or
  `.success` / `.fail` where the surrounding code communicates outcome).
  Default migration is always safe and keeps current visual behavior.

## Sound palette (Soft & Tactile)

Master volume `0.6`. Set via `.acs` `:root { master-volume: 0.6; }`.

| UI element | ACS preset | Notes |
|---|---|---|
| `.van-button` (default) | `tap-tactile` | per-click |
| `.van-button--primary` / `--danger` / `--info` | `pop` | stronger CTA feel |
| `.van-button--disabled` | `denied` (vol 0.3) | optional, gives feedback for blocked clicks |
| `.van-cell.van-cell--clickable` / `[is-link]` | `tick` | menu rows, list items |
| `.van-tab` | `tick` | tab switch |
| `.van-dropdown-item` | `tick` | filter dropdown |
| `.van-switch` (any direction, baseline) | `tick` (vol 0.4) | overridden imperatively below |
| `input`, `textarea` (keydown) | `tick` (vol 0.3) | every keystroke |
| `input`, `textarea` (focus) | `tick` (vol 0.2) | softer cue on focus |
| `.van-dialog` appear / disappear | `modal-open` / `modal-close` | covers most overlay dialogs |
| `.van-popup--bottom` / `--top` / `--left` / `--right` | `drawer-open` / `drawer-close` | sheet-style overlays |
| `.van-toast` appear (default) | `notify` (vol 0.5) | fallback for legacy/un-migrated toasts |
| **Imperative — Switch ON** | `toggle-on` | from MenuDialog handlers |
| **Imperative — Switch OFF** | `toggle-off` | from MenuDialog handlers |
| **Imperative — `showToast.success`** | `success` | overrides .acs `.van-toast` |
| **Imperative — `showToast.fail`/`.error`** | `error` | overrides .acs |
| **Imperative — `showToast.info`** | `notify` | overrides .acs |
| **Imperative — `showToast.default`** | `notify` (vol 0.5) | matches .acs |

## Vuex / mute coupling

`plugins/acs.client.js` reads `store.getters['app/isActiveSoundFx']` on
mount and calls `window.ACS.setEnabled(value)`. It then registers
`store.watch(...)` to keep them in sync. No new state, no new mutations.
The MenuDialog switch already commits `SET_IS_ACTIVE_SOUND_FX` — that
single source of truth now mutes both Howler (existing) and ACS (new).

## Accessibility

`@media (prefers-reduced-sound: reduce) { :root { master-volume: 0; } }`
inside `parolla.acs`. Independent of the user toggle — when both the OS
preference is "reduce" and the toggle is on, master volume is still 0
because ACS multiplies stylesheet `master-volume` into per-sound output
gain.

## Non-goals

- Replacing the in-game `.wav` sounds in `useGameScene.js`.
- Adding new UI to control per-channel volume (the existing single
  on/off switch is sufficient for v1).
- Migrating every legacy `Toast({...})` call to the typed variants in
  one pass — default migration is the only required step; typed
  variants are opportunistic and can ship per call site.

## Risks & open questions

- **ACS event-name fidelity.** The docs show both `sound-on-click` /
  `sound-on-appear` and pseudo-selector `:on-focus` forms. The exact
  property name for "keystroke" (`sound-on-keydown` vs
  `sound-on-keypress`) needs verification at implementation time via the
  npm package's actual emitted event table. Mitigation: implementation
  step verifies live and adjusts the `.acs` file before completion.
- **Vant `Switch` direction.** Class-mutation triggers aren't a
  documented ACS feature, so direction (`toggle-on` vs `toggle-off`)
  is handled imperatively in the three MenuDialog handlers rather than
  in `.acs`. A baseline `.van-switch { sound-on-click: tick }` rule is
  kept as a neutral fallback for any Switch elsewhere in the app.
- **Toast variant detection from `.acs`.** Many existing `Toast({...})`
  calls don't pass a `type`, so DOM classes won't disambiguate
  success/fail. Hence the `showToast` wrapper exists.
- **First-load gesture gating.** Browsers may suspend the AudioContext
  until a user gesture. ACS handles this internally; no extra code
  expected. If issues appear, the plugin can attach a one-shot
  `pointerdown` listener that calls `ACS.audioContext.resume()`.

## Testing

Manual verification only (the project has no test runner). Smoke test
checklist:
1. MenuDialog opens → `modal-open` plays. Close → `modal-close`.
2. Toggle the "Ses efektleri" switch ON: hear `toggle-on`. OFF:
   `toggle-off`. While OFF, click any button → silence (both Howler
   game sounds and ACS UI sounds).
3. Click a Cell row → `tick`.
4. Press keys in a text input → `tick` per keystroke at low volume.
5. Call a success toast (e.g., copy link in MenuDialog after migration)
   → hear `success`; fail-path toasts → `error`.
6. Open Avatar dialog / Contact dialog / Auth dialog → `modal-open` and
   `modal-close` on dismiss.
7. Set OS to reduced-sound; reload → no audible UI sounds even with
   toggle ON.

No automated tests are added — consistent with project convention.
