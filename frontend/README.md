# Dwellio Frontend

Next.js App Router client for the Dwellio platform — fully integrated with Backend V1.

## Stack

- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui
- TanStack Query · Zustand · Framer Motion · STOMP.js

## Implementation status

| Phase | Status |
|-------|--------|
| 1. Foundation | ✅ |
| 2. Marketplace | ✅ |
| 3. App shell | ✅ |
| 4. Resident MVP | ✅ |
| 5. Operations MVP | ✅ |
| 6. Accommodation | ✅ |
| 7. Platform admin & polish | ✅ |

## Getting started

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Backend must be running at `http://localhost:8081/api/v1` with CORS enabled for `http://localhost:3000`.

Demo users (password `Password123!`): `platform-admin@dwellio.dev`, `owner@dwellio.dev`, `staff@dwellio.dev`, `resident@example.com`

## Environment

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8081/api/v1/ws` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — (required for maps) |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | `DEMO_MAP_ID` (optional; use your own Map ID in production) |

Maps use the **Google Maps JavaScript API** and **Places API**. In [Google Cloud Console](https://console.cloud.google.com/), enable both APIs and restrict the key to your site origin (e.g. `http://localhost:3000/*`).

## Routes

### Marketplace & auth

| Route | Purpose |
|-------|---------|
| `/` | Marketplace home |
| `/explore` | Browse verified organizations |
| `/[slug]` | Public organization profile |
| `/[slug]/join` | Join request flow |
| `/login` · `/register` | Authentication |

### App shell

| Route | Purpose |
|-------|---------|
| `/app` | Authenticated hub |
| `/app/organizations` | Switch organizations |
| `/app/organizations/new` | Create organization |
| `/app/profile` | Account |
| `/app/notifications` | Notification inbox |

### Operations (staff / owner)

| Route | Purpose |
|-------|---------|
| `/app/[orgSlug]/operations` | Metrics dashboard |
| `/app/[orgSlug]/operations/live` | **Live Operations Center** |
| `/app/[orgSlug]/operations/complaints` | Kanban complaint workflow |
| `/app/[orgSlug]/operations/join-requests` | Approve / reject joins |
| `/app/[orgSlug]/operations/residents` | Resident memberships |
| `/app/[orgSlug]/operations/announcements` | Create, publish, delete |
| `/app/[orgSlug]/operations/accommodation` | 2D floor plan + structure CRUD |
| `/app/[orgSlug]/operations/assets` | Asset management |
| `/app/[orgSlug]/operations/reviews` | Review moderation |
| `/app/[orgSlug]/operations/staff` | Staff invite + roles |
| `/app/[orgSlug]/operations/settings` | Organization settings |

### Resident

| Route | Purpose |
|-------|---------|
| `/app/[orgSlug]/resident` | Resident home |
| `/app/[orgSlug]/resident/complaints` | My complaints |
| `/app/[orgSlug]/resident/announcements` | Announcements feed |
| `/app/[orgSlug]/resident/review` | Review management |

### Platform admin

| Route | Purpose |
|-------|---------|
| `/admin` | Admin hub (platform admins only) |
| `/admin/overview` | Marketplace + health summary |
| `/admin/organizations` | Browse all marketplace orgs |
| `/admin/health` | API health check |

## Real-time architecture

1. STOMP connects on login to `/user/queue/notifications`
2. Org context subscribes to `/topic/org/{orgId}/announcements`
3. Incoming events invalidate TanStack Query keys via `lib/websocket/invalidation-router.ts`
4. Optimistic updates on complaints, join requests, announcements, occupancies
5. Sonner toasts surface events without page refresh

## API integration

All organization-scoped REST endpoints from Backend V1 are wired:

- Auth, users, organizations, marketplace
- Dashboard metrics, complaints (full workflow), join requests
- Memberships, staff invite, roles CRUD
- Announcements CRUD + publish
- Assets CRUD
- Reviews list + report
- Accommodation visualization, buildings/floors/spaces/beds, occupancies allocate/transfer/release
- Notifications inbox
- Health check

## Known backend gaps (frontend documents honestly)

- No platform-admin REST API (users, plans, global moderation queues) — admin UI uses marketplace + `/health`
- No list-reported-reviews endpoint — ops reviews page shows all org reviews
- Payment and contact-management APIs not in V1

## Trust Score

Computed client-side from marketplace metrics — see `lib/marketplace/trust-score.ts`.
