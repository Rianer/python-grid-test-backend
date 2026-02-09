#!/usr/bin/env bash
set -euo pipefail

# rebuild-server
# Purpose: Pull latest code → clean install → build → restart PM2
# Location: /home/snake-trap/rebuild-server
# Usage:    ./rebuild-server

# ──────────────────────────────────────────────────────────────────────────────
# Configuration – adjust these if needed
# ──────────────────────────────────────────────────────────────────────────────

APP_DIR="python-grid-test-backend"
PM2_NAME="grid-test-backend"           # must match what you see in `pm2 list`
PM2_CONFIG="ecosystem.config.ts"       # or ecosystem.config.js if you use .js

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────────────────────────────────────

log()  { echo -e "${GREEN}[INFO]${NC} $*"  ; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*" ; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

section() {
    echo
    echo -e "${YELLOW}───────────────────────────────────────────────${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}───────────────────────────────────────────────${NC}"
    echo
}

# ──────────────────────────────────────────────────────────────────────────────
# Main logic
# ──────────────────────────────────────────────────────────────────────────────

section "Starting rebuild-server for ${APP_DIR}"

cd "/home/snake-trap/${APP_DIR}" || err "Cannot cd into ${APP_DIR}"

log "Current directory: $(pwd)"
log "Current branch:    $(git branch --show-current)"

# 1. Pull latest code
section "1. Git pull"
git fetch --quiet || warn "git fetch failed – continuing anyway"
git pull --ff-only || err "git pull failed"

# 2. Clean node_modules
section "2. Cleaning node_modules"
rm -rf node_modules || true
rm -f package-lock.json   # optional – remove if you want fresh lockfile

# 3. Full npm install (including devDependencies needed for build)
section "3. npm install (full)"
npm install || err "npm install failed"

# Optional: you can run npm ci instead if you trust package-lock.json
# npm ci || err "npm ci failed"

# 4. Build
section "4. Building the app"
npm run build || err "Build failed – check tsc output above"

# 5. Restart PM2
section "5. Restarting PM2 process"
if pm2 list | grep -q "${PM2_NAME}"; then
    pm2 reload "${PM2_NAME}" --update-env || err "pm2 reload failed"
    log "PM2 reload triggered (zero-downtime if cluster mode)"
else
    warn "Process '${PM2_NAME}' not found in pm2 list – starting fresh"
    pm2 start "${PM2_CONFIG}" || pm2 start dist/app.js --name "${PM2_NAME}"
fi

# Final status
echo
section "Final status"
pm2 list | grep "${PM2_NAME}" || warn "Process not visible – check pm2 logs"

log "Rebuild completed successfully ✓"
echo "→ You can now test: curl http://localhost:3000/health"
