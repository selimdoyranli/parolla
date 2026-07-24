# Users by-username endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the DoS-prone `GET /api/users` collection find disabled while restoring every legitimate profile lookup in the web app via scoped single-row endpoints.

**Architecture:** Add one public, IP-rate-limited Strapi endpoint `GET /api/users/by-username/:username` (a mirror of the existing custom `findOne`, keyed on the indexed `username` column). Migrate the web's single `fetchPlayer` consumer to route id-lookups to `GET /api/users/:id` and username-lookups to the new endpoint, and switch `/hesap/edit` to `auth/fetchMe`.

**Tech Stack:** Strapi 5 (TypeScript, users-permissions plugin extension); Nuxt 2 / Vue 2 (JavaScript, Vuex, `$appFetch` Axios wrapper).

## Global Constraints

- Two separate repos/worktrees: backend `parolla-strapi`, frontend `parolla`. No shared build.
- **No test runner exists** in either repo. Verification = typecheck + lint + targeted runtime checks. Do NOT introduce a test framework.
- Backend code style: no semicolons, single quotes, trailing commas (es5), 100-char width. Conventional commits (commitlint husky hook).
- Frontend code style: no semicolons, trailing commas, arrow parens as-needed, max line 150. Conventional commits.
- The new endpoint's response shape MUST match the existing custom `findOne`: sanitized user + `diceBear`, `profilePhoto`, `role`, `tourScore`. **Never** include `email` on the public by-username endpoint.
- `plugin.controllers.user.find` MUST remain `ctx.notFound()`. Do not re-enable it.
- Commit only within each repo; do not attempt cross-repo commits.

---

### Task 1: Backend — `by-username` endpoint + `find` comment + permission hardening

**Repo:** `parolla-strapi`

**Files:**
- Modify: `src/extensions/users-permissions/strapi-server.ts` (add controller near the existing `findOne` at ~line 124; add route in the `unshift` block near ~line 705; reword the `find` comment at ~line 111)
- Modify: `config/sync/user-role.public.json` (remove the `plugin::users-permissions.user.find` permission entry)
- Modify: `config/sync/user-role.authenticated.json` (remove the `plugin::users-permissions.user.find` permission entry)

**Interfaces:**
- Produces: `GET /api/users/by-username/:username` → `200` single object `{ ...sanitizedUser, diceBear, profilePhoto, role, tourScore }` (no `email`); `404` when username is missing/unknown. Public (`auth: false`), IP-rate-limited.
- Consumes: existing `getTourScoreDetails(id)` (already imported at top of `strapi-server.ts`) and `sanitizeUserForResponse(user, { includeEmail })` (already imported).

- [ ] **Step 1: Add the `findByUsername` controller**

Immediately after the existing `plugin.controllers.user.findOne` block (~line 150), add:

```ts
  // by-username controller — public single-user lookup for /profil/:username.
  // Mirrors findOne but keyed on the indexed `username` column. Single-row
  // query (no unbounded scan, unlike the disabled collection find). Public,
  // so email is never exposed here — own-profile editing uses /users/me.
  plugin.controllers.user.findByUsername = async (ctx) => {
    const { username } = ctx.params

    if (!username) {
      return ctx.notFound()
    }

    const fetched = await strapi.query('plugin::users-permissions.user').findOne({
      populate: ['diceBear', 'profilePhoto', 'role'],
      where: { username },
    })

    if (!fetched) {
      return ctx.notFound()
    }

    const tourScoreDetails = await getTourScoreDetails(fetched.id)

    ctx.body = {
      ...sanitizeUserForResponse(fetched, { includeEmail: false }),
      tourScore: tourScoreDetails,
    }
  }
```

- [ ] **Step 2: Register the public route**

In the `plugin.routes['content-api'].routes.unshift({...})` block near the end of the file (before `return plugin`), add:

```ts
  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/users/by-username/:username',
    handler: 'user.findByUsername',
    config: {
      prefix: '',
      auth: false,
      middlewares: [
        {
          name: 'global::rate-limit-route',
          config: { limit: 300, interval: '1h', keyType: 'ip' },
        },
      ],
    },
  })
```

- [ ] **Step 3: Reword the `find` disable comment**

The comment above `plugin.controllers.user.find` currently says "No client uses it: individual lookups go through GET /api/users/:id (findOne) and GET /api/users/me, both untouched." Reword the relevant sentence to reflect the added endpoint, e.g.:

```ts
  // GET /api/users (collection find) is DISABLED. The default plugin action
  // returns EVERY user row — relations populated, no enforced pagination or
  // filter — so a single call runs an unbounded query that spikes CPU and
  // takes the VPS down. Single-user lookups go through GET /api/users/:id
  // (findOne), GET /api/users/by-username/:username, and GET /api/users/me —
  // all single-row queries. We hard-refuse the collection find at the
  // controller so the unbounded query never runs, regardless of role config,
  // and 404 keeps it effectively hidden.
```

Leave the body `return ctx.notFound()` unchanged.

- [ ] **Step 4: Remove the `find` permission from the Public role config-sync**

In `config/sync/user-role.public.json`, delete the object whose `action` is
`"plugin::users-permissions.user.find"` (the `{ documentId, action, locale }` entry).
Keep `user.findOne` and `user.count`. Ensure the surrounding JSON array stays valid
(comma handling).

- [ ] **Step 5: Remove the `find` permission from the Authenticated role config-sync**

Do the same in `config/sync/user-role.authenticated.json`: delete the
`"plugin::users-permissions.user.find"` entry, keep `findOne` / `me` / `count`.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors). If `findByUsername` triggers a plugin-type error, it is a
pre-existing pattern issue — the existing `findOne`/`me` custom controllers are assigned
the same way, so it should type-check identically.

- [ ] **Step 7: Lint**

Run: `pnpm lint`
Expected: PASS. Fix any style issues (semicolons/quotes) the linter reports on the new code.

- [ ] **Step 8: Runtime check (only if a dev stack is available)**

If Strapi can be started (`pnpm dev` with a DB + env), verify:
```bash
# existing username → 200, has diceBear/tourScore, NO email
curl -s "http://localhost:1337/api/users/by-username/<known-username>" | head -c 400
# unknown username → 404
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:1337/api/users/by-username/__nope__"
# collection find still disabled → 404
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:1337/api/users"
```
If no dev stack is available, record this as "not run — requires running Strapi + DB" and rely on typecheck/lint.

- [ ] **Step 9: Commit**

```bash
git add src/extensions/users-permissions/strapi-server.ts config/sync/user-role.public.json config/sync/user-role.authenticated.json
git commit -m "feat(users): add public GET /users/by-username/:username; drop find permission"
```

---

### Task 2: Frontend — migrate `fetchPlayer` and `/hesap/edit`

**Repo:** `parolla`

**Files:**
- Modify: `store/profile/actions.js:45-63` (`fetchPlayer` action)
- Modify: `pages/Account/AccountEdit/index.vue:31-35` (`useFetch` body)

**Interfaces:**
- Consumes: `GET /api/users/:id` (existing findOne) and `GET /api/users/by-username/:username` (Task 1) — both return a single user object (not an array).
- Produces: `profile/fetchPlayer({ id?, username? })` unchanged signature; commits `SET_PLAYER` with a single object; returns `{ data, error }` where `data` is the object.

- [ ] **Step 1: Rewrite `fetchPlayer` to branch on id/username**

Replace the `fetchPlayer` action body in `store/profile/actions.js` with:

```js
  async fetchPlayer({ commit }, { id, username }) {
    const path = id ? `users/${id}` : `users/by-username/${encodeURIComponent(username)}`

    const { data, error } = await this.$appFetch({ path })

    if (data) {
      commit('SET_PLAYER', data)
    }

    return {
      data,
      error
    }
  },
```

(Removes the old `path: 'users'` + `filters[id|username]` + `populate` query. Both endpoints
populate diceBear/profilePhoto/role server-side. `data` is now a single object, not `data[0]`.)

- [ ] **Step 2: Switch `/hesap/edit` to refresh `me`**

In `pages/Account/AccountEdit/index.vue`, replace the `useFetch` body:

```js
    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('auth/fetchMe')
    })
```

(Removes the dead `fetchPlayer({ username: me.value.username })` dispatch — `ProfileEditForm`
reads `auth/user`, not `profile/player`. The `me` computed may become unused; remove it if
ESLint flags `no-unused-vars`, otherwise leave it.)

- [ ] **Step 3: Confirm no stale collection-find references remain**

Run: `grep -rn "path: 'users'\|path: \`users\`\|filters\[username\]\|filters\[id\]\[\$eq\]" store components pages | grep -v node_modules`
Expected: no hit that targets the users collection find (the `profile/actions.js` line is now gone).

- [ ] **Step 4: ESLint**

Run: `yarn lint:eslint`
Expected: PASS. Fix any reported issues (e.g. unused `me` computed in AccountEdit) with `yarn lint:eslint:fix` or manually.

- [ ] **Step 5: Runtime check (only if a dev stack is available)**

If `yarn dev` + a reachable backend are available, verify manually:
- Open a `/profil/<username>` page → profile loads (network shows `GET /api/users/by-username/<username>`).
- Click a player avatar / scoreboard row → PlayerDialog loads (network shows `GET /api/users/<id>`).
- Open `/hesap/edit` while logged in → edit form is populated (network shows `GET /api/users/me`).
If no dev stack is available, record "not run — requires running web + backend" and rely on ESLint + the grep check.

- [ ] **Step 6: Commit**

```bash
git add store/profile/actions.js pages/Account/AccountEdit/index.vue
git commit -m "refactor(profile): fetch players via /users/:id and /users/by-username; edit page uses /users/me"
```

---

## Self-Review

**Spec coverage:**
- by-username endpoint (controller + route) → Task 1 Steps 1-2. ✓
- `find` stays 404 + comment reword → Task 1 Step 3. ✓
- config-sync permission hardening → Task 1 Steps 4-5. ✓
- `fetchPlayer` migration (id + username) → Task 2 Step 1. ✓
- AccountEdit → `me` → Task 2 Step 2. ✓
- Acceptance criteria (typecheck/lint/runtime) → Task 1 Steps 6-8, Task 2 Steps 4-5. ✓
- Out-of-scope `updateAvatar` → intentionally untouched. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are concrete. Runtime steps are explicitly conditional on a dev stack, with a defined fallback (record + rely on static gates). ✓

**Type consistency:** `findByUsername` return shape matches `findOne` and matches what `fetchPlayer` consumes (single object). `SET_PLAYER` receives an object in both id and username paths. ✓
