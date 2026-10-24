# Panduan Deploy — Database Warga GKJJ

**Server:** VPS Ubuntu 24.04 LTS (Domainesia Cloud VPS: 3 CPU core, 4 GB RAM, 60 GB disk; dikonfirmasi 24 Okt 2026, dulu tertulis 2 GB)

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
├── nginx-landing.prod.conf  ← Nginx 3 landing statis (my, kegiatan, majelis) → lihat LANDING_CERTBOT.md
├── nginx-default.prod.conf  ← Nginx penangkap host tidak dikenal (opsional)
├── landing/                 ← templat HTML + render.sh untuk halaman "sedang disiapkan"
├── LANDING_CERTBOT.md       ← langkah pasang landing + certbot + rollback
│
├── nginx-jemaat.dev.conf    ← Nginx frontend testing  → jemaat.purwandaru.com
├── nginx-jemaat.prod.conf   ← Nginx frontend production → jemaat.gkjjakarta.org
├── nginx-api.dev.conf       ← Nginx API testing  → api.purwandaru.com
└── nginx-api.prod.conf      ← Nginx API production → api.gkjjakarta.org
```

> Peta domain, port, dan aturan menambah aplikasi baru: [`docs/PLATFORM.md`](docs/PLATFORM.md). `2-deploy.sh` saat ini hanya untuk aplikasi jemaat (`jemaat` dan `api`); landing statis dipasang terpisah lewat `deploy/LANDING_CERTBOT.md`.

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
0. Buat flag *maintenance* (pengguna melihat bar "Pembaruan sistem sedang berlangsung")
1. `git pull` → kode terbaru
2. `npm install` → dependencies
3. `prisma generate`
4. **Backup database (`pg_dump`)** → `/var/backups/gkjj/gkjj_<env>_<waktu>.dump`
5. `prisma db push` → sync schema
6. Seed master data (kelurahan Jakarta Timur + komisi)
7. Build API (TypeScript → JavaScript)
8. Build Next.js (`NODE_OPTIONS=--max-old-space-size=1400`; batas heap dipertahankan agar build tidak merebut memori proses yang berjalan)
9. Copy Nginx config + aktifkan symlink
10. Start/restart PM2
11. Tunggu aplikasi siap → tulis versi baru → hapus flag (pengguna melihat bar "Versi baru tersedia")

#### Notifikasi pembaruan ke pengguna

Script deploy memberi tahu pengguna yang sedang membuka aplikasi:
- **Awal deploy** → membuat flag `/var/www/gkjj/.deploy/maintenance` → bar kuning *"Pembaruan sistem sedang berlangsung…"*.
- **Akhir deploy** (setelah PM2 restart dan `/health` + `/login` merespons) → menulis `/var/www/gkjj/.deploy/version` (git SHA) lalu menghapus flag → tab lama melihat bar *"Versi baru tersedia. Muat ulang"*.
- Flag selalu dihapus (`trap`) walau deploy gagal atau dibatalkan Ctrl+C; API juga mengabaikan flag yang lebih tua dari 30 menit. Jika bar kuning menempel padahal tidak ada deploy: `rm -f /var/www/gkjj/.deploy/maintenance`.
- Folder `.deploy/` tidak masuk git (`.gitignore`). Cek status manual: `curl -s https://api.gkjjakarta.org/api/system/status`.

#### Backup otomatis sebelum `db push`

- Dibuat dari `DATABASE_URL` di `apps/api/.env`, format custom (`pg_dump -Fc`), izin `600` di folder `700`.
- **Jika backup gagal, deploy dibatalkan** sebelum database diubah. Kegagalan umum: `pg_dump` belum terpasang (`apt install postgresql-client`) atau versi `pg_dump` lebih lama dari server PostgreSQL.
- 14 backup terbaru per environment disimpan, sisanya dihapus otomatis (`BACKUP_KEEP=30 bash ... prod` untuk mengubah). Folder dapat diganti lewat `BACKUP_DIR`.
- Lewati hanya jika benar-benar perlu: `SKIP_BACKUP=1 bash /var/www/gkjj/deploy/2-deploy.sh prod`.
- Cara memulihkan (ke database kosong/yang sama):
  ```bash
  pg_restore --clean --if-exists --no-owner -d gkjj_prod /var/backups/gkjj/gkjj_prod_YYYYMMDD_HHMMSS.dump
  ```
- Backup berada di server yang sama dengan database, jadi **salin berkala ke luar VPS** (mis. `scp` ke Mac) untuk perlindungan dari kegagalan disk/VPS.

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
- [ ] Halaman publik `/m/[token]` bisa diakses tanpa login (QR kartu memakai token acak, bukan id)
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

---

## Catatan Rilis Khusus: Sprint 13 (token QR kartu anggota)

Rilis ini menambah kolom `warga.qr_token` dan mengubah URL QR dari `/m/{id}` menjadi `/m/{token}`. Bersifat **menambah** (tidak menghapus kolom), tetapi menyentuh tabel `warga` (1.183 baris), jadi ikuti urutan ini.

**Sebelum deploy**

1. PostgreSQL produksi harus **13 atau lebih baru** (default kolom memakai `gen_random_uuid()` bawaan): `psql -c "SHOW server_version;"` (sebagai user DB). Jika lebih lama, hentikan dan hubungi pengembang.
2. Deploy di jam sepi (seperti biasa). Backup `pg_dump` otomatis oleh `2-deploy.sh` tetap berjalan.
3. Tentukan sikap terhadap tautan lama `/m/{id}`: **default mati** (env tidak diisi). Hanya bila ada kartu cetak atau tautan WhatsApp yang masih harus berfungsi, set `QR_ALLOW_LEGACY_ID=true` di `apps/api/.env` sementara.

**Langkah A: jalankan SQL migrasi SEBELUM `2-deploy.sh prod` (wajib)**

`prisma db push` (dipakai skrip deploy) **menolak** menambah constraint unik pada tabel berisi tanpa `--accept-data-loss` (peringatan "A unique constraint ... will be added"); diuji di database sementara berisi 1.183 baris. Tanpa langkah ini deploy berhenti di langkah 4 (sebelum build dan restart, jadi aplikasi lama tetap berjalan, tetapi deploy gagal). Karena itu SQL aditif dijalankan manual lebih dulu, seperti CHECK constraint dan DROP `nomor_sidi` sebelumnya. **Aman saat aplikasi lama masih berjalan**:

```bash
# di VPS, sebagai user yang punya akses DB (cadangan manual opsional: pg_dump -Fc -f /var/backups/gkjj/pra_qr.dump <nama_db>)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /var/www/gkjj/apps/api/prisma/migrations/20261024100000_warga_qr_token/migration.sql
psql "$DATABASE_URL" -c "SELECT count(*) AS total, count(DISTINCT qr_token) AS unik, bool_and(qr_token ~ '^[0-9a-f]{32}$') AS format_ok FROM warga;"
# total = unik, format_ok = t
```

(`DATABASE_URL` tanpa `?schema=public` bila `psql` menolak parameter itu.) PostgreSQL mengisi **setiap baris lama dengan token unik** saat itu juga (tanpa skrip backfill) dan menulis ulang tabel sebentar, hitungan detik untuk ±1.200 baris. Aplikasi lama mengabaikan kolom baru dan INSERT-nya otomatis mendapat token dari default.

**Langkah B: deploy seperti biasa** (`bash deploy/2-deploy.sh prod`). `db push` kini melaporkan "already in sync" dan tidak meminta apa pun; jika ia masih meminta `--accept-data-loss`, **hentikan** dan periksa apa yang diubah, jangan memaksa.

**Sesudah deploy** (baca-saja)

```bash
npm run db:integritas --workspace=apps/api
curl -s -o /dev/null -w "%{http_code}\n" https://api.gkjjakarta.org/api/public/member/123   # 404 (id lama mati)
```

Lalu buka Kartu Anggota, pindai QR salah satu warga uji dengan kamera HP, dan pastikan halaman kartu terbuka.

**Catatan operasional**

- Kartu atau tautan WhatsApp yang dibuat **sebelum** rilis berhenti berfungsi (tampil "Kartu Tidak Tersedia"). Kirim ulang tautan lewat **Kirim via WhatsApp** bila perlu.
- Token ada di URL, jadi tercatat di **log akses Nginx** (`/var/log/nginx/access.log`) untuk `jemaat.gkjjakarta.org`/`api.gkjjakarta.org`. Log aplikasi (PM2) sudah menyamarkannya menjadi `[token]`. Batasi akses baca log Nginx ke root, dan buat ulang QR warga bila token diduga bocor.
- Seed master di langkah deploy: sebelum perbaikan seed (24 Okt) langkah ini selalu gagal dengan "PrismaClient was instantiated without any options" dan ditampilkan keliru sebagai "Seed dilewati (data sudah ada)". Sesudahnya pesan "already seeded ... skipping" berarti data sudah ada; pesan "Seed master GAGAL" berarti error sungguhan.
- Rollback: kembalikan kode (`git revert`); kolom `qr_token` boleh dibiarkan. Untuk menghidupkan tautan lama sementara tanpa deploy: `QR_ALLOW_LEGACY_ID=true` lalu `pm2 reload gkjj-api --update-env`.
