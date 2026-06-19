# Dwellio Backend

Spring Boot API for the Dwellio multi-tenant platform.

**Production deployment:** see [DEPLOYMENT.md](../DEPLOYMENT.md) (Render + Supabase).

## Requirements

- Java 21
- Maven 3.9+
- PostgreSQL 14+

## Configuration

Environment is split across three files (all gitignored except `.env.example`):

| File | Purpose |
|------|---------|
| `backend/.env` | Shared secrets: `JWT_SECRET`, Cloudinary, VAPID, `PORT` |
| `backend/.env.local` | Local dev: Postgres + `SPRING_PROFILES_ACTIVE=local` |
| `backend/.env.production` | Supabase pooler + `SPRING_PROFILES_ACTIVE=production` |

Copy `backend/.env.example` and create the profile files above. **Do not** set `SPRING_PROFILES_ACTIVE` in shared `.env` — it belongs in the profile file or your shell/hosting env.

### Local development

```powershell
cd backend
# Uses .env + .env.local automatically
mvn spring-boot:run
```

`backend/.env.local`:

```bash
SPRING_PROFILES_ACTIVE=local
DATABASE_URL=jdbc:postgresql://localhost:5432/dwellio
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<your-local-password>
SEED_DEMO_DATA=true
```

Create the database once: `createdb dwellio` (or via pgAdmin).

### Production (Supabase session pooler)

Set `SPRING_PROFILES_ACTIVE=production` in `backend/.env.production`. You can paste the **full** URI from Supabase (password `@` → `%40`):

```bash
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres
```

Or split host and credentials:

```bash
DATABASE_URL=jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres.<project-ref>
DATABASE_PASSWORD=<supabase-database-password>
DATABASE_SCHEMA=dwellio
JWT_SECRET=<same-as-backend-.env>
SEED_DEMO_DATA=false
CORS_ALLOWED_ORIGINS=https://your-domain.com
APP_PUBLIC_URL=https://your-domain.com
```

`DATABASE_SCHEMA=dwellio` creates an isolated Postgres schema when `public` already contains other tables (common on reused Supabase projects). Flyway runs all migrations inside that schema.

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE='production'
mvn spring-boot:run
```

**Common Supabase mistakes (verified failures):**

| Problem | Symptom | Fix |
|---------|---------|-----|
| Missing `jdbc:` prefix | `Driver claims to not accept jdbcUrl` | Use `jdbc:postgresql://...` |
| Supabase URI pasted as-is | Same error | App auto-normalizes `postgresql://` → `jdbc:postgresql://` |
| Username `dwellio` | Auth / tenant errors | Use `postgres` (direct) or `postgres.<ref>` (pooler) |
| Direct `db.*.supabase.co` on IPv4 networks | `UnknownHostException` | Use the **pooler** host (IPv4) from dashboard |
| Wrong pooler region | `tenant/user postgres.<ref> not found` | Copy the pooler host from your dashboard — region must match |
| Non-empty `public` schema | `Found non-empty schema(s) "public" but no schema history table` | Set `DATABASE_SCHEMA=dwellio` in `.env.production` |
| Bad Flyway baseline on fresh DB | `subscription_plans does not exist` | Drop `flyway_schema_history` or use `DATABASE_SCHEMA=dwellio` |
| Credentials embedded in URL | Conflicts with USERNAME/PASSWORD vars | URI parser extracts both; split vars also work |
| Windows `DATABASE_*` env vars | Wrong DB despite `.env` | Remove User Environment Variables that override `.env` |

**URL normalization:** `DatabaseEnvironmentPostProcessor` adds `jdbc:` and `sslmode=require` for Supabase hosts automatically.

**Manual region probe** (if pooler host is unknown):

```bash
mvn test -Dtest=SupabaseConnectionDiagnostic#probePoolerRegions \
  -Djunit.jupiter.conditions.deactivate=org.junit.*DisabledCondition
```

(Run with `DATABASE_PASSWORD` set in the environment.)

## Run

```bash
cd backend
mvn spring-boot:run
```

Health check: `GET http://localhost:8081/api/v1/health`

## Auth API (Phase 2)

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | JWT |
| GET | `/auth/me` | JWT |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |

Password reset tokens are logged server-side in V1 (email delivery deferred to V2).

## Organizations & RBAC API (Phase 3)

All org-scoped routes require JWT. Authorization uses membership-only RBAC: `User → Membership → Role → role_permissions → Permission`. OWNER bypasses permission checks via `is_owner_role` (no rows in `role_permissions`).

**Error semantics**

| Situation | HTTP |
|-----------|------|
| Organization does not exist | 404 |
| Organization exists, no ACTIVE membership | 403 |
| Organization exists, insufficient permission | 403 |

**Organization context** — routes accept `organizationId` (UUID) or `slug` (via `/by-slug/{slug}`). Slug resolves to `organizationId` through `TenantContext`.

### Organizations

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/organizations` | Any authenticated user (creates org + OWNER membership) |
| GET | `/organizations/{organizationId}` | `organization:read` |
| GET | `/organizations/by-slug/{slug}` | `organization:read` |
| PATCH | `/organizations/{organizationId}` | `organization:update` |
| PATCH | `/organizations/by-slug/{slug}` | `organization:update` |

### Roles

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/roles` | `role:manage` |
| POST | `/organizations/{organizationId}/roles` | `role:manage` |
| PUT | `/organizations/{organizationId}/roles/{roleId}` | `role:manage` |
| DELETE | `/organizations/{organizationId}/roles/{roleId}` | `role:manage` |

System roles (OWNER, RESIDENT) are immutable. OWNER has wildcard `*` in responses; RESIDENT permissions are seeded on org creation.

### Memberships (current user)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/users/me/memberships` | JWT |
| GET | `/users/me/memberships/by-slug/{slug}` | JWT |

### Memberships & Staff

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/memberships` | `resident:read` |
| POST | `/organizations/{organizationId}/staff/invite` | `staff:manage` |

Staff invite (V1): existing user by email → ACTIVE membership immediately; unknown email → `staff_invitations` PENDING record (fulfillment deferred).

### Join Requests

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/organizations/{organizationId}/join-requests` | Any authenticated user |
| GET | `/organizations/{organizationId}/join-requests` | `resident:approve` |
| POST | `/organizations/{organizationId}/join-requests/{id}/approve` | `resident:approve` |
| POST | `/organizations/{organizationId}/join-requests/{id}/reject` | `resident:approve` |
| POST | `/organizations/{organizationId}/join-requests/{id}/cancel` | Requester only |

Approval creates ACTIVE membership with RESIDENT role (no PENDING memberships).

### Marketplace (public)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/marketplace/organizations` | Public — search verified orgs (`city`, `type`, `q`) |
| GET | `/marketplace/organizations/{slug}` | Public (VERIFIED orgs only) |
| GET | `/marketplace/organizations/{slug}/reviews` | Public (VERIFIED orgs only) |

## Accommodation API (Phase 4)

Unified spatial hierarchy: **Building → Floor → Space (ROOM|UNIT) → Bed**. Mode is driven by `accommodation_mode`:

| Org types | Mode | Spaces | Allocation target |
|-----------|------|--------|-------------------|
| HOSTEL, PG, CO_LIVING | `BED_BASED` | `ROOM` | Bed |
| GATED_COMMUNITY | `UNIT_BASED` | `UNIT` | Unit (no beds) |

**Rules**

- Beds only under `ROOM` spaces; bed CRUD rejected for `UNIT_BASED` orgs.
- Room `capacity` stays aligned with active bed count.
- `is_blocked` takes precedence over status enums for allocatability.
- Allocation is a separate step after ACTIVE membership (join approval or staff invite).
- At most one current occupancy per membership, bed, and unit.

### Buildings & Structure

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET/POST | `/organizations/{organizationId}/buildings` | `building:manage` |
| GET/PATCH/DELETE | `/organizations/{organizationId}/buildings/{buildingId}` | `building:manage` |
| GET/POST | `/organizations/{organizationId}/buildings/{buildingId}/floors` | `building:manage` |
| GET/PATCH/DELETE | `/organizations/{organizationId}/floors/{floorId}` | `building:manage` |
| GET/POST | `/organizations/{organizationId}/floors/{floorId}/spaces` | `building:manage` |
| GET/PATCH/DELETE | `/organizations/{organizationId}/spaces/{spaceId}` | `building:manage` |
| GET/POST | `/organizations/{organizationId}/spaces/{spaceId}/beds` | `building:manage` (BED_BASED only) |
| PATCH/DELETE | `/organizations/{organizationId}/beds/{bedId}` | `building:manage` (BED_BASED only) |

### Occupancies

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/occupancies` | `resident:manage` |
| POST | `/organizations/{organizationId}/occupancies/allocate` | `resident:manage` |
| POST | `/organizations/{organizationId}/occupancies/transfer` | `resident:manage` |
| POST | `/organizations/{organizationId}/occupancies/{occupancyId}/release` | `resident:manage` |

**Allocate body (BED_BASED):** `{ membershipId, bedId, moveInDate }`  
**Allocate body (UNIT_BASED):** `{ membershipId, unitSpaceId, moveInDate }`  
**Transfer body (BED_BASED):** `{ membershipId, targetBedId, transferDate }`  
**Transfer body (UNIT_BASED):** `{ membershipId, targetUnitSpaceId, transferDate }`

Transfer closes the current occupancy, creates a new one, updates statuses atomically, and emits a single `OccupancyTransferredEvent`.

### Visualization

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/accommodation/visualization` | `building:manage` |

Returns the full building tree with space/bed statuses and current occupant summaries.

## Metrics Cache API (Phase 5)

Event-driven projection into `organization_metrics_cache`. Refreshes run **asynchronously after commit**; source tables remain authoritative.

| Trigger | Projection updated |
|---------|-------------------|
| Occupancy allocate/release/transfer | Availability |
| Structure change (building/floor/space/bed) | Availability |
| Join request approved (RESIDENT membership) | `active_resident_count` |

**Query budget per refresh:** 2–3 native aggregate queries + 1 cache upsert (O(1) per org).

### Dashboard & Rebuild

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/dashboard` | `dashboard:view` |
| POST | `/organizations/{organizationId}/metrics/rebuild` | `building:manage` |

Rebuild re-aggregates availability and resident count from source tables (idempotent).

### Marketplace metrics

`GET /marketplace/organizations/{slug}` now includes a `metrics` object (availability, ratings, service metrics fields, `refreshedAt`). Falls back to inline rebuild if cache row is missing.

**Resident count:** ACTIVE memberships with `roles.name = 'RESIDENT'` (future: consider system role flag).

## Operations API (Phase 6)

Complaints, announcements, assets, and reviews with async metrics projection for service-quality fields.

### Complaints

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/organizations/{organizationId}/complaints` | `complaint:create` |
| GET | `/organizations/{organizationId}/complaints` | `complaint:read` |
| GET | `/organizations/{organizationId}/complaints/mine` | `complaint:read_own` |
| GET | `/organizations/{organizationId}/complaints/{complaintId}` | membership + row access |
| PATCH | `/organizations/{organizationId}/complaints/{complaintId}` | `complaint:manage` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/assign` | `complaint:assign` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/start` | `complaint:manage` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/resolve` | `complaint:manage` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/close` | `complaint:manage` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/reopen` | `complaint:manage` |
| POST | `/organizations/{organizationId}/complaints/{complaintId}/attachments` | creator (open) or `complaint:manage` |
| DELETE | `/organizations/{organizationId}/complaints/{complaintId}` | `complaint:manage` |

**Status flow:** `OPEN` → `IN_PROGRESS` / `RESOLVED` (shortcut) → `CLOSED`; `RESOLVED`/`CLOSED` → `REOPENED` for recurring issues.

**SLA fields:** `assigned_at`, `first_response_at` (set on assign/start/resolve). Optional `asset_id` links complaint to org asset.

**Categories (enum V1):** `WIFI`, `FOOD`, `HOUSEKEEPING`, `MAINTENANCE`, `ELECTRICITY`, `PLUMBING`, `SECURITY`, `NOISE`, `PAYMENT`, `OTHER`. Required on create. List endpoints accept optional `?category=` filter.

**Dashboard:** `complaintCategoryDistribution` on `GET /organizations/{id}/dashboard` — counts grouped by category (refreshed with complaint metrics).

### Announcements

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/organizations/{organizationId}/announcements` | `announcement:manage` |
| GET | `/organizations/{organizationId}/announcements` | `announcement:read` / `read_own` |
| GET | `/organizations/{organizationId}/announcements/{id}` | membership + visibility |
| PATCH | `/organizations/{organizationId}/announcements/{id}` | `announcement:manage` |
| POST | `/organizations/{organizationId}/announcements/{id}/publish` | `announcement:manage` |
| DELETE | `/organizations/{organizationId}/announcements/{id}` | `announcement:manage` |

Published announcements remain editable; `updated_at` is preserved via JPA auditing.

### Assets

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/organizations/{organizationId}/assets` | `asset:read` |
| POST | `/organizations/{organizationId}/assets` | `asset:manage` |
| PATCH | `/organizations/{organizationId}/assets/{assetId}` | `asset:manage` |
| DELETE | `/organizations/{organizationId}/assets/{assetId}` | `asset:manage` |

### Reviews

| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/organizations/{organizationId}/reviews` | `review:create` |
| GET | `/organizations/{organizationId}/reviews` | `review:read` |
| GET | `/organizations/{organizationId}/reviews/mine` | `review:update_own` |
| PUT | `/organizations/{organizationId}/reviews/mine` | `review:update_own` |
| POST | `/organizations/{organizationId}/reviews/{reviewId}/reports` | active membership |

**Rules:** One review per membership; minimum **7 days** active membership before create; updates change both rating and body.

### Phase 6 metrics

`MetricsAggregateRepository` now projects:

- `open_complaint_count` — `OPEN`, `IN_PROGRESS`, `REOPENED`
- `avg_resolution_days` — from `resolved_at - created_at`
- `resolution_rate` — resolved/closed vs total
- `avg_first_response_hours` — from `first_response_at - created_at`
- `avg_rating`, `review_count` — from reviews

Refreshed asynchronously on complaint/review changes via `ComplaintMetricsChangedEvent` / `ReviewMetricsChangedEvent`. Full rebuild via `POST /organizations/{id}/metrics/rebuild`.

## Notifications API (Phase 7)

Persistent PostgreSQL notifications with Spring WebSocket + STOMP delivery after commit.

### REST

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/notifications` | JWT (paginated, default `size=20`) |
| GET | `/notifications/unread-count` | JWT |
| PATCH | `/notifications/{id}/read` | JWT |
| PATCH | `/notifications/read-all` | JWT |

**Query params:** `page`, `size`, `unreadOnly`, `organizationId`

### WebSocket

| Setting | Value |
|---------|-------|
| Endpoint | `/ws` (full URL: `ws://host:8081/api/v1/ws`) |
| Auth | `Authorization: Bearer {token}` on STOMP CONNECT, or `?token=` on handshake |
| User queue | `/user/queue/notifications` |
| Org topic | `/topic/org/{orgId}/announcements` |

### Notification types

`JOIN_REQUEST_APPROVED`, `JOIN_REQUEST_REJECTED`, `COMPLAINT_CREATED`, `COMPLAINT_ASSIGNED`, `COMPLAINT_RESOLVED`, `COMPLAINT_REOPENED`, `ANNOUNCEMENT_PUBLISHED`, `OCCUPANCY_ALLOCATED`, `OCCUPANCY_TRANSFERRED`, `REVIEW_REPORTED`, `SYSTEM`

Schema keeps `body` and `status` (`UNREAD`/`READ`); references stored in `payload_json`.

## Database

Flyway migrations run automatically on startup:

- `V1__initial_schema.sql` — full approved schema
- `V2__seed_reference_data.sql` — FREE/PRO/ENTERPRISE plans, permissions, amenities
- `V3__staff_invitations.sql` — pending staff invitations for unregistered emails
- `V4__occupancy_membership_unique.sql` — one current occupancy per membership
- `V5__phase6_operations.sql` — complaint `asset_id`, SLA timestamps, `REOPENED` status, `avg_first_response_hours`
- `V6__complaint_categories.sql` — expanded enum categories, `complaint_category_counts` JSON on metrics cache
- `V7__notifications_phase7.sql` — `payload_json`, notification type constraint, indexes

All new organizations default to the **FREE** plan (`SystemConstants.FREE_PLAN_ID`).

## Project Structure

```text
src/main/java/com/dwellio/
├── auth/            # authentication, JWT, password reset (Phase 2)
├── common/          # security (authz, tenant), exceptions, config
├── domain/
│   ├── enums/       # all domain enums
│   └── entity/      # JPA entities (Phase 1)
├── organization/    # org CRUD, metrics cache seeding (Phase 3)
├── role/            # role CRUD, permissions (Phase 3)
├── membership/      # memberships, staff invite (Phase 3)
├── joinrequest/     # resident join flow (Phase 3)
├── marketplace/     # public org profiles (Phase 3)
├── accommodation/   # guard, status projection, events, visualization (Phase 4)
├── building/        # building CRUD (Phase 4)
├── floor/           # floor CRUD (Phase 4)
├── space/           # room/unit CRUD (Phase 4)
├── bed/             # bed CRUD, BED_BASED only (Phase 4)
├── occupancy/       # allocate, transfer, release (Phase 4)
├── metrics/         # cache projection, events, dashboard (Phase 5)
├── complaint/       # complaints workflow, attachments (Phase 6)
├── announcement/    # announcements (Phase 6)
├── asset/           # asset registry (Phase 6)
├── review/          # reviews and reports (Phase 6)
├── operations/      # shared operations guard (Phase 6)
├── notification/    # inbox, WebSocket/STOMP delivery (Phase 7)
└── DwellioApplication.java
```
