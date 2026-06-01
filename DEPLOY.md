# Panduan Deploy — Database Warga GKJJ

**Server:** VPS Ubuntu 22.04 LTS (Domainesia Cloud VPS Lite 2GB)

| Environment | Frontend | API |
|---|---|---|
| **Testing** | https://jemaat.purwandaru.com | https://api.purwandaru.com |
| **Production** | https://jemaat.gkjjakarta.org | https://api.gkjjakarta.org |

> **Alur yang direkomendasikan:** Deploy ke Testing dulu → validasi semua fitur berjalan → baru migrasi ke Production. Migrasi hanya butuh 3 langkah tanpa rebuild.

---

## Struktur File Deploy

```
deploy/
├── 1-setup-vps.sh           ← Setup VPS sekali jalan (domain-agnostic)
├── 2-deploy.sh              ← Deploy/update: terima argumen dev|prod
├── ecosystem.config.cjs     ← PM2 config (domain-agnostic, port 3000 & 4000)
│
├── env.api.dev              ← Template .env API untuk testing (purwandaru.com)
├── env.api.production       ← Template .env API untuk production (gkjjakarta.org)
│
├── nginx-jemaat.dev.conf    ← Nginx frontend testing  → jemaat.purwandaru.com
├── nginx-jemaat.prod.conf   ← Nginx frontend production → jemaat.gkjjakarta.org
├── nginx-api.dev.conf       ← Nginx API testing  → api.purwandaru.com
└── nginx-api.prod.conf      ← Nginx API production → api.gkjjakarta.org
```

---

## Fase 1 — Setup VPS (Sekali Jalan)

### 1.1 — DNS Sebelum Mulai

Arahkan subdomain ke IP VPS di panel DNS domain masing-masing:

**purwandaru.com** (untuk testing):
| Subdomain | Tipe | Value |
|---|---|---|
| `jemaat` | A | IP address VPS |
| `api` | A | IP address VPS |

**gkjjakarta.org** (untuk production — bisa diatur belakangan):
| Subdomain | Tipe | Value |
|---|---|---|
| `jemaat` | A | IP address VPS |
| `api` | A | IP address VPS |

> DNS propagasi butuh 5–30 menit. Cek: `nslookup jemaat.purwandaru.com`

### 1.2 — Jalankan Setup Script

Login ke VPS:
```bash
ssh root@<IP_VPS>
```

Clone repo dan jalankan setup:
```bash
git clone https://github.com/pwdaloe/Database-Warga-GKJJ.git /tmp/gkjj-setup
chmod +x /tmp/gkjj-setup/deploy/1-setup-vps.sh
bash /tmp/gkjj-setup/deploy/1-setup-vps.sh
```

Script otomatis menginstall:
- Node.js 22, PM2
- PostgreSQL 16 + buat database `gkjj_prod`
- Nginx, Certbot (SSL)
- UFW Firewall (SSH, HTTP, HTTPS)
- Swap 2GB (buffer build Next.js)
- Clone repo ke `/var/www/gkjj`

Credential database tersimpan otomatis di `/root/gkjj-db-credentials.txt`.

---

## Fase 2 — Deploy Testing (purwandaru.com)

### 2.1 — Isi File Environment

**API `.env`:**
```bash
cat /root/gkjj-db-credentials.txt    # catat DATABASE_URL

cp /var/www/gkjj/deploy/env.api.dev /var/www/gkjj/apps/api/.env
nano /var/www/gkjj/apps/api/.env
```

Wajib diisi:
```env
DATABASE_URL="postgresql://gkjj_db:<DB_PASS>@localhost:5432/gkjj_prod"
JWT_SECRET="<openssl rand -hex 32>"
ENCRYPTION_KEY="<openssl rand -hex 32>"
CORS_ORIGIN="https://jemaat.purwandaru.com"
```

**Web `.env.local`:**
```bash
echo 'NEXT_PUBLIC_API_URL=https://api.purwandaru.com/api' \
  > /var/www/gkjj/apps/web/.env.local
```

Generate secret values:
```bash
openssl rand -hex 32   # untuk JWT_SECRET
openssl rand -hex 32   # untuk ENCRYPTION_KEY (nilai berbeda!)
```

### 2.2 — Deploy Aplikasi

```bash
bash /var/www/gkjj/deploy/2-deploy.sh dev
```

Script ini menjalankan:
1. `git pull` → kode terbaru
2. `npm install` → dependencies
3. `prisma generate` + `prisma db push` → sync schema
4. Seed master data (kelurahan Jakarta Timur + komisi)
5. Build API (TypeScript → JavaScript)
6. Build Next.js (`NODE_OPTIONS=--max-old-space-size=1400` untuk VPS 2GB)
7. Copy Nginx config + aktifkan symlink
8. Start/restart PM2

> ⏳ Build pertama kali bisa 5–10 menit.

### 2.3 — Issue SSL Certificate

```bash
certbot --nginx -d jemaat.purwandaru.com -d api.purwandaru.com \
  --email <email-anda> --agree-tos --non-interactive
```

Verifikasi:
```bash
nginx -t && systemctl reload nginx
pm2 status
```

Akses: **https://jemaat.purwandaru.com**

---

## Fase 3 — Validasi Testing

Checklist sebelum migrasi ke production:

- [ ] Login berhasil
- [ ] Tambah warga baru berhasil
- [ ] Import Excel berfungsi
- [ ] Kartu anggota QR tampil
- [ ] Halaman publik `/m/[id]` bisa diakses tanpa login
- [ ] Filter per kelompok untuk Penatua berfungsi
- [ ] Log aktivitas mencatat operasi
- [ ] SSL hijau di browser (tidak ada warning)

---

## Fase 4 — Migrasi ke Production (gkjjakarta.org)

Setelah testing OK, migrasi ke production **tanpa rebuild** — hanya 3 langkah:

### 4.1 — Update file environment

```bash
# Update CORS_ORIGIN di .env API
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN="https://jemaat.gkjjakarta.org"|' \
  /var/www/gkjj/apps/api/.env

# Ganti NEXT_PUBLIC_API_URL
echo 'NEXT_PUBLIC_API_URL=https://api.gkjjakarta.org/api' \
  > /var/www/gkjj/apps/web/.env.local
```

### 4.2 — Aktifkan Nginx config production

```bash
# Nonaktifkan config testing
rm /etc/nginx/sites-enabled/jemaat.purwandaru.com
rm /etc/nginx/sites-enabled/api.purwandaru.com

# Aktifkan config production
cp /var/www/gkjj/deploy/nginx-jemaat.prod.conf \
   /etc/nginx/sites-available/jemaat.gkjjakarta.org
cp /var/www/gkjj/deploy/nginx-api.prod.conf \
   /etc/nginx/sites-available/api.gkjjakarta.org

ln -s /etc/nginx/sites-available/jemaat.gkjjakarta.org \
      /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api.gkjjakarta.org \
      /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

### 4.3 — Issue SSL untuk domain production

```bash
certbot --nginx -d jemaat.gkjjakarta.org -d api.gkjjakarta.org \
  --email <email-anda> --agree-tos --non-interactive
```

### 4.4 — Rebuild web (diperlukan karena NEXT_PUBLIC_* baked saat build)

```bash
cd /var/www/gkjj/apps/web
sudo -u gkjj env NODE_OPTIONS="--max-old-space-size=1400" npm run build
pm2 reload deploy/ecosystem.config.cjs --update-env
```

> `NEXT_PUBLIC_*` di-bake ke dalam bundle saat `next build`, sehingga rebuild web diperlukan saat URL berubah. API tidak perlu rebuild — cukup `pm2 reload`.

---

## Update Kode (Rutin)

Setiap ada update kode dari GitHub:

```bash
# Di environment yang aktif (dev atau prod)
bash /var/www/gkjj/deploy/2-deploy.sh dev    # atau prod
```

---

## Monitoring & Troubleshooting

### Cek status
```bash
pm2 status                         # semua proses
pm2 monit                          # dashboard CPU/RAM real-time
systemctl status nginx postgresql  # service OS
```

### Log aplikasi
```bash
pm2 logs gkjj-api --lines 50
pm2 logs gkjj-web --lines 50
tail -f /var/log/nginx/error.log
```

### Build gagal karena memory
```bash
# Tambah swap sementara
fallocate -l 1G /swapfile2 && chmod 600 /swapfile2
mkswap /swapfile2 && swapon /swapfile2

bash /var/www/gkjj/deploy/2-deploy.sh dev   # coba lagi

# Bersihkan setelah selesai
swapoff /swapfile2 && rm /swapfile2
```

### Reset & rebuild penuh
```bash
pm2 stop all
rm -rf /var/www/gkjj/apps/api/dist \
       /var/www/gkjj/apps/web/.next \
       /var/www/gkjj/node_modules
bash /var/www/gkjj/deploy/2-deploy.sh dev
```

---

## Ringkasan Port & Service

| Service | Port | Akses |
|---|---|---|
| Next.js (frontend) | 3000 | Internal — via Nginx |
| Express API | 4000 | Internal — via Nginx |
| PostgreSQL | 5432 | Internal only |
| Nginx HTTP | 80 | Publik → redirect HTTPS |
| Nginx HTTPS | 443 | Publik |

---

## File Penting di VPS

```
/var/www/gkjj/apps/api/.env          ← Env production (JANGAN commit!)
/var/www/gkjj/apps/web/.env.local    ← Env web production
/root/gkjj-db-credentials.txt        ← Credential DB (simpan aman!)
/etc/letsencrypt/                     ← SSL certificates
```
