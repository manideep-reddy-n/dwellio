# Dwellio — Deployment (Render + Supabase)

Dwellio uses **one database**: Supabase PostgreSQL in the **`dwellio`** schema. Local development and production both connect to Supabase via environment variables.

## Architecture

| Component | Hosting | Database |
|-----------|---------|----------|
| API | Render Docker (`dwellio-api`) | Supabase |
| Web | Render Node (`dwellio-web`) | — |
| Data | Supabase session pooler | schema `dwellio` |

---

## 1. Supabase setup

1. Create a Supabase project.
2. Copy the **Session pooler** URI (Project Settings → Database → Connection pooling).
3. Format: `postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres`
4. Encode `@` in passwords as `%40`.

Flyway creates and migrates the **`dwellio`** schema on first startup.

---

## 2. Local development

### Backend

```powershell
cd backend
copy .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, integrations
mvn spring-boot:run
```

Health: `GET http://localhost:8081/api/v1/health`

### Frontend

```powershell
cd frontend
copy .env.example .env.local
npm run dev
```

Set `SEED_DEMO_DATA=true` in `backend/.env` to load demo orgs on first run (optional).

---

## 3. Render deployment

### Backend (`dwellio-api`)

| Setting | Value |
|---------|--------|
| Runtime | Docker |
| Dockerfile | `backend/Dockerfile` |
| Health check | `/api/v1/health` |

**Environment variables:**

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Supabase pooler URI |
| `DATABASE_SCHEMA` | `dwellio` |
| `JWT_SECRET` | Yes |
| `SEED_DEMO_DATA` | `false` |
| `CORS_ALLOWED_ORIGINS` | Frontend URL |
| `APP_PUBLIC_URL` | Frontend URL |
| `CLOUDINARY_URL`, `VAPID_*` | If using those features |

Do **not** set `PORT` — Render injects it.

### Frontend (`dwellio-web`)

| Setting | Value |
|---------|--------|
| Root | `frontend` |
| Build | `npm ci && npm run build` |
| Start | `npm start` |

Set `NEXT_PUBLIC_*` variables **before** build:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://dwellio-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://dwellio-api.onrender.com/api/v1/ws` |
| `NEXT_PUBLIC_SITE_URL` | `https://dwellio-web.onrender.com` |

Or use the root **`render.yaml`** Blueprint.

---

## 4. Verify Supabase data

In Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'dwellio' ORDER BY 1;

SELECT email, full_name FROM dwellio.users ORDER BY created_at DESC LIMIT 5;
```

Tables live in schema **`dwellio`**, not `public`.

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Driver claims to not accept jdbcUrl, postgresql://...` | App auto-normalizes URI on startup |
| Empty Supabase / no users | Confirm backend logs show `Database schema: dwellio` and Supabase host |
| CORS errors | Set `CORS_ALLOWED_ORIGINS` to exact frontend URL |
| Frontend hits localhost API | Rebuild frontend after fixing `NEXT_PUBLIC_API_URL` |
| 500 on payments | Check API logs; billing sync errors no longer block listing |

---

## 6. Security

- Never commit `backend/.env` or `frontend/.env.local`
- Use `SEED_DEMO_DATA=false` in production
- Restrict Google Maps API key to your domains
