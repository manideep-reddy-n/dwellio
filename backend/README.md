# Dwellio Backend

Spring Boot API for the Dwellio multi-tenant platform.

## Requirements

- Java 21
- Maven 3.9+
- PostgreSQL 14+

## Configuration

Set environment variables (or use defaults for local dev):

```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/dwellio
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
PORT=8081
```

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
| GET | `/marketplace/organizations/{slug}` | Public (VERIFIED orgs only) |

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

## Database

Flyway migrations run automatically on startup:

- `V1__initial_schema.sql` — full approved schema
- `V2__seed_reference_data.sql` — FREE/PRO/ENTERPRISE plans, permissions, amenities
- `V3__staff_invitations.sql` — pending staff invitations for unregistered emails
- `V4__occupancy_membership_unique.sql` — one current occupancy per membership

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
└── DwellioApplication.java
```
