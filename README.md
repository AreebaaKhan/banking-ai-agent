# 🏦 AI Banking Advisor

> A multi-agent AI system that helps Pakistani banking customers find the right accounts, loans, credit cards, and investment products. Built with FastAPI, Next.js, PostgreSQL, Groq (primary LLM) and Google Gemini (fallback LLM).

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Groq](https://img.shields.io/badge/LLM-Groq-orange)](https://groq.com)
[![Gemini](https://img.shields.io/badge/Fallback-Gemini-purple)](https://aistudio.google.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [What to Download (Prerequisites)](#what-to-download-prerequisites)
- [Setting Up on a New Laptop (Windows)](#setting-up-on-a-new-laptop-windows)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Overview

**AI Banking Advisor** is a full-stack application for Pakistani banking customers. A triage agent reads the user's question and sends it to the right specialist agent (Loan, Card, Account, and so on). Conversations are stored in PostgreSQL and answers stream in real time using Server-Sent Events (SSE).

The LLM layer uses **Groq** as the primary provider. If Groq fails or is unavailable, the app falls back to **Google Gemini**. Two model sizes are configured: a bigger model for answers and a smaller one for triage (routing).

This project demonstrates:
- Clean backend architecture (service layer, repository pattern)
- Real-time AI streaming with SSE
- JWT authentication with access and refresh tokens
- Multi-agent orchestration with intent detection
- Dark themed UI with a glassmorphism design

---

## Features

- 🤖 **7 specialized AI agents**: Triage, Account, Loan, Card, Investment, Digital Banking, General Banking
- ⚡ **Real-time streaming** via Server-Sent Events
- 🔁 **LLM fallback**: Groq first, Gemini if Groq fails
- 🔒 **JWT auth** with access and refresh tokens
- 🇵🇰 **Pakistani banking data**: seeded with real banks, products, cards and loans
- 📊 **Analytics dashboard**
- 💬 **Conversation history**: saved, searchable, deletable
- 🌐 **English and Urdu** input toggle
- 📱 **Responsive** design

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│   Login → Chat → Sidebar → Dashboard → SSE Stream Client    │
└─────────────────────┬───────────────────────────────────────┘
                      │ /api/* is proxied to port 8000
                      │ (see next.config.js)
┌─────────────────────▼───────────────────────────────────────┐
│                  Backend (FastAPI)                           │
│  Auth API │ Chat API │ Banks API │ Analytics API             │
│                    │                                         │
│              Service Layer                                   │
│   AuthService │ ChatService │ BankService                   │
│                    │                                         │
│           Multi-Agent Orchestrator                           │
│  Triage Agent → [Account | Loan | Card | Investment |        │
│                   Digital | General] Advisor                 │
│                    │                                         │
│      Groq (primary)  ──fails──▶  Gemini (fallback)          │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQLAlchemy (async)
┌─────────────────────▼───────────────────────────────────────┐
│                PostgreSQL Database                           │
│  users │ sessions │ conversations │ messages │               │
│  banks │ products │ cards │ loans │ recommendations          │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
banking-ai-agent/
├── README.md
├── .gitignore
│
├── backend/                    ← FastAPI backend
│   ├── requirements.txt
│   ├── .env.example            ← copy this to .env
│   ├── alembic.ini
│   ├── alembic/                ← migrations
│   ├── app/
│   │   ├── main.py             ← app startup
│   │   ├── config.py           ← settings (reads .env)
│   │   ├── database.py         ← async SQLAlchemy engine
│   │   ├── models/             ← ORM models
│   │   ├── schemas/            ← Pydantic schemas
│   │   ├── api/                ← route handlers
│   │   ├── services/           ← business logic
│   │   ├── agents/             ← multi-agent AI system
│   │   ├── middleware/         ← JWT auth
│   │   └── utils/
│   └── seed_data/
│       └── seed_banks.py       ← fills DB with bank data
│
└── frontend/                   ← Next.js frontend
    ├── package.json
    ├── next.config.js          ← proxies /api/* to the backend
    ├── lib/                    ← api client, auth, toast
    └── app/                    ← pages (login, signup, chat, dashboard)
```

---

## What to Download (Prerequisites)

Install these first. Download links are the official pages.

| Tool | Version | Download |
|------|---------|----------|
| Git | Any recent | https://git-scm.com/downloads |
| Python | 3.11 or newer | https://www.python.org/downloads/ |
| Node.js (includes npm) | 20.9 or newer (LTS recommended) | https://nodejs.org/ |
| PostgreSQL (includes pgAdmin 4) | 16 | https://www.postgresql.org/download/windows/ |
| VS Code (optional) | Latest | https://code.visualstudio.com/ |

You also need API keys (both free):

| Key | Where to get it |
|-----|-----------------|
| Groq API key | https://console.groq.com/keys |
| Gemini API key | https://aistudio.google.com/apikey |

**Important notes while installing:**
- **Python:** tick **"Add python.exe to PATH"** on the first installer screen.
- **PostgreSQL:** keep the default install folder (`C:\Program Files\PostgreSQL\16`), port `5432`, and keep **PostgreSQL Server, pgAdmin 4 and Command Line Tools** ticked. Untick Stack Builder (If you can otherwise its fine). **Write down the `postgres` password.** You need it for `.env`.

---

## Setting Up on a New Laptop (Windows)

Run all commands in PowerShell.

### Step 1: Clone the project

```powershell
cd D:\Projects
git clone https://github.com/AreebaaKhan/banking-ai-agent.git
cd banking-ai-agent
```

### Step 2: Check PostgreSQL is running

```powershell
Get-Service *postgres*
```

You should see `postgresql-x64-16` with status `Running`.

### Step 3: Create the database

Open **pgAdmin 4**, connect to the server with your `postgres` password, then right click **Databases → Create → Database** and name it `banking_advisor`.

Or from the command line:

```powershell
psql -U postgres -c "CREATE DATABASE banking_advisor;"
```

### Step 4: Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```

If PowerShell blocks the activate script, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Create your `.env` file:

```powershell
copy .env.example .env
```

Open `backend\.env` and fill in your database password and both API keys. See [Environment Variables](#environment-variables).

<!-- Ignore bcz; The application creates tables automatically during development startup. Alembic migrations are recommended for production.
 
Seed the bank data:

```powershell
python -m seed_data.seed_banks
```

If your tables do not exist yet, run the migrations first:

```powershell
alembic upgrade head
``` -->

### Step 5: Frontend setup

Open a **second** PowerShell window:

```powershell
cd "YOUR_PROJECT_FOLDER\banking-ai-agent"
npm install
```

No `.env.local` is needed. `next.config.js` already forwards every `/api/*` request to `http://localhost:8000`. So, do not create `.env.local` for local development unless you intentionally want to override the API URL.

Notes about `npm install`:
- The `sharp install-scripts` warning is safe to ignore.
- Do **not** run `npm audit fix --force`. It can break package versions.

---

## Environment Variables

### Backend (`backend/.env`)

This file is **never committed to git**. Keep a private backup (password manager or private cloud folder).

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/banking_advisor` |
| `JWT_SECRET_KEY` | Long random string used to sign tokens | any random string, 32+ characters |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `GROQ_API_KEY` | Groq key (primary LLM) | `gsk_...` |
| `GROQ_MODEL` | Main answer model | `openai/gpt-oss-120b` |
| `GROQ_TRIAGE_MODEL` | Smaller model for routing | `openai/gpt-oss-20b` |
| `GEMINI_API_KEY` | Gemini key (fallback LLM) | `AI...` |
| `GEMINI_MODEL` | Gemini answer model | `gemini-3.6-flash` |
| `GEMINI_TRIAGE_MODEL` | Gemini routing model | `gemini-3.6-flash` |
| `APP_NAME` | App name | `AI Banking Advisor` |
| `APP_ENV` | Environment | `development` |
| `CORS_ORIGINS` | Allowed frontend origin | `http://localhost:3000` |

**Database options:**
- **Local (development):** `postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/banking_advisor`
- **Neon (cloud, for deployment):** `postgresql+asyncpg://USER:PASSWORD@HOST/neondb?ssl=require`

Only keep one `DATABASE_URL` active in `.env`.

### Frontend

`NEXT_PUBLIC_API_URL` is optional. If it is not set, the frontend uses the `/api` proxy from `next.config.js`. Set it only if you host the backend on a different URL, for example in production.

---

## Running the Application

Two terminals must run at the same time.

**Terminal 1: Backend**

```powershell
cd "YOUR_PROJECT_FOLDER\banking-ai-agent"\backend
.\venv\Scripts\Activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

# Terminal 2
cd "YOUR_PROJECT_FOLDER\backend"
.\venv\Scripts\Activate
python -m seed_data.seed_banks

# Terminal 3
cd "YOUR_PROJECT_FOLDER\frontend"
npm run dev

- Frontend: http://localhost:3000

Open http://localhost:3000, create an account and start chatting.


---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `winget install PostgreSQL` gives 403 | Use a VPN and download the installer from postgresql.org in the browser |
| `Get-Service *postgres*` shows nothing | PostgreSQL did not install fully. Delete the leftover folder and rerun the installer |
| pgAdmin shows `No module named 'pgadmin'` | pgAdmin install is incomplete. Reinstall PostgreSQL with a clean folder |
| Backend cannot connect to database | Check the password and database name in `DATABASE_URL`, and that the service is `Running` |
| Frontend loads but chat fails | Make sure the backend is running on port 8000 |
| `activate` script is blocked | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| AI replies fail | Check `GROQ_API_KEY` and `GEMINI_API_KEY` in `.env` |

---

## API Endpoints

All endpoints start with `/api`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and get tokens |
| `POST` | `/api/auth/refresh` | Refresh an access token |
| `POST` | `/api/auth/logout` | Logout (revoke refresh token) |
| `GET` | `/api/auth/me` | Current user profile |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/conversations` | List conversations |
| `GET` | `/api/chat/conversations/{id}` | Get a conversation with messages |
| `DELETE` | `/api/chat/conversations/{id}` | Delete a conversation |
| `POST` | `/api/chat/send` | Send a message (SSE streaming) |

### Banks and Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/banks` | List banks (with filters) |
| `GET` | `/api/analytics` | Dashboard data |
| `GET` | `/api/health` | Health check |

---

## Deployment

Planned free deployment:
- **Neon**: serverless PostgreSQL
- **Render**: FastAPI backend
- **Vercel**: Next.js frontend

For production, set `APP_ENV=production`, use a Neon `DATABASE_URL`, set `CORS_ORIGINS` to your Vercel URL, and set `NEXT_PUBLIC_API_URL` to your Render URL. Also update the proxy destination in `next.config.js`, because it currently points to `localhost:8000`.

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Async web framework |
| SQLAlchemy 2.0 | Async ORM |
| PostgreSQL + asyncpg | Database and driver |
| Alembic | Migrations |
| PyJWT | JWT handling |
| Bcrypt | Password hashing |
| Groq API | Primary LLM (gpt-oss models) |
| Google Gemini API | Fallback LLM |
| Pydantic v2 | Validation and settings |
| Uvicorn | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | React framework |
| CSS Modules | Styling |
| Server-Sent Events | Streaming AI replies |
| React Markdown | Render AI answers |
| Recharts | Dashboard charts |

---

## Security Notes

- Never commit `.env`. Make sure `.gitignore` contains `.env` and `.env.local`.
- Never paste real API keys or database URLs in chats, screenshots or commits. If a key leaks, regenerate it.

---

## License

MIT License.