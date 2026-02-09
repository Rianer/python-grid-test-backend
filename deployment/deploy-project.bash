#!/usr/bin/env bash
set -euo pipefail

# deploy-project.bash
# Purpose: Pull latest code → clean install → build → restart PM2
# Location: /home/snake-trap/python-grid-test-backend/deployment/deploy-project.bash
# Recommended usage: cd /home/snake-trap/python-grid-test-backend/deployment && ./deploy-project.bash

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

# Relative to the location of this script
PROJECT_ROOT="../.."                          # goes up two levels to python-grid-test-backend
PM2_NAME="grid-test-backend"                  # must match what you see in `pm2 list`
PM2_CONFIG="../ecosystem.config.ts"           # relative to PROJECT_ROOT

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────────────────────────────────────

log()  { echo -e "${GREEN}[INFO]${NC}  $*" ; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*" ; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2 ; exit 1 ; }

section() {
    echo
    echo -e "${YELLOW}────────────────────────────────────────────────────────${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}────────────────────────────────────────────────────────${NC}"
    echo
}

# ──────────────────────────────────────────────────────────────────────────────
# Main logic
# ──────────────────────────────────────────────────────────────────────────────

section "Starting deployment script"

# Move to project root
cd "$(dirname "$0")/${PROJECT_ROOT}" || err "Cannot cd to project root: $(pwd)/${PROJECT_ROOT}"

log "Project root:     $(pwd)"
log "Current branch:   $(git branch --show-current 2>/dev/null || echo 'detached HEAD')"

# 1. Pull latest code
section "1. Pulling latest code"
git fetch --quiet || warn "git fetch failed – continuing"
git pull --ff-only     || err "git pull failed"

# 2. Clean node_modules + dist (optional but recommended for clean builds)
section "2. Cleaning old dependencies and build artifacts"
rm -rf node_modules dist .turbo || true
rm -f package-lock.json       # remove if you want a fresh lockfile every time

# 3. Full npm install (includes devDependencies needed for tsc)
section "3. Installing all dependencies"
npm install || err "npm install failed"

# Alternative: if you prefer lockfile-strict installs and rarely change deps:
# npm ci || err "npm ci failed"

# 4. Build
section "4. Building the project"
npm run build || err "Build failed – check TypeScript errors above"

# 5. Restart / reload PM2
section "5. Restarting PM2 process"
if pm2 list | grep -q "${PM2_NAME}"; then
    pm2 reload "${PM2_NAME}" --update-env || err "pm2 reload failed"
    log "PM2 reload triggered (zero-downtime when using cluster mode)"
else
    warn "Process '${PM2_NAME}' not found – starting it now"
    if [[ -f "${PM2_CONFIG}" ]]; then
        pm2 start "${PM2_CONFIG}" || err "pm2 start with config failed"
    else
        pm2 start dist/app.js --name "${PM2_NAME}" || err "pm2 start failed"
    fi
fi

# Final checks
section "Deployment finished – status"
pm2 list | grep -E "${PM2_NAME}|name|─" || warn "Process not visible in pm2 list"

# Optional quick smoke test
echo
log "Quick health check:"
if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Health endpoint responded successfully${NC}"
else
    echo -e "${RED}✗ Health check failed – check logs${NC}"
    pm2 logs "${PM2_NAME}" --lines 30
fi

echo
log "Deployment completed ✓"
echo "→ You can monitor with: pm2 monit"
echo "→ Or view logs:        pm2 logs ${PM2_NAME}"
