#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════
# Delta4 — One-Command Deploy Script
# Run: chmod +x deploy.sh && ./deploy.sh
# ═══════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
GOLD='\033[0;33m'
BLUE='\033[0;34m'
DIM='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${GOLD}${BOLD}  Δ Delta4 Deploy${NC}"
  echo -e "${DIM}  ─────────────────────────────────${NC}"
  echo ""
}

print_step() {
  echo -e "${GOLD}▸ STEP $1${NC} — ${BOLD}$2${NC}"
}

print_ok() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_fail() {
  echo -e "  ${RED}✗${NC} $1"
}

print_info() {
  echo -e "  ${DIM}$1${NC}"
}

print_action() {
  echo -e "  ${BLUE}→${NC} $1"
}

wait_for_enter() {
  echo ""
  echo -e "  ${DIM}Press Enter when done...${NC}"
  read -r
}

# ═══════════════════════════════════════════════════════
# STEP 0: Prerequisites
# ═══════════════════════════════════════════════════════
print_header

print_step "0" "Checking prerequisites"
echo ""

MISSING=0

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_ok "Node.js ${NODE_VERSION}"
else
  print_fail "Node.js not found"
  echo ""
  echo -e "  ${BOLD}Install Node.js first:${NC}"
  echo -e "  • macOS:  ${BLUE}brew install node${NC}  (or download from https://nodejs.org)"
  echo -e "  • Linux:  ${BLUE}curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs${NC}"
  echo -e "  • Windows: Download from ${BLUE}https://nodejs.org${NC}"
  echo ""
  echo -e "  Then re-run this script."
  exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  print_ok "npm ${NPM_VERSION}"
else
  print_fail "npm not found (should come with Node.js)"
  exit 1
fi

# Check git
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version | awk '{print $3}')
  print_ok "git ${GIT_VERSION}"
else
  print_fail "git not found"
  echo ""
  echo -e "  Install: ${BLUE}https://git-scm.com/downloads${NC}"
  exit 1
fi

# Check/install GitHub CLI
if command -v gh &> /dev/null; then
  print_ok "GitHub CLI (gh)"
else
  print_action "Installing GitHub CLI..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install gh 2>/dev/null
    else
      echo -e "  ${RED}Please install Homebrew first:${NC} /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
      echo -e "  Then re-run this script."
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
      && sudo mkdir -p -m 755 /etc/apt/keyrings \
      && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
      && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
      && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli-stable.list > /dev/null \
      && sudo apt update \
      && sudo apt install gh -y
  fi
  if command -v gh &> /dev/null; then
    print_ok "GitHub CLI installed"
  else
    print_fail "Could not install GitHub CLI. Install manually: https://cli.github.com"
    exit 1
  fi
fi

echo ""
print_ok "All prerequisites met"
echo ""

# ═══════════════════════════════════════════════════════
# STEP 1: Create Supabase Project
# ═══════════════════════════════════════════════════════
print_step "1" "Set up Supabase (database + auth)"
echo ""

if [ -f .env ] && grep -q "VITE_SUPABASE_URL=https://" .env 2>/dev/null; then
  print_ok ".env already has Supabase config — skipping"
  source .env 2>/dev/null || true
else
  echo -e "  I need you to create a free Supabase project."
  echo ""
  echo -e "  ${BOLD}1.${NC} Open ${BLUE}https://supabase.com/dashboard/new${NC}"
  echo -e "  ${BOLD}2.${NC} Sign up or log in (GitHub sign-in is fastest)"
  echo -e "  ${BOLD}3.${NC} Click ${BOLD}New Project${NC}"
  echo -e "     • Name: ${GOLD}delta4${NC}"
  echo -e "     • Password: pick anything (for direct DB access only)"
  echo -e "     • Region: choose closest to you"
  echo -e "  ${BOLD}4.${NC} Wait ~30 seconds for it to provision"
  echo -e "  ${BOLD}5.${NC} Go to ${BOLD}Settings → API${NC} (left sidebar)"

  wait_for_enter

  # Get Supabase URL
  echo -e "  ${BOLD}Paste your Project URL${NC} (starts with https://...supabase.co):"
  read -r SUPABASE_URL
  while [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; do
    echo -e "  ${RED}That doesn't look right.${NC} Should be like: https://abc123xyz.supabase.co"
    read -r SUPABASE_URL
  done
  print_ok "Project URL: ${SUPABASE_URL}"

  # Get anon key
  echo ""
  echo -e "  ${BOLD}Paste your anon (public) key${NC} (starts with eyJ...):"
  read -r SUPABASE_ANON_KEY
  while [[ ! "$SUPABASE_ANON_KEY" =~ ^eyJ ]]; do
    echo -e "  ${RED}That doesn't look right.${NC} Should start with eyJ..."
    read -r SUPABASE_ANON_KEY
  done
  print_ok "Anon key captured"

  # Write .env
  cat > .env << ENVEOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
ENVEOF

  print_ok ".env file created"
fi

echo ""

# ═══════════════════════════════════════════════════════
# STEP 2: Run Database Migration
# ═══════════════════════════════════════════════════════
print_step "2" "Set up database tables"
echo ""
echo -e "  ${BOLD}In your Supabase Dashboard:${NC}"
echo -e "  ${BOLD}1.${NC} Go to ${BOLD}SQL Editor${NC} (left sidebar)"
echo -e "  ${BOLD}2.${NC} Click ${BOLD}New Query${NC}"
echo -e "  ${BOLD}3.${NC} Paste the entire contents of this file:"
echo -e "     ${BLUE}supabase/migrations/001_initial_schema.sql${NC}"
echo ""
echo -e "  ${DIM}(Tip: run this in your terminal to copy it to clipboard)${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "  ${BLUE}cat supabase/migrations/001_initial_schema.sql | pbcopy${NC}"
else
  echo -e "  ${BLUE}cat supabase/migrations/001_initial_schema.sql | xclip -selection clipboard${NC}"
fi
echo ""
echo -e "  ${BOLD}4.${NC} Click ${BOLD}Run${NC} — should show 'Success. No rows returned' multiple times"

wait_for_enter
print_ok "Database schema created"
echo ""

# ═══════════════════════════════════════════════════════
# STEP 3: Enable Magic Link Auth
# ═══════════════════════════════════════════════════════
print_step "3" "Enable Magic Link authentication"
echo ""
echo -e "  ${BOLD}In Supabase Dashboard:${NC}"
echo -e "  ${BOLD}1.${NC} Go to ${BOLD}Authentication → Providers → Email${NC}"
echo -e "  ${BOLD}2.${NC} Ensure ${GREEN}Enable Email provider${NC} is ON"
echo -e "  ${BOLD}3.${NC} Ensure ${GREEN}Enable Magic Link sign-in${NC} is ON"
echo -e "  ${BOLD}4.${NC} Go to ${BOLD}Authentication → URL Configuration${NC}"
echo -e "  ${BOLD}5.${NC} Add ${BLUE}http://localhost:5173${NC} to ${BOLD}Redirect URLs${NC}"
echo -e "     ${DIM}(We'll add the production URL after deploy)${NC}"

wait_for_enter
print_ok "Auth configured"
echo ""

# ═══════════════════════════════════════════════════════
# STEP 4: Install Dependencies
# ═══════════════════════════════════════════════════════
print_step "4" "Installing npm dependencies"
echo ""
npm install
print_ok "Dependencies installed"
echo ""

# ═══════════════════════════════════════════════════════
# STEP 5: Test Locally
# ═══════════════════════════════════════════════════════
print_step "5" "Quick local test"
echo ""
echo -e "  Starting dev server to verify build..."
echo ""

# Build to check for errors (faster than starting dev server)
npx vite build --mode development 2>&1 | tail -5
if [ $? -eq 0 ]; then
  print_ok "Build successful — app compiles cleanly"
else
  print_fail "Build failed. Check the errors above."
  echo -e "  Fix any issues and re-run this script."
  exit 1
fi
echo ""

# ═══════════════════════════════════════════════════════
# STEP 6: GitHub Repo
# ═══════════════════════════════════════════════════════
print_step "6" "Create GitHub repository"
echo ""

# Check if already a git repo
if [ -d .git ]; then
  print_ok "Already a git repo"
else
  git init
  print_ok "Git initialized"
fi

# Create .gitignore
cat > .gitignore << 'GIEOF'
node_modules/
dist/
.env
.env.local
*.local
GIEOF
print_ok ".gitignore created"

# Stage and commit
git add -A
git commit -m "Delta4 MVP — Supabase + React + Weekly Analytics" 2>/dev/null || print_info "Nothing new to commit"

# GitHub auth
if ! gh auth status &> /dev/null; then
  echo -e "  ${BOLD}Logging into GitHub...${NC}"
  gh auth login
fi
print_ok "GitHub authenticated"

# Create repo
if gh repo view &> /dev/null 2>&1; then
  print_ok "GitHub repo already exists"
  git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || true
else
  echo ""
  echo -e "  Creating private GitHub repo ${GOLD}delta4${NC}..."
  gh repo create delta4 --private --source=. --push
  print_ok "GitHub repo created and code pushed"
fi
echo ""

# ═══════════════════════════════════════════════════════
# STEP 7: Deploy to Vercel
# ═══════════════════════════════════════════════════════
print_step "7" "Deploy to Vercel"
echo ""

# Install Vercel CLI
if ! command -v vercel &> /dev/null; then
  print_action "Installing Vercel CLI..."
  npm install -g vercel
fi
print_ok "Vercel CLI ready"

# Login
echo -e "  ${BOLD}Logging into Vercel...${NC}"
vercel login 2>/dev/null || true

# Load env vars
source .env 2>/dev/null || true

# Deploy
echo ""
echo -e "  ${BOLD}Deploying to Vercel...${NC}"
echo -e "  ${DIM}(Accept defaults when prompted. Framework: Vite)${NC}"
echo ""

DEPLOY_URL=$(vercel --prod \
  -e VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}" \
  -e VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}" \
  2>&1 | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1)

if [ -n "$DEPLOY_URL" ]; then
  print_ok "Deployed to: ${DEPLOY_URL}"
else
  # Fallback — deploy interactively
  echo -e "  ${DIM}Running interactive deploy...${NC}"
  vercel --prod
  echo ""
  echo -e "  ${BOLD}What's your Vercel URL?${NC} (e.g. https://delta4-abc.vercel.app):"
  read -r DEPLOY_URL
fi

echo ""

# ═══════════════════════════════════════════════════════
# STEP 8: Final Config
# ═══════════════════════════════════════════════════════
print_step "8" "Final configuration"
echo ""
echo -e "  ${BOLD}Last step — update Supabase auth URLs:${NC}"
echo ""
echo -e "  ${BOLD}1.${NC} Go to ${BOLD}Authentication → URL Configuration${NC} in Supabase"
echo -e "  ${BOLD}2.${NC} Set ${BOLD}Site URL${NC} to: ${BLUE}${DEPLOY_URL}${NC}"
echo -e "  ${BOLD}3.${NC} Add ${BLUE}${DEPLOY_URL}${NC} to ${BOLD}Redirect URLs${NC}"

wait_for_enter
print_ok "Auth redirect configured"

echo ""
echo -e "${GOLD}${BOLD}  ═══════════════════════════════════════${NC}"
echo -e "${GOLD}${BOLD}  Δ Delta4 is LIVE!${NC}"
echo -e "${GOLD}${BOLD}  ═══════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Your app:${NC}      ${BLUE}${DEPLOY_URL}${NC}"
echo -e "  ${BOLD}Dashboard:${NC}     ${BLUE}https://supabase.com/dashboard${NC}"
echo -e "  ${BOLD}Local dev:${NC}     ${BLUE}npm run dev${NC}"
echo ""
echo -e "  ${DIM}Optional next steps:${NC}"
echo -e "  ${DIM}• Set up weekly email digest (see DEPLOY.md Step 6)${NC}"
echo -e "  ${DIM}• Connect a custom domain in Vercel settings${NC}"
echo ""
echo -e "  ${GOLD}Start adding tasks and validating. Ship it. 🚀${NC}"
echo ""
