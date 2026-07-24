# Design: Replace public `GET /api/users` (collection find) with a scoped by-username lookup

**Date:** 2026-07-24
**Repos affected:** `parolla-strapi` (backend), `parolla` (web frontend)
**Status:** Approved (Approach A)

## Problem

The Strapi users-permissions plugin's collection `find` action (`GET /api/users`) is
public and applies **no enforced pagination** — the plugin's `find` bypasses
`config/api.ts` `maxLimit: 100`. A single unfiltered/unpaginated call returns **every
user row (~50k)** with relations populated, which spikes CPU and takes the VPS down.

A prior change hard-disabled it: `plugin.controllers.user.find` now returns
`ctx.notFound()`. That stops the DoS but **breaks the one legitimate web consumer**:
`store/profile/actions.js#fetchPlayer()`, which called
`GET /api/users?filters[id|username][$eq]=…&populate=diceBear,profilePhoto` and read
`data[0]`.

The `find → 404` change is **not yet deployed**, so there is no live breakage window —
backend and web can ship together.

## Verified impact (single root break, three entry points)

`fetchPlayer()` is the **only** web call to the disabled endpoint. Its three call sites:

| Call site | Args | Correct replacement | Already exists? |
|---|---|---|---|
| `components/Dialog/PlayerDialog/PlayerDialog.component.vue:71` | `{ id }` | `GET /api/users/:id` (custom `findOne`) | ✅ yes — public, returns diceBear/profilePhoto/role + tourScore |
| `pages/Profile/_username.vue:53` | `{ username }` | `GET /api/users/by-username/:username` (**new**) | ❌ must add |
| `pages/Account/AccountEdit/index.vue:33` | `{ username: me.username }` | `GET /api/users/me` / `auth/fetchMe` | ✅ yes |

Confirmed **not** affected (do not touch):
- `profile/fetchPlayerStats` → `rooms` / `room-scores` / `room-reviews`.
- `profile/updateAvatar` → `PUT /api/users/:id` (plugin `update`, not `find`).
- `store/auth/actions.js` → `/users/me`, `/users/me/profile-photo`.
- `tour/fetchTourScoreOfUser` → `tour-scores/tour-score-of-user` (resolves username server-side; independent).
- `ProfileEditForm` already reads `auth/user` (i.e. `me`), **not** `profile/player`; the
  `fetchPlayer` dispatch in `AccountEdit` is effectively dead.

## Design

### 1. Backend — `parolla-strapi`

**File:** `src/extensions/users-permissions/strapi-server.ts`

**a) New controller `user.findByUsername`** — a mirror of the existing custom `findOne`,
keyed on the (indexed) `username` column instead of `id`. Single-row query. Public
endpoint, so **never** includes email (own-profile edit goes through `/users/me`).

```ts
plugin.controllers.user.findByUsername = async (ctx) => {
  const { username } = ctx.params

  if (!username) {
    return ctx.notFound()
  }

  // Single indexed lookup — no unbounded scan (unlike the disabled collection find).
  const fetched = await strapi.query('plugin::users-permissions.user').findOne({
    populate: ['diceBear', 'profilePhoto', 'role'],
    where: { username },
  })

  if (!fetched) {
    return ctx.notFound()
  }

  const tourScoreDetails = await getTourScoreDetails(fetched.id)

  // Public endpoint: email is never exposed here (own-profile editing uses /users/me).
  ctx.body = {
    ...sanitizeUserForResponse(fetched, { includeEmail: false }),
    tourScore: tourScoreDetails,
  }
}
```

Parity note: like the existing `findOne`, this does **not** filter out `isDeleted` users,
so id- and username-based public lookups behave identically. (Hiding soft-deleted
profiles, if desired, is a separate follow-up applied to both.)

**b) Register the route** (public, IP rate-limited), alongside the other custom
`unshift` routes near the end of the file:

```ts
plugin.routes['content-api'].routes.unshift({
  method: 'GET',
  path: '/users/by-username/:username',
  handler: 'user.findByUsername',
  config: {
    prefix: '',
    auth: false,
    middlewares: [
      { name: 'global::rate-limit-route', config: { limit: 300, interval: '1h', keyType: 'ip' } },
    ],
  },
})
```

Path is two segments so it does not collide with `/users/:id` (findOne) or `/users/me`.
`auth: false` makes it public with no permission grant required (same pattern as
`src/api/music/routes/music.ts`), so it never appears as a role checkbox.

**c) `find` stays disabled.** Keep `plugin.controllers.user.find = async (ctx) => ctx.notFound()`.
Update its comment: the "No client uses it" line becomes true after this migration —
reword to reference `GET /api/users/:id` and `GET /api/users/by-username/:username` as
the supported single-user lookups.

**d) Config-sync permission hardening (defense-in-depth).** Remove the
`plugin::users-permissions.user.find` permission entry from:
- `config/sync/user-role.public.json`
- `config/sync/user-role.authenticated.json`

so the endpoint is off at the permission layer too, durably across deploys. (Requires a
`config-sync import` on deploy, or the equivalent manual uncheck — see Admin panel note.)
Leave `findOne` and `count` as-is. Do not remove `count` (cheap `SELECT COUNT`, no scan).

### 2. Frontend — `parolla`

**a) `store/profile/actions.js#fetchPlayer`** — keep the `{ id, username }` signature so
call sites are untouched; branch the path and consume a single object (not `data[0]`):

```js
async fetchPlayer({ commit }, { id, username }) {
  const path = id
    ? `users/${id}`
    : `users/by-username/${encodeURIComponent(username)}`

  const { data, error } = await this.$appFetch({ path })

  if (data) {
    commit('SET_PLAYER', data)
  }

  return { data, error }
}
```

Both endpoints always populate diceBear/profilePhoto/role server-side, so the old
`populate` / `filters` query params are dropped. A missing user now returns `404 → error`
(instead of an empty array); `pages/Profile/_username.vue` already handles this via
`playerError` / `playerData?.id`, and `PlayerDialog` via `playerError`.

**b) `pages/Account/AccountEdit/index.vue`** — replace the dead
`fetchPlayer({ username: me.username })` dispatch with a `me` refresh, since
`ProfileEditForm` reads `auth/user`:

```js
const { fetch, fetchState } = useFetch(async () => {
  await store.dispatch('auth/fetchMe')
})
```

**c) Out of scope:** `profile/updateAvatar` (`PUT /api/users/:id`) is unaffected by this
change. That it is publicly writable is a separate concern (move to `updateMe`) — noted,
not done here.

### 3. Rollout

No live breakage window (find → 404 not yet deployed):
1. Ship `parolla-strapi`: `find` = 404 (as-is) **+** new `by-username` route/controller
   **+** config-sync permission removal. Run `config-sync import` on deploy.
2. Ship `parolla`: new `fetchPlayer` + AccountEdit change.
3. **Deploy backend and frontend in the same window.** The `by-username` route is new on
   the backend, so a split deploy briefly breaks `/profil/:username` (old FE → 403/404 on
   the removed collection find; new FE → 404 until the route ships). This is a profile-view
   glitch, not a DoS, and self-heals once both land — but do not rely on "order doesn't
   matter" for the username path. (The id-path via `findOne` already exists, so PlayerDialog
   is safe either way.)

## Acceptance criteria

**Backend** (`pnpm typecheck` + `pnpm lint` pass):
- `GET /api/users/by-username/<existing-username>` → `200`, single sanitized user object
  with `diceBear`, `profilePhoto`, `role`, `tourScore`; **no `email`**.
- `GET /api/users/by-username/<nonexistent>` → `404`.
- `GET /api/users` → `403` for anonymous callers (the `find` permission is removed, so the
  users-permissions policy denies before the controller) / `404` at the controller if the
  permission were somehow granted — either way the unbounded query never runs.
  `GET /api/users/:id` → unchanged. `GET /api/users/me` → unchanged.
- Route is reachable unauthenticated; repeated calls beyond the IP limit → `429`.

**Frontend** (`yarn lint:eslint` passes):
- PlayerDialog (avatar/scoreboard click) loads the player via `GET /api/users/:id`.
- `/profil/:username` loads via `GET /api/users/by-username/:username`; unknown username → empty/error state, no crash.
- `/hesap/edit` loads the current user via `auth/fetchMe`; edit form is populated.
- No remaining reference to a collection `filters[username]` / `path: 'users'` find in the web codebase.

## Admin panel note (for the operator)

Because `by-username` uses `auth: false`, it needs **no** role checkbox. The only manual
action, if not relying on config-sync import, is:
**Settings → Roles → Public → Users-permissions → User → uncheck `find`.**
Repeat for the **Authenticated** role. Leave `findOne` and `count` checked. This mirrors
the config-sync JSON change and is belt-and-suspenders — the controller already returns
404 for `find` regardless of the permission.
