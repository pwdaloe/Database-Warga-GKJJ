# Memasang kegiatan.gkjjakarta.org di VPS

Memasang aplikasi **Kegiatan** (web :3200, API :4200, database `gkjj_kegiatan`) menggantikan halaman "sedang disiapkan". **Aplikasi jemaat (`jemaat`, `api`) dan databasenya tidak disentuh.** Jalankan di VPS sebagai `root`, satu langkah demi satu, dan tempel hasilnya bila ada yang janggal.

Prasyarat yang sudah terpenuhi: DNS dan sertifikat SSL `kegiatan.gkjjakarta.org` (dibuat saat landing dipasang), Nginx 1.24, PostgreSQL 16, memori 4 GB (build satu per satu).

## 0. Persiapan (baca-saja)

```bash
cd /var/www/gkjj && sudo -u gkjj git pull origin main
git log --oneline -1                                        # versi yang berisi folder apps/kegiatan-api
free -m | head -2                                            # tersedia > 1,5 GB sebelum build
pm2 status                                                   # gkjj-api, gkjj-web, gkj-klasis online
ls /etc/letsencrypt/live/kegiatan.gkjjakarta.org/            # fullchain.pem dan privkey.pem ada
```

## 1. Database dan pengguna DB sendiri

Pengguna DB terpisah dari aplikasi jemaat, supaya kebocoran satu aplikasi tidak membuka yang lain.

```bash
DBPASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"; echo "$DBPASS"      # CATAT, dipakai di langkah 2
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE gkjj_kegiatan LOGIN PASSWORD '$DBPASS';
CREATE DATABASE gkjj_kegiatan OWNER gkjj_kegiatan;
SQL
sudo -u postgres psql -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'gkjj%'"
```

## 2. Berkas lingkungan (.env)

```bash
cd /var/www/gkjj
cp deploy/env.kegiatan-api.production apps/kegiatan-api/.env
JWT="$(openssl rand -hex 32)"
sed -i "s|GANTI_PASSWORD_DB|$DBPASS|; s|JWT_SECRET=\"GANTI\"|JWT_SECRET=\"$JWT\"|" apps/kegiatan-api/.env
nano apps/kegiatan-api/.env        # isi SEED_ADMIN_PASSWORD (min. 12 karakter, CATAT), periksa tidak ada "GANTI" tersisa
chown gkjj:gkjj apps/kegiatan-api/.env && chmod 600 apps/kegiatan-api/.env
echo 'NEXT_PUBLIC_API_URL=https://kegiatan.gkjjakarta.org/api' > apps/kegiatan-web/.env.local
chown gkjj:gkjj apps/kegiatan-web/.env.local
grep -c GANTI apps/kegiatan-api/.env          # harus 0
```

## 3. Deploy aplikasi (belum terlihat publik)

```bash
bash deploy/3-deploy-kegiatan.sh
```

Yang terjadi: pull, install, backup DB kegiatan, `db push` (database kosong → membuat semua tabel), seed master (16 unit, pagu, BPH, visi-misi, 46 program 2026), build API dan web, PM2 `gkjj-kegiatan-api` dan `gkjj-kegiatan-web`. Tempel keluaran bagian akhir. Cek lokal:

```bash
curl -s http://127.0.0.1:4200/health; echo
curl -s -o /dev/null -w "web: %{http_code}\n" http://127.0.0.1:3200/login
pm2 status
```

## 4. Mengalihkan domain dari landing ke aplikasi

Aman bila berurutan; `jemaat`, `api`, `my`, `majelis` tidak berubah.

```bash
cd /var/www/gkjj
bash deploy/ganti-landing.sh kegiatan.gkjjakarta.org          # cadangkan + buang blok landing domain ini
cp deploy/nginx-kegiatan.prod.conf /etc/nginx/sites-available/kegiatan.gkjjakarta.org
ln -sf /etc/nginx/sites-available/kegiatan.gkjjakarta.org /etc/nginx/sites-enabled/
nginx -t
```

**Lanjutkan hanya bila `nginx -t` lulus.** Bila gagal: `cp /etc/nginx/sites-available/landing.gkjjakarta.org.bak.<waktu> /etc/nginx/sites-available/landing.gkjjakarta.org` dan `rm /etc/nginx/sites-enabled/kegiatan.gkjjakarta.org`, lalu tempel pesannya.

```bash
systemctl reload nginx
curl -s https://kegiatan.gkjjakarta.org/health; echo
curl -sI https://kegiatan.gkjjakarta.org/login | head -n 3
for d in jemaat api my majelis; do printf "$d: "; curl -s -o /dev/null -w "%{http_code}\n" https://$d.gkjjakarta.org; done
```

Hasil: `health` ok, login 200, dan domain lain tetap normal. Buka `https://kegiatan.gkjjakarta.org` di browser.

## 5. Langkah pertama sebagai admin

1. Masuk dengan username `admin` dan `SEED_ADMIN_PASSWORD`; sistem meminta password baru.
2. **Master → Tahun & jendela**: periksa tanggal; status pengajuan masih **Belum dibuka**.
3. **Master → Unit & pagu**: periksa 14 UPK + 2 pos, bidang tiap unit (pemetaan awal adalah usulan), dan pagu (sementara = angka 2026). Isi pagu pos Penatalayanan.
4. **Master → Visi & misi**: periksa; ganti bila ada dokumen misi/renstra.
5. **Master → Pengurus (BPH)**: ganti nama contoh dengan Ketua, Sekretaris, Bendahara sebenarnya (nama, WhatsApp, email).
6. **Akun**: buat akun untuk tiap pengurus yang akan mengisi; kirim password sementara lewat WhatsApp (muncul sekali). Buat juga akun Majelis dan Koordinator bidang bila perlu.
7. Uji dengan satu UPK dahulu (pilot), baru **buka pengajuan** pada tanggal yang disepakati (Master → Tahun & jendela → Status: Dibuka).

Hapus `SEED_ADMIN_PASSWORD` dari `apps/kegiatan-api/.env` setelah seed pertama (tidak dipakai lagi, tidak menimpa admin yang sudah ada).

## Pembaruan berikutnya

`bash deploy/3-deploy-kegiatan.sh` (backup otomatis, `db push` berhenti bila ada perubahan berisiko; jangan dipaksa, lihat catatan di `DEPLOY.md` tentang SQL aditif manual).

## Rollback

```bash
# kembalikan domain ke landing
rm -f /etc/nginx/sites-enabled/kegiatan.gkjjakarta.org
cp /etc/nginx/sites-available/landing.gkjjakarta.org.bak.<waktu> /etc/nginx/sites-available/landing.gkjjakarta.org
nginx -t && systemctl reload nginx
# hentikan aplikasi (data database tetap ada)
pm2 delete gkjj-kegiatan-api gkjj-kegiatan-web && pm2 save
```

Pulihkan database dari cadangan: `pg_restore --clean --if-exists --no-owner -d gkjj_kegiatan /var/backups/gkjj/gkjj_kegiatan_<waktu>.dump`.

## Catatan

- Jalankan ulang `deploy/landing/render.sh` **tidak** mengembalikan `kegiatan` ke landing di Nginx; hanya membuat ulang berkas HTML. Gunakan langkah rollback di atas.
- Token login disimpan di browser (`localStorage`, kunci `kegiatan_token`), terpisah dari aplikasi jemaat. Akun kegiatan **tidak** sama dengan akun jemaat sampai SSO dibangun (`docs/PLATFORM.md` P1).
- Cadangan: `/var/backups/gkjj/gkjj_kegiatan_*.dump` (14 terbaru). Disarankan cadangan harian terjadwal selama jendela pengisian berlangsung.
