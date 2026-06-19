# Dwellio — Deployment Guide (Render + Supabase)

Deploy the **backend** and **frontend** as separate Render Web Services. Database is **Supabase PostgreSQL** (external).

## Architecture

| Service | Render name | Tech |
|---------|-------------|------|
| API | `dwellio-api` | Docker / Java 21 / Spring Boot |
| Web | `dwellio-web` | Node 20 / Next.js |
| Database | — | Supabase (session pooler) |

---

## 1. Supabase (database)

1. Create a Supabase project.
2. Copy **Session pooler** URI from Project Settings → Database → Connection pooling.
3. Format: `postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres`
4. Encode `@` in password as `%40`.

Flyway runs in the **`dwellio`** schema (`DATABASE_SCHEMA=dwellio`).

---

## 2. Backend on Render

### Option A — Blueprint (recommended)

1. Push repo to GitHub.
2. Render → **New** → **Blueprint** → connect repo (`render.yaml` at root).
3. Fill secret env vars when prompted (see table below).

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Runtime | **Docker** |
| Root directory | *(repo root)* |
| Dockerfile path | `backend/Dockerfile` |
| Docker context | `backend` |
| Health check path | `/api/v1/health` |

**Build / start:** handled by Dockerfile.

### Backend environment variables

Set these in Render (no `.env` files needed on the server):

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `SPRING_PROFILES_ACTIVE` | Yes | `production` |
| `DATABASE_URL` | Yes | Full Supabase pooler URI |
| `DATABASE_SCHEMA` | Yes | `dwellio` |
| `JWT_SECRET` | Yes | 32+ char random string |
| `JWT_ACCESS_TOKEN_EXPIRATION` | No | `PT15M` |
| `JWT_REFRESH_TOKEN_EXPIRATION` | No | `P30D` |
| `CLOUDINARY_URL` | If uploads | `cloudinary://...` |
| `VAPID_PUBLIC_KEY` | If push | |
| `VAPID_PRIVATE_KEY` | If push | |
| `VAPID_SUBJECT` | If push | `mailto:you@example.com` |
| `SEED_DEMO_DATA` | Yes | `false` |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://dwellio-web.onrender.com` |
| `APP_PUBLIC_URL` | Yes | Same as frontend URL |
| `PORT` | **No** | Render sets automatically |

**Do not set** `PORT` manually — Render injects it.

Verify after deploy:

```text
GET https://<your-api>.onrender.com/api/v1/health
→ {"status":"UP","service":"dwellio-api"}
```

---

## 3. Frontend on Render

| Setting | Value |
|---------|--------|
| Runtime | **Node** |
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Node version | `20` |

### Frontend environment variables

> `NEXT_PUBLIC_*` vars must be set **before** the build runs on Render.

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://dwellio-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://dwellio-api.onrender.com/api/v1/ws` |
| `NEXT_PUBLIC_SITE_URL` | `https://dwellio-web.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps key |

After the frontend URL is known, update backend `CORS_ALLOWED_ORIGINS` and `APP_PUBLIC_URL` to match, then redeploy the API.

---

## 4. Local vs production env files

| File | Use |
|------|-----|
| `backend/.env` | Local shared secrets (JWT, Cloudinary, VAPID) |
| `backend/.env.local` | Local dev only — **never deploy** |
| `backend/.env.production` | Local production testing — **or use Render env vars** |
| `frontend/.env.local` | Local dev only — **never deploy** |

Templates: `backend/.env.example`, `frontend/.env.example`.

---

## 5. Local production smoke test

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE='production'
mvn spring-boot:run
```

```powershell
cd frontend
# set NEXT_PUBLIC_* to point at local or deployed API
npm run dev
```

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Driver claims to not accept jdbcUrl, postgresql://...` | Use full URI; app normalizes on startup |
| CORS errors in browser | Set `CORS_ALLOWED_ORIGINS` to exact frontend URL (no trailing slash) |
| Flyway fails on non-empty `public` schema | Keep `DATABASE_SCHEMA=dwellio` |
| Frontend calls localhost API | Rebuild frontend after fixing `NEXT_PUBLIC_API_URL` |
| WebSocket fails | Use `wss://` (not `ws://`) in production |

---

## 7. Security checklist

- [ ] Never commit `.env`, `.env.local`, `.env.production`
- [ ] Use strong `JWT_SECRET` in production
- [ ] Restrict Google Maps API key to your domains
- [ ] Set `SEED_DEMO_DATA=false` in production
