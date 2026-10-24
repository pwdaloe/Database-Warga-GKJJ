#!/bin/bash
# =============================================================
# GKJJ — Deploy / update aplikasi KEGIATAN (kegiatan.gkjjakarta.org)
#
#   bash /var/www/gkjj/deploy/3-deploy-kegiatan.sh
#
# TIDAK menyentuh aplikasi jemaat (gkjj-api, gkjj-web) maupun database jemaat.
# Prasyarat pertama kali: lihat DEPLOY_KEGIATAN.md (database, .env, Nginx).
# =============================================================
set -euo pipefail

APP_DIR="/var/www/gkjj"
APP_USER="gkjj"
API_DIR="$APP_DIR/apps/kegiatan-api"
WEB_DIR="$APP_DIR/apps/kegiatan-web"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gkjj}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

cd "$APP_DIR"
[ -f "$API_DIR/.env" ] || error "$API_DIR/.env belum ada. Salin dari deploy/env.kegiatan-api.production dan isi."
[ -f "$WEB_DIR/.env.local" ] || error "$WEB_DIR/.env.local belum ada. Isi: echo 'NEXT_PUBLIC_API_URL=https://kegiatan.gkjjakarta.org/api' > $WEB_DIR/.env.local"
grep -q "GANTI" "$API_DIR/.env" && error "$API_DIR/.env masih berisi nilai GANTI."

# ── 1. Kode terbaru ───────────────────────────────────────────
info "Pull kode terbaru..."
chown -R "$APP_USER:$APP_USER" "$APP_DIR/.git"
sudo -u "$APP_USER" git checkout -- package-lock.json
sudo -u "$APP_USER" git pull origin main
VERSI="$(sudo -u "$APP_USER" git rev-parse --short HEAD)"
info "Versi: $VERSI"

# ── 2. Dependensi dan Prisma Client ───────────────────────────
info "Install dependensi..."
sudo -u "$APP_USER" npm install --legacy-peer-deps
sudo -u "$APP_USER" git checkout -- package-lock.json
cd "$API_DIR"
sudo -u "$APP_USER" npx prisma generate

# ── 3. Cadangan database kegiatan sebelum push skema ─────────
backup_database() {
  command -v pg_dump >/dev/null || error "pg_dump tidak ditemukan (apt install postgresql-client)"
  local url
  url="$(grep -E '^\s*DATABASE_URL\s*=' "$API_DIR/.env" | head -1 | sed -E 's/^\s*DATABASE_URL\s*=\s*//; s/^["'\'']|["'\'']$//g; s/\?.*$//')"
  [ -n "$url" ] || error "DATABASE_URL tidak ditemukan"
  install -d -m 700 "$BACKUP_DIR"
  local file="$BACKUP_DIR/gkjj_kegiatan_$(date +%Y%m%d_%H%M%S).dump"
  info "Backup database kegiatan ke $file ..."
  pg_dump "$url" --format=custom --no-owner --file="$file" || { rm -f "$file"; error "pg_dump gagal; deploy dibatalkan (database tidak diubah)."; }
  [ -s "$file" ] && pg_restore --list "$file" >/dev/null 2>&1 || { rm -f "$file"; error "Backup tidak valid; deploy dibatalkan."; }
  chmod 600 "$file"
  ls -1t "$BACKUP_DIR"/gkjj_kegiatan_*.dump 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm -f
  info "Backup OK ($(du -h "$file" | cut -f1))."
}
if [[ "${SKIP_BACKUP:-0}" == "1" ]]; then warn "SKIP_BACKUP=1: backup dilewati."; else backup_database; fi

# ── 4. Skema database ────────────────────────────────────────
# `db push` menolak (dan deploy berhenti) bila ada perubahan yang berisiko pada tabel berisi, misalnya menambah
# constraint unik. Jangan dipaksa dengan --accept-data-loss; terapkan SQL aditif secara manual lebih dulu (lihat DEPLOY.md).
info "Sync skema database kegiatan..."
sudo -u "$APP_USER" npx prisma db push

# ── 5. Seed master (idempoten; gagal = berhenti, bukan "dilewati") ──
info "Seed master kegiatan..."
sudo -u "$APP_USER" npx tsx prisma/seed.ts

# ── 6. Build ──────────────────────────────────────────────────
info "Build API..."
for d in "$API_DIR/dist" "$WEB_DIR/.next"; do [ -e "$d" ] && chown -R "$APP_USER:$APP_USER" "$d"; done
sudo -u "$APP_USER" npm run build
info "Build web (Next.js)..."
cd "$WEB_DIR"
sudo -u "$APP_USER" env NODE_OPTIONS="--max-old-space-size=1400" npm run build

# ── 7. PM2 (hanya proses kegiatan) ───────────────────────────
cd "$APP_DIR"
info "Restart proses kegiatan..."
if pm2 describe gkjj-kegiatan-api >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.kegiatan.config.cjs --update-env
else
  pm2 start deploy/ecosystem.kegiatan.config.cjs
fi
pm2 save

tunggu() {
  for _ in $(seq 1 30); do curl -fs -o /dev/null "$1" && return 0; sleep 1; done
  warn "$2 belum merespons setelah 30 detik (cek: pm2 logs $3)"
}
tunggu "http://127.0.0.1:4200/health" "API kegiatan" gkjj-kegiatan-api
tunggu "http://127.0.0.1:3200/login" "Web kegiatan" gkjj-kegiatan-web

echo ""
echo -e "${GREEN}✅ Deploy kegiatan selesai (versi $VERSI)${NC}"
pm2 status
echo "URL: https://kegiatan.gkjjakarta.org   (setelah blok Nginx dipasang)"
