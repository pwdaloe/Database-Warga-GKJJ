# Panduan Deploy — Database Warga GKJJ

**Target server:** VPS Ubuntu 22.04 LTS (Domainesia Cloud VPS Lite 2GB)  
**Frontend:** https://jemaat.gkjjakarta.org  
**API:**      https://api.gkjjakarta.org

---

## Sebelum Mulai — DNS

Sebelum setup VPS, arahkan dua subdomain ke IP VPS Anda di panel DNS domain:

| Subdomain | Tipe | Value |
|---|---|---|
| `jemaat` | A | IP address VPS |
| `api` | A | IP address VPS |

> DNS propagasi butuh 5–30 menit. Bisa cek dengan: `nslookup jemaat.gkjjakarta.org`

---

## Langkah 1 — Login ke VPS

```bash
ssh root@<IP_VPS>
```

---

## Langkah 2 — Jalankan Setup Script

Upload script atau clone repo langsung, lalu jalankan:

```bash
# Clone repo sementara untuk ambil script setup
git clone https://github.com/pwdaloe/Database-Warga-GKJJ.git /tmp/gkjj-setup
chmod +x /tmp/gkjj-setup/deploy/1-setup-vps.sh
bash /tmp/gkjj-setup/deploy/1-setup-vps.sh
```

Script ini akan menginstall secara otomatis:
- Node.js 22, npm, PM2
- PostgreSQL 16 (beserta database + user baru)
- Nginx, Certbot
- UFW Firewall (allow SSH, HTTP, HTTPS)
- Swap 2GB (buffer build Next.js)
- Clone repository ke `/var/www/gkjj`

Setelah selesai, credential database disimpan di `/root/gkjj-db-credentials.txt`.

---

## Langkah 3 — Buat File Environment

### 3a. API `.env`

```bash
cat /root/gkjj-db-credentials.txt   # Catat DATABASE_URL-nya
cp /var/www/gkjj/deploy/env.api.production /var/www/gkjj/apps/api/.env
nano /var/www/gkjj/apps/api/.env
```

Isi minimal ini:
```env
DATABASE_URL="postgresql://gkjj_db:<DB_PASS>@localhost:5432/gkjj_prod"
PORT=4000
NODE_ENV=production
JWT_SECRET="<hasil openssl rand -hex 32>"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://jemaat.gkjjakarta.org"
ENCRYPTION_KEY="<hasil openssl rand -hex 32>"
```

Generate nilai secret:
```bash
openssl rand -hex 32   # untuk JWT_SECRET
openssl rand -hex 32   # untuk ENCRYPTION_KEY (beda nilai!)
```

> ⚠️ Simpan `ENCRYPTION_KEY` di tempat aman. Jika hilang, data NIK tidak bisa didekripsi.

### 3b. Web `.env.local`

```bash
echo 'NEXT_PUBLIC_API_URL=https://api.gkjjakarta.org/api' \
  > /var/www/gkjj/apps/web/.env.local
```

---

## Langkah 4 — Deploy Aplikasi

```bash
bash /var/www/gkjj/deploy/2-deploy.sh
```

Script ini akan:
1. Pull kode terbaru dari GitHub
2. Install npm dependencies
3. Generate Prisma client + push schema
4. Seed master data (kelurahan Jakarta Timur + komisi)
5. Build API (TypeScript → JavaScript)
6. Build Next.js (dengan limit memori 1.4GB agar aman di VPS 2GB)
7. Start/restart PM2

> ⏳ Proses build pertama kali bisa 5–10 menit, terutama Next.js build.

Verifikasi aplikasi jalan:
```bash
pm2 status
pm2 logs gkjj-api --lines 20
pm2 logs gkjj-web --lines 20
```

---

## Langkah 5 — Konfigurasi Nginx

```bash
# Salin config
cp /var/www/gkjj/deploy/nginx-jemaat.conf /etc/nginx/sites-available/jemaat.gkjjakarta.org
cp /var/www/gkjj/deploy/nginx-api.conf    /etc/nginx/sites-available/api.gkjjakarta.org

# Aktifkan
ln -s /etc/nginx/sites-available/jemaat.gkjjakarta.org /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api.gkjjakarta.org    /etc/nginx/sites-enabled/

# Hapus default site
rm -f /etc/nginx/sites-enabled/default

# Test & reload
nginx -t && systemctl reload nginx
```

---

## Langkah 6 — SSL Certificate (Let's Encrypt)

```bash
# Issue sertifikat untuk kedua subdomain sekaligus
certbot --nginx -d jemaat.gkjjakarta.org -d api.gkjjakarta.org \
  --email admin@gkjjakarta.org --agree-tos --non-interactive

# Certbot otomatis menambahkan redirect HTTP→HTTPS ke config Nginx
nginx -t && systemctl reload nginx
```

Verifikasi auto-renewal:
```bash
certbot renew --dry-run
```

---

## Langkah 7 — Akun Admin Default

Setelah deploy, buat akun superadmin via Prisma Studio atau psql:

```bash
cd /var/www/gkjj/apps/api

# Buka Prisma Studio (akses dari browser: http://IP:5555)
npx prisma studio
```

Atau via seed script jika sudah ada default user di seed-master.ts.

> Login pertama: ubah password segera melalui menu Pengaturan Akun.

---

## Deployment Update (untuk versi baru)

Setiap ada update kode:

```bash
bash /var/www/gkjj/deploy/2-deploy.sh
```

Script sudah menangani: git pull → build → restart PM2 dengan zero-downtime reload.

---

## Monitoring & Troubleshooting

### Cek status
```bash
pm2 status                          # Status semua proses
pm2 monit                           # Dashboard real-time CPU/RAM
systemctl status nginx              # Status Nginx
systemctl status postgresql         # Status PostgreSQL
```

### Log aplikasi
```bash
pm2 logs gkjj-api --lines 50       # Log API
pm2 logs gkjj-web --lines 50       # Log Web
tail -f /var/log/nginx/error.log    # Log Nginx error
```

### Jika build gagal karena memory
```bash
# Tambah swap sementara
sudo fallocate -l 1G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Coba build lagi
bash /var/www/gkjj/deploy/2-deploy.sh

# Hapus swap tambahan setelah selesai
sudo swapoff /swapfile2
sudo rm /swapfile2
```

### Reset & rebuild
```bash
cd /var/www/gkjj
pm2 stop all
rm -rf apps/api/dist apps/web/.next node_modules
npm install --legacy-peer-deps
bash deploy/2-deploy.sh
```

---

## Ringkasan Port & Service

| Service | Port | Akses |
|---|---|---|
| Next.js (frontend) | 3000 | Internal only (via Nginx) |
| Express API | 4000 | Internal only (via Nginx) |
| PostgreSQL | 5432 | Internal only |
| Nginx HTTP | 80 | Publik → redirect HTTPS |
| Nginx HTTPS | 443 | Publik |
| Prisma Studio | 5555 | Buka manual saat dibutuhkan |

---

## Struktur File di VPS

```
/var/www/gkjj/           ← Root aplikasi
├── apps/api/
│   ├── .env             ← Env production (JANGAN commit!)
│   ├── dist/            ← Hasil build TypeScript
│   └── prisma/
├── apps/web/
│   ├── .env.local       ← Env production web
│   └── .next/           ← Hasil build Next.js
└── deploy/
    ├── 1-setup-vps.sh
    ├── 2-deploy.sh
    ├── ecosystem.config.cjs
    ├── nginx-jemaat.conf
    └── nginx-api.conf

/root/gkjj-db-credentials.txt   ← Credential DB (simpan aman!)
/etc/nginx/sites-available/      ← Nginx config
/etc/letsencrypt/                ← SSL certificates
```
