# Base44 Dev Environment

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d
```

- **Frontend (Next.js 16 dev):** http://localhost:3000 (host port 3000)
- **Backend (FastAPI/uvicorn):** internal only — proxied through Next.js rewrites at `/api/*`
- **PostgreSQL 16:** internal only

## Services

| Service  | Image            | Notes |
|----------|------------------|-------|
| db       | postgres:16      | DB `banking_advisor`, user `postgres`, password `base44dev` |
| backend  | python:3.11-slim | Installs deps + seeds banks + runs uvicorn --reload on port 8000 |
| web      | node:22          | `npm install && npm run dev` (Turbopack) on port 3000 |

## Architecture notes

- **Single-origin wiring:** the frontend proxies `/api/*` to the backend via `next.config.js` rewrites (`BACKEND_URL` env var, defaults to `http://backend:8000`). JWT auth uses Bearer tokens in localStorage, so no cookie/session same-origin concerns.
- **Next.js dev origins:** `allowedDevOrigins` is derived from `BASE44_PUBLIC_HOST_SUFFIX` so the preview proxy origin is allowed.
- **DB tables** are auto-created via SQLAlchemy `Base.metadata.create_all` on startup (no Alembic migrations needed).
- **Seed data** runs on every backend start: `python -m seed_data.seed_banks`.

## Secrets

- `GROQ_API_KEY` — Groq API key for the LLM agents. Get one at https://console.groq.com/keys. Delivered via `/run/base44/app.env`.
- Other env vars (JWT secret, DB URL, CORS origins) are set inline in compose or via `.env.base44-defaults`.

## Fixes applied for Base44

1. Added `email-validator` to `backend/requirements.txt` (`pydantic[email]`) — the auth schemas use `EmailStr`.
2. Updated `frontend/next.config.js` — `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX`, and rewrite destination from `BACKEND_URL` env var so it resolves to the backend container.
