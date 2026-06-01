#!/bin/bash
# =============================================================
# GKJJ — Deployment / Update Script
#
# Penggunaan:
#   bash /var/www/gkjj/deploy/2-deploy.sh dev    ← testing (purwandaru.com)
#   bash /var/www/gkjj/deploy/2-deploy.sh prod   ← production (gkjjakarta.org)
#
# Jalankan untuk deploy pertama kali MAUPUN update versi baru.
# =============================================================

set -euo pipefail

# ── Environment argument ──────────────────────────────────────
ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "❌ Argumen environment wajib diisi."
  echo "   Penggunaan: bash 2-deploy.sh dev"
  echo "               bash 2-deploy.sh prod"
  exit 1
fi

APP_DIR="/var/www/gkjj"
APP_USER="gkjj"

if [[ "$ENV" == "dev" ]]; then
  ENV_LABEL="TESTING (purwandaru.com)"
  API_URL="https://api.purwandaru.com/api"
  ENV_TEMPLATE="deploy/env.api.dev"
  NGINX_WEB="deploy/nginx-jemaat.dev.conf"
  NGINX_API="deploy/nginx-api.dev.conf"
  NGINX_WEB_DEST="/etc/nginx/sites-available/jemaat.purwandaru.com"
  NGINX_API_DEST="/etc/nginx/sites-available/api.purwandaru.com"
else
  ENV_LABEL="PRODUCTION (gkjjakarta.org)"
  API_URL="https://api.gkjjakarta.org/api"
  ENV_TEMPLATE="deploy/env.api.production"
  NGINX_WEB="deploy/nginx-jemaat.prod.conf"
  NGINX_API="deploy/nginx-api.prod.conf"
  NGINX_WEB_DEST="/etc/nginx/sites-available/jemaat.gkjjakarta.org"
  NGINX_API_DEST="/etc/nginx/sites-available/api.gkjjakarta.org"
fi

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Deploy: $ENV_LABEL${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

cd "$APP_DIR"

# ── Validasi .env ─────────────────────────────────────────────
if [ ! -f "apps/api/.env" ]; then
  error "apps/api/.env belum ada! Salin dari: $ENV_TEMPLATE"
fi
if [ ! -f "apps/web/.env.local" ]; then
  error "apps/web/.env.local belum ada! Jalankan dulu:\n  echo 'NEXT_PUBLIC_API_URL=$API_URL' > $APP_DIR/apps/web/.env.local"
fi

# Validasi CORS_ORIGIN sesuai environment
if [[ "$ENV" == "dev" ]]; then
  grep -q "purwandaru.com" "apps/api/.env" || \
    warn "CORS_ORIGIN di apps/api/.env mungkin tidak sesuai environment dev (purwandaru.com)"
else
  grep -q "gkjjakarta.org" "apps/api/.env" || \
    warn "CORS_ORIGIN di apps/api/.env mungkin tidak sesuai environment prod (gkjjakarta.org)"
fi

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
sudo -u "$APP_USER" npx tsx prisma/seed-master.ts || warn "Seed dilewati (data sudah ada)"

# ── 6. Build API ──────────────────────────────────────────────
info "Build API (TypeScript → JavaScript)..."
cd "$APP_DIR/apps/api"
sudo -u "$APP_USER" npm run build

# ── 7. Build Web (Next.js) ────────────────────────────────────
info "Build Web (Next.js)..."
cd "$APP_DIR/apps/web"
sudo -u "$APP_USER" env NODE_OPTIONS="--max-old-space-size=1400" npm run build

# ── 8. Konfigurasi Nginx (jika belum ada) ────────────────────
cd "$APP_DIR"
if [ ! -f "$NGINX_WEB_DEST" ]; then
  info "Salin Nginx config untuk $ENV_LABEL..."
  cp "$NGINX_WEB" "$NGINX_WEB_DEST"
  cp "$NGINX_API" "$NGINX_API_DEST"

  # Aktifkan jika belum
  [ -L "/etc/nginx/sites-enabled/$(basename $NGINX_WEB_DEST)" ] || \
    ln -s "$NGINX_WEB_DEST" "/etc/nginx/sites-enabled/"
  [ -L "/etc/nginx/sites-enabled/$(basename $NGINX_API_DEST)" ] || \
    ln -s "$NGINX_API_DEST" "/etc/nginx/sites-enabled/"

  nginx -t && systemctl reload nginx
  info "Nginx dikonfigurasi. Jalankan certbot untuk SSL:"
  if [[ "$ENV" == "dev" ]]; then
    echo "  certbot --nginx -d jemaat.purwandaru.com -d api.purwandaru.com"
  else
    echo "  certbot --nginx -d jemaat.gkjjakarta.org -d api.gkjjakarta.org"
  fi
else
  warn "Nginx config sudah ada di $NGINX_WEB_DEST, dilewati."
fi

# ── 9. Restart / Start PM2 ───────────────────────────────────
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
echo -e "${GREEN}✅  Deploy $ENV_LABEL selesai!${NC}"
echo "======================================================"
pm2 status
echo ""
echo "Cek log : pm2 logs gkjj-api"
echo "          pm2 logs gkjj-web"
if [[ "$ENV" == "dev" ]]; then
  echo "URL      : https://jemaat.purwandaru.com"
  echo "API      : https://api.purwandaru.com"
else
  echo "URL      : https://jemaat.gkjjakarta.org"
  echo "API      : https://api.gkjjakarta.org"
fi
echo ""
