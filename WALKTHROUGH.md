# 📖 Project Walkthrough — AI Banking Advisor

> A technical deep-dive into every layer of the codebase for developers, reviewers, and supervisors.

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [Backend Architecture](#2-backend-architecture)
3. [Database Schema](#3-database-schema)
4. [Multi-Agent AI System](#4-multi-agent-ai-system)
5. [Authentication Flow](#5-authentication-flow)
6. [Chat & Streaming (SSE)](#6-chat--streaming-sse)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Design System](#8-design-system)
9. [API Client & State Management](#9-api-client--state-management)
10. [End-to-End Data Flow](#10-end-to-end-data-flow)

---

## 1. Project Philosophy

This project was built following enterprise software engineering principles:

- **Clean Architecture** — The codebase is separated into distinct layers (API → Service → Repository/ORM). Each layer has a single responsibility and does not reach across layers.
- **Async-First** — Every database call, HTTP call, and AI call is fully asynchronous using `async/await`. This ensures the server never blocks on I/O, enabling high concurrency.
- **Modularity** — Every agent, route, service, and model is isolated in its own file. Adding a new specialist agent requires only creating a new prompt and registering it in the orchestrator.
- **Security-First** — Passwords are never stored in plaintext (bcrypt). Tokens are short-lived (30 min access, 7 day refresh). All endpoints except signup/login require a valid JWT.

---

## 2. Backend Architecture

The backend is a **FastAPI application** using the App Factory pattern.

```
app/
├── main.py          ← App factory, startup lifespan, CORS, global error handler
├── config.py        ← All settings loaded from .env using Pydantic Settings
├── database.py      ← Async SQLAlchemy engine, session factory, Base class
├── models/          ← SQLAlchemy ORM models (the database schema)
├── schemas/         ← Pydantic models for request/response validation
├── api/             ← FastAPI routers (thin controllers, no business logic)
├── services/        ← Business logic (AuthService, ChatService, BankService)
├── agents/          ← AI orchestration (prompts, tools, runner)
├── middleware/       ← JWT authentication dependency
└── utils/           ← Logger, helpers
```

### Key Design Decisions

**App Factory with Lifespan:** The `@asynccontextmanager lifespan` in `main.py` runs on startup to create database tables and on shutdown to dispose the connection pool cleanly.

**Service Layer:** Route handlers in `api/` only validate inputs and call services. All database logic and business rules live in `services/`. This makes services independently testable.

**Dependency Injection:** FastAPI's `Depends()` system is used for:
  - Providing database sessions (`get_db`)
  - Protecting routes (`get_current_user`)

---

## 3. Database Schema

The PostgreSQL database has **9 tables** connected through foreign keys.

```
users ──────────────┬──── sessions (refresh tokens)
  │                 │
  ├── conversations ─── messages
  │
  └── recommendations

banks ──────────────┬──── products (savings accounts, etc.)
                    ├──── cards (credit/debit cards)
                    └──── loans (home, car, personal)
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Stores user profile: email (unique), bcrypt-hashed password, name, city |
| `sessions` | Stores refresh token JTIs. Allows token revocation on logout |
| `conversations` | A chat session. Has a title (from the first message) and a message count |
| `messages` | Every chat message. Has `role` (user/assistant), `content`, and `agent_name` (which AI responded) |
| `banks` | Pakistani bank data: name, type, ratings, Islamic banking flag |
| `products` | Savings/current account products linked to a bank |
| `cards` | Credit/debit card products linked to a bank |
| `loans` | Loan products (home, car, personal) linked to a bank |
| `recommendations` | Analytics log: tracks which bank/product was recommended and why |

---

## 4. Multi-Agent AI System

The AI system is in `app/agents/`. It uses **Groq's LLaMA 3.3-70B** model via Groq's OpenAI-compatible API.

### How It Works

Every time a user sends a message, the orchestrator runs **two sequential API calls** to Groq:

**Step 1 — Triage (Intent Detection):**
A fast, non-streaming call sends the user's message to a short classification prompt. The LLM responds with a single word: `account`, `loan`, `card`, `investment`, `digital`, or `general`.

**Step 2 — Specialist Response (Streaming):**
Based on the detected intent, the correct specialist system prompt is selected. A second, streaming call is made with:
- The specialist's detailed system prompt
- The full conversation history (last 16 messages for context)
- The user's current message

The streaming response is piped directly back to the frontend via SSE.

### The 7 Agents

| Agent | Intent | Specialization |
|-------|--------|----------------|
| Triage Agent | (internal) | Intent detection only |
| Account Advisor | `account` | Savings, current, student, business accounts |
| Loan Advisor | `loan` | Home, car, personal, business loans |
| Card Advisor | `card` | Credit cards, debit cards, cashback, travel |
| Investment Advisor | `investment` | Fixed deposits, mutual funds, certificates |
| Digital Banking Expert | `digital` | Mobile apps, SadaPay, JazzCash, Easypaisa |
| General Banking Advisor | `general` | Bank comparisons, branches, general queries |

### Agent Prompts (`app/agents/prompts.py`)

Each agent has a detailed system prompt that instructs it to:
- Always ask 2-3 qualifying questions before recommending
- Compare at least 3 banks when making recommendations
- Mention profit rates, fees, and eligibility requirements
- Respond in a culturally aware, Pakistan-specific manner

---

## 5. Authentication Flow

The app uses a **dual-token JWT system** for security.

```
User logs in
    ↓
Server verifies password with bcrypt
    ↓
Server generates:
  - Access Token (JWT, expires in 30 min)
  - Refresh Token (JWT, expires in 7 days, JTI stored in DB)
    ↓
Frontend stores both tokens in localStorage
    ↓
Every API request includes:
  Authorization: Bearer <access_token>
    ↓
If access token expires (401 response):
  Frontend auto-calls /api/auth/refresh with refresh token
  Server validates refresh token JTI exists in DB
  Server issues a new access token
    ↓
On logout:
  Server deletes the refresh token JTI from the DB
  (even if someone steals the refresh token, it's now invalid)
```

---

## 6. Chat & Streaming (SSE)

The chat system uses **Server-Sent Events (SSE)** — a one-way, real-time connection from server to browser.

### How a Message is Sent

1. **Frontend** calls `POST /api/chat/send` with `{ message, conversation_id }`.
2. **Backend** creates or retrieves the conversation and stores the user's message in the DB.
3. **Backend** calls `run_agent()` which begins streaming from Groq.
4. **Backend** immediately returns a `StreamingResponse` with `Content-Type: text/event-stream`.
5. As the LLM generates tokens, the backend yields SSE events:
   ```
   data: {"type": "conversation_id", "id": "abc-123"}
   data: {"type": "agent_name", "name": "Loan Advisor"}
   data: {"type": "content", "content": "Based on your"}
   data: {"type": "content", "content": " requirements..."}
   data: {"type": "done"}
   ```
6. **Frontend** reads these events and appends content to the UI in real-time.
7. After the `done` event, the backend stores the complete AI response in the DB.

---

## 7. Frontend Architecture

The frontend is a **Next.js 16** application using the App Router.

```
app/
├── layout.js           ← Root layout, wraps all pages with AuthProvider
├── page.js             ← Landing page (redirects to /chat or /login)
├── globals.css         ← Design system: CSS variables, utilities, animations
├── login/page.js       ← Login form with glassmorphism card
├── signup/page.js      ← Signup form with city selection
├── chat/
│   ├── layout.js       ← Chat shell: Sidebar + main content area
│   ├── page.js         ← Default chat view (welcome screen)
│   └── [id]/page.js    ← Active chat view for a specific conversation
└── dashboard/
    ├── page.js         ← Analytics dashboard
    └── dashboard.module.css

lib/
├── api.js              ← API client class (all HTTP + SSE calls)
├── auth.js             ← AuthContext and useAuth() hook
└── toast.js            ← Global toast notification system
```

### Page Flow

```
/ (root)
  ↓ (if authenticated)
/chat  →  /chat/[id]  (when a conversation is selected or created)
  ↓ (sidebar link)
/dashboard
  ↓ (logout)
/login  →  /signup
```

---

## 8. Design System

All CSS is written in `app/globals.css` as a custom design system using **CSS Custom Properties (variables)**. No Tailwind, no component libraries.

### Core Tokens

```css
/* Colors */
--color-bg-primary         /* #080c14 — deep dark navy */
--color-glass              /* rgba(...) — glassmorphism panels */
--color-accent-blue        /* #4f9ef8 — primary interactive color */
--color-accent-green       /* #22c55e — success / online states */
--color-accent-gold        /* #f59e0b — premium highlights */

/* Typography */
--font-size-xs → --font-size-4xl   /* 11px → 32px scale */

/* Spacing */
--space-1 → --space-16             /* 4px → 64px scale */

/* Effects */
--shadow-glow              /* Blue glow for primary actions */
--gradient-hero            /* Animated hero background */
```

### Component Classes

```css
.card           /* Glassmorphism panel with border and blur */
.btn-primary    /* Blue gradient button with glow hover */
.btn-ghost      /* Transparent button */
.input          /* Dark input field with focus ring */
.skeleton       /* Animated loading placeholder */
.badge          /* Small status pill */
```

---

## 9. API Client & State Management

There is no Redux or Zustand. State management is minimal:

- **`lib/api.js`** — A singleton `ApiClient` class that holds tokens in memory (and syncs to `localStorage`). It wraps `fetch` and auto-refreshes expired tokens transparently.
- **`lib/auth.js`** — A React Context (`AuthContext`) that wraps the whole app. It provides `user`, `loading`, `login()`, and `logout()` to any component via `useAuth()`.
- **Page-level state** — Each page (`chat/layout.js`, `chat/[id]/page.js`) manages its own local state with `useState` and `useEffect`.

The SSE streaming is handled manually in `chat/[id]/page.js` using the native browser `ReadableStream` API:
```js
const response = await api.sendMessageStream(message, convId);
const reader = response.body.getReader();
// Read chunks as they arrive...
```

---

## 10. End-to-End Data Flow

Here is the complete journey of a single user message from the browser to the database and back:

```
Browser (user types "best credit card for travel?")
    ↓  POST /api/chat/send  { message, conversation_id }
FastAPI (chat.py router)
    ↓  get_current_user() validates JWT
    ↓  ChatService.add_message() stores user message in DB
    ↓  ChatService.get_conversation_with_messages() fetches history
    ↓  Returns StreamingResponse (text/event-stream)
         ↓
    orchestrator.run_agent()
         ↓
    Step 1: Groq API call (non-streaming, fast)
    → "card"
         ↓
    Step 2: card_advisor system prompt selected
    → SSE event: { type: "agent_name", name: "Card Advisor" }
         ↓
    Step 3: Groq API streaming call begins
    → SSE event: { type: "content", content: "Great choice! " }
    → SSE event: { type: "content", content: "For travel..." }
    → ... (streams until complete) ...
    → SSE event: { type: "done" }
         ↓
    ChatService.add_message() stores full AI response in DB
Browser (frontend)
    → Reads SSE events as they arrive
    → Appends each content chunk to the message bubble in real-time
    → On "agent_name" event, shows "Card Advisor" badge
    → On "done" event, shows copy button
```
