#!/bin/bash
# =============================================================
# GKJJ — Deployment / Update Script
# Jalankan untuk deploy pertama kali MAUPUN update versi baru:
#   bash /var/www/gkjj/deploy/2-deploy.sh
# =============================================================

set -euo pipefail

APP_DIR="/var/www/gkjj"
APP_USER="gkjj"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

cd "$APP_DIR"

# Pastikan .env sudah ada
[ -f "apps/api/.env"      ] || error "apps/api/.env belum ada! Buat dulu dari deploy/env.api.production"
[ -f "apps/web/.env.local" ] || error "apps/web/.env.local belum ada! Isi: NEXT_PUBLIC_API_URL=https://api.gkjjakarta.org/api"

# ── 1. Pull kode terbaru ──────────────────────────────────────
info "Pull kode terbaru dari GitHub..."
sudo -u "$APP_USER" git pull origin main

# ── 2. Install dependencies ───────────────────────────────────
info "Install npm dependencies..."
sudo -u "$APP_USER" npm install --legacy-peer-deps

# ── 3. Generate Prisma Client ─────────────────────────────────
info "Generate Prisma client..."
cd "$APP_DIR/apps/api"
sudo -u "$APP_USER" npx prisma generate

# ── 4. Push schema ke database ───────────────────────────────
info "Sync schema database..."
sudo -u "$APP_USER" npx prisma db push

# ── 5. Seed master data (skip jika sudah ada) ─────────────────
info "Seed master data (kelurahan & komisi)..."
sudo -u "$APP_USER" npx tsx prisma/seed-master.ts || warn "Seed dilewati (mungkin sudah ada data)"

# ── 6. Build API ──────────────────────────────────────────────
info "Build API (TypeScript → JavaScript)..."
cd "$APP_DIR/apps/api"
sudo -u "$APP_USER" npm run build

# ── 7. Build Web (Next.js) ────────────────────────────────────
info "Build Web (Next.js)..."
cd "$APP_DIR/apps/web"
# Limit memory agar tidak OOM di VPS 2GB
sudo -u "$APP_USER" env NODE_OPTIONS="--max-old-space-size=1400" npm run build

# ── 8. Restart / Start PM2 ───────────────────────────────────
info "Restart aplikasi via PM2..."
cd "$APP_DIR"
if pm2 list | grep -q "gkjj-"; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  sudo -u "$APP_USER" pm2 start deploy/ecosystem.config.cjs
  pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -1 | bash || true
fi
pm2 save

echo ""
echo "======================================================"
echo -e "${GREEN}✅  Deploy selesai!${NC}"
echo "======================================================"
pm2 status
echo ""
echo "Cek log: pm2 logs gkjj-api | pm2 logs gkjj-web"
