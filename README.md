# 🏦 AI Banking Advisor

> A production-grade, multi-agent AI system that helps Pakistani banking customers find the right accounts, loans, credit cards, and investment products — powered by Groq LLaMA 3.3, FastAPI, and Next.js.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Groq](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange)](https://groq.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)

---

## Overview

**AI Banking Advisor** is a full-stack SaaS application designed for Pakistani banking customers. It uses a **multi-agent AI architecture** where a triage agent intelligently routes user questions to the correct specialist agent (Loan Advisor, Card Advisor, Account Advisor, etc.). All conversations are stored in a PostgreSQL database, and responses stream in real-time using **Server-Sent Events (SSE)**.

This project demonstrates:
- Production-grade Python backend architecture (Clean Architecture, Service Layer, Repository pattern)
- Real-time AI streaming with SSE
- JWT authentication with access + refresh token flow
- Multi-agent AI orchestration with intent detection
- Premium dark-themed UI with glassmorphism design

---

## Features

- 🤖 **7 Specialized AI Agents** — Triage, Account Advisor, Loan Advisor, Card Advisor, Investment Advisor, Digital Banking Expert, General Banking Advisor
- ⚡ **Real-Time Streaming** — AI responses stream word-by-word via Server-Sent Events
- 🔒 **Secure JWT Auth** — Access + Refresh token system with automatic rotation
- 🇵🇰 **Pakistani Banking Data** — Seeded with 12+ real banks, products, cards, and loans
- 📊 **Analytics Dashboard** — Visual stats on conversations, messages, popular banks
- 💬 **Conversation History** — All chats saved, searchable, and deletable
- 📱 **Fully Responsive** — Mobile-first design that works on all screen sizes
- 🌙 **Premium Dark Theme** — Glassmorphism UI with smooth animations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│   Login → Chat → Sidebar → Dashboard → SSE Stream Client    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / SSE
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
│            Groq API (LLaMA 3.3-70B)                         │
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
Antigravity-Project/
├── README.md                   ← You are here
├── WALKTHROUGH.md              ← Technical deep-dive of the codebase
├── DEPLOYMENT.md               ← Full free deployment guide
├── .gitignore
│
├── backend/                    ← FastAPI Python backend
│   ├── requirements.txt        ← Python dependencies
│   ├── .env.example            ← Environment variable template
│   ├── runtime.txt             ← Python version (for Render)
│   ├── alembic.ini             ← Database migration config
│   ├── alembic/                ← Migration scripts
│   ├── app/
│   │   ├── main.py             ← App factory & startup
│   │   ├── config.py           ← Settings (Pydantic)
│   │   ├── database.py         ← Async SQLAlchemy engine
│   │   ├── models/             ← ORM models (11 tables)
│   │   ├── schemas/            ← Pydantic request/response models
│   │   ├── api/                ← Route handlers (auth, chat, banks)
│   │   ├── services/           ← Business logic layer
│   │   ├── agents/             ← Multi-agent AI system
│   │   │   ├── orchestrator.py ← Main agent runner (Groq streaming)
│   │   │   ├── prompts.py      ← System prompts for each agent
│   │   │   └── tools.py        ← Database tools for agents
│   │   ├── middleware/         ← JWT auth middleware
│   │   └── utils/              ← Logger & helpers
│   └── seed_data/
│       └── seed_banks.py       ← Populate DB with Pakistani bank data
│
└── frontend/                   ← Next.js frontend
    ├── package.json            ← Node dependencies
    ├── next.config.js          ← API proxy config
    ├── jsconfig.json           ← Path alias (@/)
    ├── .env.local.example      ← Frontend env template
    ├── lib/
    │   ├── api.js              ← Centralized API client (SSE + auth)
    │   ├── auth.js             ← Auth context & React hook
    │   └── toast.js            ← Toast notification system
    └── app/
        ├── layout.js           ← Root layout
        ├── page.js             ← Landing page (redirects)
        ├── globals.css         ← Design system & CSS variables
        ├── login/              ← Login page
        ├── signup/             ← Signup page
        ├── chat/               ← Chat interface (layout + pages)
        └── dashboard/          ← Analytics dashboard
```

---

## Prerequisites

Before starting, make sure you have these installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/download/) |
| Git | Any | [git-scm.com](https://git-scm.com/) |

You will also need a **free Groq API key** from [console.groq.com/keys](https://console.groq.com/keys).

---

## Installation & Setup

### 1. Backend Setup

Open a terminal and run these commands in order:

```bash
# Navigate to the backend folder
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate it (Windows PowerShell)
.\venv\Scripts\Activate

# Activate it (Mac/Linux)
# source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt
```

**Create and configure your `.env` file:**

```bash
# Copy the template
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
```

Open the `.env` file and fill in your values (see [Environment Variables](#environment-variables) below).

**Set up the database:**

First, create the PostgreSQL database:
```sql
-- Run in psql or pgAdmin
CREATE DATABASE banking_advisor;
```

Then, seed it with Pakistani banking data:
```bash
python -m seed_data.seed_banks
```

---

### 2. Frontend Setup

Open a **second terminal** and run:

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
npm install react-markdown remark-gfm recharts lucide-react

# Copy the environment template
copy .env.local.example .env.local        # Windows
# cp .env.local.example .env.local        # Mac/Linux
```

---

## Running the Application

You need **two terminals running simultaneously**.

**Terminal 1 — Backend:**
```bash
cd backend
.\venv\Scripts\Activate                             # Activate venv
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
→ Backend runs at: `http://localhost:8000`
→ API docs at: `http://localhost:8000/docs`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
→ Frontend runs at: `http://localhost:3000`

Open `http://localhost:3000` in your browser. Create an account and start chatting!

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:password@localhost:5432/banking_advisor` |
| `JWT_SECRET_KEY` | Long random string for signing JWTs | `my-super-secret-key-abc123` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | How long access tokens last | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | How long refresh tokens last | `7` |
| `GROQ_API_KEY` | Your Groq API key | `gsk_...` |
| `GROQ_MODEL` | Groq model to use | `llama-3.3-70b-versatile` |
| `APP_ENV` | Application environment | `development` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend server URL | `http://localhost:8000` |

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and get tokens |
| `POST` | `/api/auth/refresh` | Refresh an access token |
| `POST` | `/api/auth/logout` | Logout (revoke refresh token) |
| `GET` | `/api/auth/me` | Get current user profile |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/conversations` | List user conversations |
| `GET` | `/api/chat/conversations/{id}` | Get conversation + messages |
| `DELETE` | `/api/chat/conversations/{id}` | Delete a conversation |
| `POST` | `/api/chat/send` | Send message (SSE streaming) |

### Banks & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/banks` | List all banks (with filters) |
| `GET` | `/api/analytics` | Dashboard analytics data |
| `GET` | `/api/health` | Health check |

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a complete, step-by-step guide to deploy this project for **free** using:
- **Neon.tech** — Free serverless PostgreSQL database
- **Render.com** — Free Python/FastAPI hosting
- **Vercel.com** — Free Next.js hosting

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async web framework |
| **SQLAlchemy 2.0** | Async ORM |
| **PostgreSQL** | Relational database |
| **Asyncpg** | Async PostgreSQL driver |
| **Alembic** | Database migrations |
| **PyJWT** | JWT token handling |
| **Bcrypt** | Password hashing |
| **Groq API** | LLM provider (LLaMA 3.3-70B) |
| **Pydantic v2** | Data validation & settings |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework (App Router) |
| **Vanilla CSS Modules** | Component-scoped styling |
| **Server-Sent Events** | Real-time AI streaming |
| **React Markdown** | Render AI markdown output |

---

## License

This project is licensed under the MIT License.
