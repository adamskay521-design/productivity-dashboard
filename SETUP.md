# Setup Guide

## 1. Install Node.js

```bash
# Install via homebrew (recommended on Mac)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

Or download directly from https://nodejs.org (choose LTS).

## 2. Install dependencies

```bash
cd ~/productivity-dashboard
npm install
```

## 3. Set up Neon Postgres

1. Go to https://neon.tech and create a free account
2. Create a new project → name it "productivity-dashboard"
3. In the project dashboard, click **Connection Details**
4. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

## 4. Configure environment variables

```bash
cp .env.local.example .env.local
# Open .env.local and paste your Neon connection string
```

## 5. Create database tables

In the Neon dashboard, go to **SQL Editor** and run the contents of `scripts/schema.sql`.

Or from the terminal (once Node is installed):

```bash
DATABASE_URL="your-connection-string" npx drizzle-kit push
```

## 6. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

## 7. Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow prompts, it will auto-detect Next.js
```

Then add your environment variable in Vercel:
- Dashboard → Your project → Settings → Environment Variables
- Add `DATABASE_URL` = your Neon connection string

Or link directly from Neon:
- Neon dashboard → Integrations → Vercel → Connect
- This automatically adds `DATABASE_URL` to your Vercel project
