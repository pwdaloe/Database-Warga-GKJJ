#!/bin/bash
# =============================================================
# GKJJ — VPS Initial Setup Script
# Jalankan SEKALI sebagai root setelah VPS pertama kali aktif:
#   chmod +x 1-setup-vps.sh && sudo bash 1-setup-vps.sh
#
# Target: Ubuntu 22.04 LTS
# Frontend : jemaat.gkjjakarta.org  → localhost:3000
# API      : api.gkjjakarta.org     → localhost:4000
# =============================================================

set -euo pipefail

APP_DIR="/var/www/gkjj"
APP_USER="gkjj"
DB_NAME="gkjj_prod"
DB_USER="gkjj_db"
REPO_URL="https://github.com/pwdaloe/Database-Warga-GKJJ.git"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ── 1. Update sistem ──────────────────────────────────────────
info "Update & upgrade sistem..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Swap 2 GB (buffer untuk build Next.js) ─────────────────
if [ ! -f /swapfile ]; then
  info "Membuat swap 2 GB..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
  warn "Swap sudah ada, lewati."
fi

# ── 3. Node.js 22 ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Menginstall Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  warn "Node.js sudah ada: $(node --version)"
fi

# ── 4. PM2 ────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Menginstall PM2..."
  npm install -g pm2
else
  warn "PM2 sudah ada."
fi

# ── 5. PostgreSQL 16 ──────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Menginstall PostgreSQL 16..."
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
else
  warn "PostgreSQL sudah ada."
fi

# ── 6. Nginx ──────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  info "Menginstall Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
else
  warn "Nginx sudah ada."
fi

# ── 7. Certbot (Let's Encrypt SSL) ────────────────────────────
if ! command -v certbot &>/dev/null; then
  info "Menginstall Certbot..."
  apt-get install -y certbot python3-certbot-nginx
else
  warn "Certbot sudah ada."
fi

# ── 8. Utilitas tambahan ──────────────────────────────────────
apt-get install -y git curl wget unzip ufw -qq

# ── 9. Firewall ───────────────────────────────────────────────
info "Konfigurasi UFW firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── 10. User aplikasi ─────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  info "Membuat user sistem: $APP_USER..."
  useradd -m -s /bin/bash "$APP_USER"
fi

# ── 11. Direktori aplikasi ────────────────────────────────────
info "Menyiapkan direktori: $APP_DIR..."
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"

# ── 12. Database & user PostgreSQL ───────────────────────────
info "Menyiapkan database PostgreSQL..."
DB_PASS=$(openssl rand -hex 20)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# ── 13. Clone repository ──────────────────────────────────────
info "Clone repository..."
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  warn "Repository sudah ada di $APP_DIR"
fi

# ── 14. Simpan credential DB ──────────────────────────────────
CRED_FILE="/root/gkjj-db-credentials.txt"
cat > "$CRED_FILE" <<EOF
=== GKJJ Database Credentials ===
DB_NAME : $DB_NAME
DB_USER : $DB_USER
DB_PASS : $DB_PASS
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
Dibuat  : $(date)
EOF
chmod 600 "$CRED_FILE"

echo ""
echo "======================================================"
echo -e "${GREEN}✅  Setup dasar selesai!${NC}"
echo "======================================================"
echo ""
echo "📄 Credential database tersimpan di: $CRED_FILE"
echo ""
echo "LANGKAH SELANJUTNYA:"
echo "  1. Salin credential DB di atas, lalu:"
echo "     nano $APP_DIR/apps/api/.env"
echo "  2. Isi .env API & Web (lihat deploy/env.api.production)"
echo "  3. Jalankan: bash $APP_DIR/deploy/2-deploy.sh"
echo "  4. Salin Nginx config & issue SSL (lihat DEPLOY.md)"
echo ""
