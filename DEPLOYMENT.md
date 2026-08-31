# 🚀 Free Deployment Guide — AI Banking Advisor

> Deploy your project completely for **free** using Neon (Database), Render (Backend), and Vercel (Frontend). No credit card required.

---

## Overview

| Service | What it hosts | Free Tier Limits |
|---------|--------------|-----------------|
| **Neon.tech** | PostgreSQL Database | 512 MB storage, 0.5 vCPU — **permanent free** |
| **Render.com** | FastAPI Backend | 512 MB RAM, sleeps after 15 min inactivity |
| **Vercel.com** | Next.js Frontend | 100 GB bandwidth/month — **no sleep** |

> **Important:** The Render free tier "sleeps" the backend after 15 minutes of no traffic. The first request after it sleeps will take ~30-50 seconds (the server wakes up). After waking, all requests are instant.

---

## Prerequisites

1. Your project code is pushed to a GitHub repository
2. You have your Groq API key ready (`gsk_...`)
3. You have accounts (sign up with GitHub for all three services)

---

## Step 1 — Database on Neon.tech

### 1.1 Create the Database

1. Go to [neon.tech](https://neon.tech/) and sign up with GitHub (free).
2. Click **"Create Project"**.
3. Enter a project name: `banking-advisor-db`.
4. Select the region closest to you (Singapore or Frankfurt work well).
5. Click **"Create Project"**.

### 1.2 Get the Connection String

After creating the project, Neon will show you a **Connection String**. It will look similar to:
```
postgresql://neondb_owner:AbCxYz123@ep-cool-sun-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

⚠️ **You must change `postgresql://` to `postgresql+asyncpg://`** so FastAPI can connect asynchronously. Your final URL should look like:
```
postgresql+asyncpg://neondb_owner:AbCxYz123@ep-cool-sun-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Save this modified URL** — you will need it in Step 2.

### 1.3 Seed the Live Database (Recommended)

Temporarily update your local `backend/.env` file:
```ini
DATABASE_URL=postgresql+asyncpg://... (paste your Neon URL here)
```

Then run the seed script from your local machine to fill the live DB with bank data:
```bash
cd backend
.\venv\Scripts\Activate
python -m seed_data.seed_banks
```

After seeding, you can restore your original local DATABASE_URL in `.env`.

---

## Step 2 — Backend on Render.com

### 2.1 Create the Web Service

1. Go to [render.com](https://render.com/) and sign up with GitHub (free).
2. On the dashboard, click **"New +"** → **"Web Service"**.
3. Select **"Build and deploy from a Git repository"**.
4. Click **"Connect"** next to your `banking-ai-agent` repository.

### 2.2 Configure the Service

Fill in the settings:

| Field | Value |
|-------|-------|
| **Name** | `banking-advisor-api` |
| **Region** | Singapore (or closest to you) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

### 2.3 Add Environment Variables

Scroll down to the **"Environment Variables"** section. Click **"Add Environment Variable"** for each row:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon URL from Step 1 (postgresql+asyncpg://...) |
| `JWT_SECRET_KEY` | A long random string (e.g., `xK9!mP2@nQ4$vL7#wR1&jF5*zH8`) |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `GROQ_API_KEY` | Your Groq API key (`gsk_...`) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` |
| `APP_NAME` | `AI Banking Advisor` |
| `APP_ENV` | `production` |
| `CORS_ORIGINS` | (leave blank for now — fill in after Step 3) |

### 2.4 Deploy

Click **"Create Web Service"**. Render will now:
1. Pull your code from GitHub
2. Install Python dependencies
3. Start your FastAPI server

Wait 3-5 minutes for the first build to complete. Once deployed, Render gives you a URL like:
```
https://banking-advisor-api.onrender.com
```

**Test it:** Visit `https://banking-advisor-api.onrender.com/api/health` in your browser. You should see:
```json
{"status": "healthy", "app": "AI Banking Advisor", "environment": "production"}
```

**Save this URL** — you need it for Step 3.

---

## Step 3 — Frontend on Vercel.com

### 3.1 Import the Project

1. Go to [vercel.com](https://vercel.com/) and sign up with GitHub (free).
2. Click **"Add New..."** → **"Project"**.
3. Find your `banking-ai-agent` repository and click **"Import"**.

### 3.2 Configure the Project

| Field | Value |
|-------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | Click Edit → type `frontend` |

### 3.3 Add Environment Variables

Open the **"Environment Variables"** section:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | Your Render URL (e.g., `https://banking-advisor-api.onrender.com`) |

### 3.4 Deploy

Click **"Deploy"**. Vercel will build your Next.js app in about 1-2 minutes.

Once complete, Vercel gives you a URL like:
```
https://banking-ai-agent.vercel.app
```

**Save this URL** — you need it for Step 4.

---

## Step 4 — Update CORS Settings

Your FastAPI backend needs to know which origin is allowed to talk to it. Now that you have your Vercel URL, go back to Render and update the environment variable:

1. Open your Web Service on [render.com](https://render.com/).
2. Go to **"Environment"** tab.
3. Find `CORS_ORIGINS` and set it to your Vercel URL:
   ```
   https://banking-ai-agent.vercel.app
   ```
4. Click **"Save Changes"**. Render will automatically redeploy.

---

## Step 5 — Verify Everything Works

1. Open your Vercel URL: `https://banking-ai-agent.vercel.app`
2. You should see the **login page**.
3. Click "Create one" to sign up with a new account.
4. Start chatting — ask something like *"What's the best savings account for students?"*
5. The AI should respond with streaming text from the Account Advisor agent.
6. Go to the **Dashboard** to see your analytics.

---

## Updating the Deployment

Whenever you push new code to GitHub:
- **Render** automatically rebuilds and redeploys your backend.
- **Vercel** automatically rebuilds and redeploys your frontend.

No manual steps needed — everything is automated via GitHub.

---

## Troubleshooting

### Backend shows "Application Error" on Render
- Check the **Logs** tab in your Render dashboard
- Make sure all environment variables are set correctly
- Verify the `DATABASE_URL` starts with `postgresql+asyncpg://`

### "Connection refused" or "Network Error" on the frontend
- Your Render backend might be asleep — wait 30-50 seconds and try again
- Verify `NEXT_PUBLIC_API_URL` on Vercel matches your Render URL exactly (no trailing slash)

### "CORS error" in browser
- Make sure `CORS_ORIGINS` on Render is set to your exact Vercel URL
- No trailing slash: `https://your-app.vercel.app` ✅ (not `https://your-app.vercel.app/`)

### Database errors
- Verify the Neon database URL is correct and starts with `postgresql+asyncpg://`
- Make sure the seeding script was run successfully
- Check Neon dashboard to confirm the database exists and tables are created

### Groq API errors
- Confirm your `GROQ_API_KEY` starts with `gsk_`
- Test the key at [console.groq.com](https://console.groq.com/) directly
- Check you have not exceeded the Groq free tier rate limit

---

## Summary Table

| Step | Service | Time | URL |
|------|---------|------|-----|
| 1 | Neon Database | 2 min | neon.tech |
| 2 | Render Backend | 5 min | render.com |
| 3 | Vercel Frontend | 2 min | vercel.com |
| 4 | Configure CORS | 1 min | Back on Render |
| **Total** | | **~10 min** | |
