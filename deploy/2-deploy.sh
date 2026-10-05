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
# Repo harus milik $APP_USER; kalau pernah di-pull sebagai root, objek git jadi
# milik root dan pull berikutnya gagal ("insufficient permission ... .git/objects").
chown -R "$APP_USER:$APP_USER" "$APP_DIR/.git"
# 'npm install' menulis ulang package-lock.json di server, yang membuat 'git pull'
# berikutnya menolak (local changes would be overwritten). Buang perubahan itu dulu.
sudo -u "$APP_USER" git checkout -- package-lock.json
sudo -u "$APP_USER" git pull origin main

# ── 2. Install dependencies ───────────────────────────────────
info "Install npm dependencies..."
sudo -u "$APP_USER" npm install --legacy-peer-deps
# Kembalikan lockfile agar working tree tetap bersih untuk deploy berikutnya
sudo -u "$APP_USER" git checkout -- package-lock.json

# ── 3. Generate Prisma Client ─────────────────────────────────
info "Generate Prisma client..."
cd "$APP_DIR/apps/api"
sudo -u "$APP_USER" npx prisma generate

# ── 3b. Backup database sebelum push schema ──────────────────
# Backup selalu dibuat sebelum 'prisma db push' (bisa mengubah/menghapus kolom).
# Deploy DIBATALKAN jika backup gagal. Lewati dengan: SKIP_BACKUP=1 bash 2-deploy.sh prod
# Hasil: $BACKUP_DIR/gkjj_<env>_<waktu>.dump (format custom, pulihkan dengan pg_restore).
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gkjj}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"

backup_database() {
  command -v pg_dump >/dev/null    || error "pg_dump tidak ditemukan. Install: apt install postgresql-client (atau SKIP_BACKUP=1 untuk melewati)"
  command -v pg_restore >/dev/null || error "pg_restore tidak ditemukan (paket postgresql-client)"

  # Baca DATABASE_URL dari apps/api/.env → variabel PG* (password tidak muncul di daftar proses).
  # Parameter query Prisma seperti ?schema=public dibuang karena tidak dikenal libpq.
  local pg_env
  pg_env="$(ENV_FILE="$APP_DIR/apps/api/.env" node -e '
    const fs = require("fs");
    const line = fs.readFileSync(process.env.ENV_FILE, "utf8").split("\n").find((l) => /^\s*DATABASE_URL\s*=/.test(l));
    if (!line) { console.error("DATABASE_URL tidak ditemukan"); process.exit(1); }
    const raw = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim().replace(/^["\x27]|["\x27]$/g, "");
    const u = new URL(raw);
    const q = (v) => "\x27" + String(v).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
    console.log("export PGHOST=" + q(u.hostname || "localhost"));
    console.log("export PGPORT=" + q(u.port || "5432"));
    console.log("export PGUSER=" + q(decodeURIComponent(u.username)));
    console.log("export PGPASSWORD=" + q(decodeURIComponent(u.password)));
    console.log("export PGDATABASE=" + q(decodeURIComponent(u.pathname.replace(/^\//, ""))));
  ')" || error "Gagal membaca DATABASE_URL dari apps/api/.env"

  install -d -m 700 "$BACKUP_DIR"
  local file="$BACKUP_DIR/gkjj_${ENV}_$(date +%Y%m%d_%H%M%S).dump"

  info "Backup database ke $file ..."
  # subshell: variabel PG* tidak bocor ke langkah lain
  ( eval "$pg_env"; pg_dump --format=custom --no-owner --file="$file" ) \
    || { rm -f "$file"; error "pg_dump gagal — deploy dibatalkan (database tidak diubah)."; }

  # Verifikasi: file tidak kosong dan terbaca oleh pg_restore
  [ -s "$file" ] && pg_restore --list "$file" >/dev/null 2>&1 \
    || { rm -f "$file"; error "Backup tidak valid — deploy dibatalkan (database tidak diubah)."; }

  chmod 600 "$file"
  info "Backup OK ($(du -h "$file" | cut -f1)). Pulihkan dengan: pg_restore --clean --if-exists --no-owner -d <nama_db> $file"

  # Simpan $BACKUP_KEEP backup terbaru per environment
  ls -1t "$BACKUP_DIR"/gkjj_"${ENV}"_*.dump 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm -f
}

if [[ "${SKIP_BACKUP:-0}" == "1" ]]; then
  warn "SKIP_BACKUP=1 — backup database DILEWATI."
else
  backup_database
fi

# ── 4. Push schema ke database ───────────────────────────────
info "Sync schema database..."
sudo -u "$APP_USER" npx prisma db push

# ── 5. Seed master data (skip jika sudah ada) ─────────────────
info "Seed master data (kelurahan & komisi)..."
sudo -u "$APP_USER" npx tsx prisma/seed-master.ts || warn "Seed dilewati (data sudah ada)"

# PM2 berjalan sebagai root, sehingga Next.js (runtime) menulis cache ke .next sebagai root.
# Build dijalankan sebagai $APP_USER dan gagal (EACCES unlink) jika masih ada file milik root.
for d in "$APP_DIR/apps/web/.next" "$APP_DIR/apps/api/dist"; do
  [ -e "$d" ] && chown -R "$APP_USER:$APP_USER" "$d"
done

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

# ── 9. Restart / Start PM2 (selalu dari root) ────────────────
info "Restart aplikasi via PM2..."
cd "$APP_DIR"
# Pastikan daemon PM2 milik gkjj tidak ikut berjalan (konflik port).
# Hanya di-kill jika memang sedang berjalan — "pm2 kill" tanpa daemon justru
# men-spawn daemon baru dulu baru mematikannya (output berisik & tidak perlu).
if pgrep -u "$APP_USER" -f "PM2 .*God Daemon" >/dev/null 2>&1; then
  warn "Daemon PM2 milik $APP_USER terdeteksi, dimatikan (PM2 harus berjalan dari root)..."
  sudo -u "$APP_USER" pm2 kill || true
fi
if pm2 list | grep -q "gkjj-"; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
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
