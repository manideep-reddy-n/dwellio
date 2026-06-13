# Integration Fixes — Pre–Phase 5

This document records root causes, fixes, seed data, and verification steps for the integration stabilization pass.

---

## 1. Authentication Persistence

### Root causes

| Issue | Cause |
|-------|--------|
| Logged out after refresh | Access token expires in **15 minutes** (`PT15M`). `isAuthenticated()` only checked `expiresAt`, so UI showed “logged out” until refresh completed—or permanently if refresh never ran. |
| Race on startup | API queries (memberships, notifications) fired **before** Zustand hydration + refresh finished, causing **401** cascades and session clears. |
| Stale `useAuth` state | `useAuth()` called `isAuthenticated()` via a store function selector that did **not** subscribe to `accessToken` / `expiresAt` changes. |
| Cookie / store drift | No proactive refresh before expiry; middleware relied on cookies while client state could be expired. |
| 401 handler incomplete | Failed refresh cleared Zustand but not always cookies/localStorage consistently. |

### Fixes

- **`sessionReady` flag** in auth store (not persisted) — app waits for hydration + `restoreSession()` before protected UI/API.
- **`lib/auth/restore-session.ts`** — central restore + refresh + proactive schedule (1 min before expiry).
- **Zustand `partialize`** — only persist `user`, `accessToken`, `expiresAt` (not ephemeral flags).
- **`AuthGate`** on `/app/*` — blocks shell until session is ready; redirects only when no refresh token.
- **`AuthRedirect`** on `/login` & `/register` — waits for `sessionReady` before redirecting authed users.
- **`configureAuthFailure`** — on unrecoverable 401, clears cookies + localStorage and redirects to login.
- **STOMP** connects only when `sessionReady` and token valid.

### Storage model (unchanged, now used correctly)

| Asset | Location | Purpose |
|-------|----------|---------|
| Access token | Zustand persist + `dwellio_token` cookie | API calls + middleware hint |
| Refresh token | `localStorage` (`dwellio_refresh_token`) | Silent refresh |
| Session flag | `dwellio_session` cookie (7 days) | Middleware gate for `/app` |

---

## 2. Route Protection & Redirects

### Root causes

- Middleware protected `/app/*` but client could render authenticated UI with expired tokens.
- Auth pages redirected before session restore completed (false negatives).

### Fixes

- Middleware unchanged: `/app` + `/admin` require session cookie; `/login` + `/register` redirect to `/app` when cookie present.
- Client **`AuthGate`** + **`AuthRedirect`** align with restored session state.
- Full navigation after login/register (`window.location.assign`) preserved so middleware sees new cookies.

---

## 3. Membership / Role Resolution

### Root causes

- Membership queries ran before auth ready → empty/error state after refresh.
- Persisted `activeOrg` could be stale vs server permissions after reload.
- Org switcher always routed to Live Ops (wrong for residents).

### Fixes

- **`useAuthReady()`** gates all membership, resident, and notification queries.
- **`OrgContextBootstrap`** reconciles persisted org with `GET /users/me/memberships` after auth.
- **`OrgSlugBootstrap`** still resolves org from URL slug (unchanged).
- **Org switcher** routes owners/staff → Live Ops; residents → Resident home.
- Owner permissions: empty array + `ownerRole: true` (backend contract); frontend `hasPermission` / `canAccessOperations` treat owners as full access.

---

## 4. Development Seed Data

### Implementation

- **`com.dwellio.dev.DevDemoDataSeeder`** — runs on `ApplicationReadyEvent` when `dwellio.dev.seed-demo-data=true` (default in `application.yml`, disabled in test profile).
- **Idempotent**: skips if `owner@example.com` exists.

### Demo users (password: `Password123!`)

| Email | Role |
|-------|------|
| `platform-admin@example.com` | Platform admin |
| `owner@example.com` | Owner of both demo orgs |
| `staff@example.com` | Operations staff (Sunrise Hostel) |
| `resident@example.com` | Resident (Sunrise Hostel) |

### Organizations

| Slug | Type | Status |
|------|------|--------|
| `sunrise-hostel` | HOSTEL (bed-based) | VERIFIED |
| `green-valley-residences` | GATED_COMMUNITY (unit-based) | VERIFIED |

### Seeded data

- **Accommodation**: Block A / rooms / beds; resident allocated to Bed A; gated community units.
- **Complaints**: OPEN, IN_PROGRESS, RESOLVED, REOPENED.
- **Announcements**: 3 published notices.
- **Review**: 4★ resident review (membership backdated 14 days).
- **Notifications**: 3 unread-style events for resident.
- **Marketplace**: photos (Unsplash URLs), amenities, metrics cache rebuilt.
- **Staff role**: “Operations Manager” with dashboard + complaints + announcements permissions.

### Seeding order (fixed)

1. **Users** — platform admin, owner, staff, resident (`resident@example.com` is notification recipient)
2. **Organizations** — hostel + gated community (VERIFIED)
3. **Marketplace extras** — photos, amenities
4. **Memberships** — staff role + resident membership
5. **Accommodation** — buildings, beds, occupancies
6. **Operations** — complaints, announcements, review
7. **Metrics rebuild** — trust score data
8. **Commit** (via `TransactionTemplate`)
9. **Notifications** — after commit only (`NotificationService.create` uses `REQUIRES_NEW`)

**Note:** Notifications must not run inside the same outer transaction as user creation — `REQUIRES_NEW` cannot see uncommitted users.

### Idempotency marker

Uses `sunrise-hostel` org slug (not owner email). If org exists but notifications are missing, backfills notifications only.

---

## 5. Integration Audit Summary

| Area | Status |
|------|--------|
| Register / Login / Logout | Fixed persistence + cookie sync |
| Refresh token flow | Proactive + on-401 + on startup |
| Explore / marketplace profiles | Seed provides VERIFIED orgs + metrics |
| Resident dashboard / complaints / announcements / reviews | Gated on `authReady`; demo data populated |
| Notifications bell + inbox | Gated on `authReady`; store sync preserved |
| Real-time STOMP | Waits for `sessionReady` |
| Owner / Staff / Resident permissions | Org bootstrap + switcher routing |

---

## 6. Verification Checklist

- [ ] Fresh DB: start backend → logs show “Demo data ready”
- [ ] Login `resident@example.com` / `Password123!` → `/app` loads without flash to login
- [ ] Hard refresh on `/app/sunrise-hostel/resident` → still authenticated
- [ ] Navigate `/app` → `/app/notifications` → `/app/organizations` without logout
- [ ] Wait 15+ min (or shorten JWT in dev) → next API call refreshes silently
- [ ] While logged in, visit `/login` → redirect to `/app`
- [ ] Logout → `/app` redirects to `/login`
- [ ] Resident sees complaints, announcements, bed allocation, notifications
- [ ] Owner sees Live Ops route from org switcher
- [ ] Staff sees operations permissions (not owner bypass)
- [ ] `/explore` lists Sunrise Hostel + Green Valley

---

## 7. Manual Testing Steps

### Reset demo database (optional)

```bash
# Drop and recreate PostgreSQL database, then:
cd backend
mvn spring-boot:run
```

### Resident flow

1. Open http://localhost:3000/login
2. Sign in: `resident@example.com` / `Password123!`
3. Go to **My organizations** → open **Sunrise Hostel**
4. Confirm **Resident home**: accommodation card (Bed A), complaint previews, announcements
5. Open **Complaints** — 4 complaints in mixed statuses
6. Open **Notifications** (`/app/notifications`) — mark one read; bell count decreases
7. Hard refresh (F5) — still logged in, data intact

### Owner flow

1. Login `owner@example.com` / `Password123!`
2. Org switcher → Sunrise Hostel → Live Operations
3. Operations placeholders accessible via command palette

### Staff flow

1. Login `staff@example.com` / `Password123!`
2. Org switcher → operations routes (not resident-only)

### Marketplace

1. Log out or use incognito
2. Visit `/explore` — both VERIFIED properties appear
3. Open `/sunrise-hostel` — profile + trust metrics

### Auth edge cases

1. Login → DevTools → Application → delete `dwellio_session` cookie only → refresh → session restored via refresh token
2. Delete all cookies + keep localStorage refresh → visit `/app` → middleware may send to login; after login once, refresh token restores on next successful login

---

## Files changed (high level)

**Frontend:** `auth-store`, `restore-session`, `session-bootstrap`, `auth-gate`, `use-auth`, `use-auth-ready`, `providers`, `client.ts`, `app/layout`, `org-context-bootstrap`, `org-switcher`, data hooks (memberships, notifications, complaints, …)

**Backend:** `DevDemoDataSeeder`, `application.yml`, `application-test.yml`
