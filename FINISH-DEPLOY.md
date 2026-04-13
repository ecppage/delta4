# Delta4 — Finish Deploying (10 minutes)

You've already completed the hard parts. Here's what's done and what's left.

## Already Done

- Homebrew, Node.js, npm, git, GitHub CLI — all installed
- Supabase project created (wqljlrquhbncmyagfzop)
- Database tables created (profiles, tasks, completions, weekly_snapshots)
- Magic link email auth enabled
- Redirect URL added (localhost:5173)
- .env file created with your Supabase keys
- Code pushed to GitHub (github.com/ecppage/delta4)

## What's Left: Deploy to Vercel

Open Terminal (Cmd + Space → type "Terminal" → Enter).

### Step 1: Navigate to the project

```
cd "/Users/ecppage/Documents/Claude/Projects/Delta4-cowork/CLAUDE OUTPUTS/Delta4/delta4-mvp"
```

Verify you're in the right place:

```
ls package.json
```

You should see `package.json` printed. If not, the path may have changed — find the delta4-mvp folder in Finder, then type `cd ` (with a space), drag the folder into Terminal, and press Enter.

### Step 2: Install dependencies

```
npm install
```

Wait for it to finish (you'll see your cursor blinking again at the prompt).

### Step 3: Install and log into Vercel

```
npm install -g vercel
```

```
vercel login
```

When it asks how to log in, choose **Continue with Email**. Type your email and press Enter. It will send a verification email — click the link in the email to confirm.

You'll see "Congratulations!" in Terminal when you're logged in.

### Step 4: Deploy

Important: If Vercel has an old "delta4" project from yesterday, delete it first:
- Go to https://vercel.com/dashboard
- If you see a delta4 project, click it → Settings → scroll to bottom → Delete Project

Now deploy from Terminal:

```
vercel --prod
```

Answer the questions like this:

| Question | Answer |
|----------|--------|
| Set up and deploy? | **Y** (press Y then Enter) |
| Which scope? | Just press **Enter** (accept default) |
| Link to existing project? | **N** (press N then Enter) |
| What's your project's name? | Just press **Enter** (accept default) |
| In which directory is your code located? | Just press **Enter** (accept default `./`) |
| Want to modify these settings? | **N** (press N then Enter) |

Wait 30-60 seconds. It will build and deploy. At the end you'll see:

```
✅ Production: https://delta4-mvp-xxxxx.vercel.app
```

That URL is your live app! Copy it.

### Step 5: Add environment variables in Vercel

The app won't work yet because Vercel needs your Supabase keys.

1. Go to **https://vercel.com/dashboard**
2. Click on your **delta4-mvp** project
3. Click **Settings** tab → **Environment Variables** in the left sidebar
4. Add these two variables (click Add after each):

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://wqljlrquhbncmyagfzop.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_onxEwovvUSnGrg_VVGcXgQ_wzutaxHy` |

5. After adding both, go to the **Deployments** tab
6. Find the latest deployment → click the **⋯** menu → click **Redeploy**
7. Wait 30-60 seconds for it to rebuild

### Step 6: Tell Supabase about your live URL

1. Copy your Vercel URL (e.g. `https://delta4-mvp-xxxxx.vercel.app`)
2. Go to **https://supabase.com/dashboard/project/wqljlrquhbncmyagfzop/auth/url-configuration**
3. Set **Site URL** to your Vercel URL
4. Add your Vercel URL to **Redirect URLs** (click Add URL)
5. Save

### Step 7: Test it

1. Open your Vercel URL in a browser
2. You should see the Delta4 login screen
3. Enter your email and click "Continue with email"
4. Check your email for a magic link
5. Click the link — you're in!

## Troubleshooting

**App shows a blank white page:**
The env vars weren't set. Go to Vercel → Settings → Environment Variables and make sure both VITE_ variables are there, then redeploy.

**Magic link email doesn't arrive:**
Check spam. Also check that Supabase auth is enabled: Dashboard → Authentication → Providers → Email should be ON.

**"Invalid API key" in browser console:**
The anon key might have been pasted incorrectly. Go to Supabase → Settings → API, copy the anon key fresh, and update it in Vercel env vars. Redeploy.

**Build fails in Vercel:**
Make sure the Framework Preset is set to "Vite" in Vercel project settings → General.
