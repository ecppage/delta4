# Delta4 MVP — Deployment Guide

Total setup time: ~20 minutes. Zero cost on free tiers.

---

## Step 1: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `delta4`, choose a region close to you, set a database password
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 2: Run Database Migration (2 min)

1. In Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** — you should see success messages for all tables

## Step 3: Enable Magic Link Auth (2 min)

1. Go to **Authentication → Providers → Email**
2. Ensure "Enable Email provider" is ON
3. Enable "Enable Magic Link sign-in" 
4. Under **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel domain (add after Step 5)
   - Add `http://localhost:5173` to **Redirect URLs** for local dev

## Step 4: Configure Environment (1 min)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase URL and anon key from Step 1

## Step 5: Deploy to Vercel (5 min)

1. Push the `delta4-mvp` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Deploy — Vercel auto-detects Vite and builds correctly
5. Copy your Vercel URL (e.g. `https://delta4-abc.vercel.app`)
6. Go back to Supabase → **Authentication → URL Configuration** → set **Site URL** to your Vercel URL

## Step 6: Set Up Weekly Email Digest (optional, 5 min)

The digest uses [Resend](https://resend.com) for transactional email (free tier: 3,000 emails/month).

### 6a. Get a Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (or use their test domain for dev)
3. Create an API key → copy it

### 6b. Deploy the Edge Function
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend secret
supabase secrets set RESEND_API_KEY=re_your_key_here

# Deploy the function
supabase functions deploy weekly-digest
```

### 6c. Schedule the Weekly Cron
In Supabase → **SQL Editor**, run:

```sql
-- Enable pg_cron and pg_net extensions first
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule digest every Sunday at 9am UTC
select cron.schedule(
  'weekly-digest',
  '0 9 * * 0',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  )
  $$
);
```

Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` (from Settings → API → service_role key — keep this secret).

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Make sure your `.env` file has the Supabase keys.

---

## Architecture Summary

```
Frontend (Vite + React)          Backend (Supabase)
├── src/                         ├── PostgreSQL
│   ├── App.jsx        ←───────→│   ├── profiles
│   ├── lib/                     │   ├── tasks
│   │   ├── supabase.js          │   ├── completions
│   │   ├── useAuth.js           │   └── weekly_snapshots
│   │   └── useTasks.js          ├── Auth (magic link)
│   └── components/              └── Edge Functions
│       ├── AuthScreen.jsx           └── weekly-digest
│       └── WeeklyReview.jsx
```

## Free Tier Limits (plenty for validation)

| Service | Free Tier |
|---------|-----------|
| Supabase | 50K MAU, 500MB DB, unlimited API |
| Vercel | 100GB bandwidth, automatic deploys |
| Resend | 3,000 emails/month |
