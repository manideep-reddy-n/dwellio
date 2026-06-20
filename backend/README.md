# Dwellio Backend

Spring Boot API for the Dwellio multi-tenant platform.

**Database:** Supabase PostgreSQL only (schema `dwellio`). See [DEPLOYMENT.md](../DEPLOYMENT.md).

## Requirements

- Java 21
- Maven 3.9+
- Supabase project (session pooler connection string)

No local PostgreSQL installation required.

## Quick start

```powershell
cd backend
copy .env.example .env
# Set DATABASE_URL (Supabase pooler URI) and JWT_SECRET in .env
mvn spring-boot:run
```

Health: `GET http://localhost:8081/api/v1/health`

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase session pooler URI (`postgresql://...` or `jdbc:postgresql://...`) |
| `DATABASE_SCHEMA` | `dwellio` (default) |
| `JWT_SECRET` | 32+ character secret |
| `SEED_DEMO_DATA` | `true` to seed demo orgs locally |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s), comma-separated |
| `APP_PUBLIC_URL` | Public frontend URL |

**URL normalization:** `DatabaseConfigNormalizer` adds `jdbc:` prefix, `sslmode=require`, and extracts embedded credentials from Supabase URIs.

## Supabase notes

| Problem | Fix |
|---------|-----|
| Missing `jdbc:` prefix | Paste full `postgresql://` URI — auto-normalized |
| Tables not visible in dashboard | Look in schema **`dwellio`**, not `public` |
| Wrong pooler region | Copy host from Supabase dashboard exactly |

## Run tests

```powershell
mvn test
```

Integration tests use in-memory H2 (schema `public`); runtime uses Supabase (schema `dwellio`).
