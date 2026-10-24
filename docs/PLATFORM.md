# Peta Platform GKJ Jakarta

Satu repositori (monorepo) menaungi beberapa aplikasi di bawah domain `gkjjakarta.org`. Dokumen ini adalah **sumber kebenaran** untuk: domain mana ke aplikasi mana, port, nama proses, dan aturan menambah aplikasi baru. Perbarui dokumen ini setiap kali ada domain atau aplikasi yang berubah status.

*Diperbarui 24 Oktober 2026.*

## 1. Peta domain

| Domain | Fungsi | Pengguna | Aplikasi di repo | Web / API (port lokal dan VPS) | Status |
|---|---|---|---|---|---|
| `jemaat.gkjjakarta.org` | Database warga jemaat: entry data, validasi, kartu, perpindahan | Staf, Penatua, Majelis, Jemaat | `apps/web` | 3000 | ✅ Produksi (dipakai entry data) |
| `api.gkjjakarta.org` | API aplikasi jemaat dan **penerbit identitas (login)** | Aplikasi di atas | `apps/api` | 4000 | ✅ Produksi |
| `my.gkjjakarta.org` | Portal jemaat: informasi ibadah, kegiatan, renungan, layanan; nanti area "Saya" | Publik, lalu jemaat yang masuk | `apps/portal` (belum dibuat) | 3100 (SSR; membaca `api`, tanpa API sendiri) | 🟡 Landing "sedang disiapkan"; sprint 13–17 |
| `kegiatan.gkjjakarta.org` | Perencanaan program kerja dan anggaran UPK (RKA), dashboard pagu vs pengajuan; kelak monitoring dan pelaporan | Pengurus UPK, sekretariat, majelis | `apps/kegiatan-web` :3200, `apps/kegiatan-api` :4200 (API di jalur `/api` pada domain yang sama) | 3200 / 4200 | 🟢 **Sprint K1 selesai di lokal (24 Okt)**; belum dipasang di VPS. Rencana: `docs/kegiatan/RENCANA_MVP_MUKER_2026.md`; pemasangan: `deploy/DEPLOY_KEGIATAN.md` |
| `majelis.gkjjakarta.org` | Notula rapat MPH dan MPL | Majelis | `apps/majelis-web`, `apps/majelis-api` (belum dibuat) | 3300 / 4300 | 🟡 Landing; dokumentasi menyusul |
| `www.gkjjakarta.org` | Situs gereja (WordPress) | Publik | di luar repo ini | — | Tidak diubah. Cukup menaruh tautan ke `my` |

Rencana lama `www.gkjjakarta.org/new` **dibatalkan** (24 Okt 2026): portal jemaat memakai `my.gkjjakarta.org`. Akibatnya tidak ada lagi `basePath`, tidak ada perubahan Nginx pada `www`, dan WordPress tidak perlu disentuh.

Halaman "sedang disiapkan" untuk tiga domain baru: `deploy/landing/` dan `deploy/LANDING_CERTBOT.md`. **Terpasang di VPS produksi sejak 24 Okt 2026** (IP `202.155.95.183`, Nginx 1.24, sertifikat per domain, penangkap `default_server` aktif). `www.gkjjakarta.org` tidak berada di VPS ini.

## 2. Prinsip struktur

1. **Satu produk = satu pasang web dan API** (konsep frontend dan backend API dipertahankan). Pengecualian: `portal` hanya web (SSR) karena kontennya publik dan dibaca dari `api`.
2. **Isolasi dari produksi data warga.** Sistem jemaat sedang dipakai entry data. Produk baru punya proses PM2, port, `.env`, dan database logisnya sendiri, supaya bug atau deploy di sana tidak menjatuhkan `jemaat`.
3. **Yang dibagi hanya yang memang sama**, lewat `packages/*`: tipe, verifikasi login. Jangan membagi tabel atau model data antarproduk; antarproduk berbicara lewat API.
4. **Nama konsisten** (tabel di bagian 3), supaya skrip deploy, Nginx, dan dokumen bisa dibuat dari pola, bukan dari ingatan.
5. **Jangan membuat paket atau folder sebelum dipakai** (misalnya `packages/auth` baru dibuat saat aplikasi kedua benar-benar butuh).

## 3. Konvensi penamaan

| Hal | Pola | Contoh |
|---|---|---|
| Workspace | `apps/<produk>-web`, `apps/<produk>-api` (portal: `apps/portal`) | `apps/kegiatan-api` |
| Proses PM2 | `gkjj-<produk>-<web\|api>` | `gkjj-kegiatan-api` |
| Port (web / API) | jemaat 3000/4000, portal 3100, kegiatan 3200/4200, majelis 3300/4300 | |
| File Nginx | `deploy/nginx-<subdomain>.prod.conf` | `nginx-kegiatan.prod.conf` |
| Env | `apps/<workspace>/.env` (API), `.env.local` (web); template di `deploy/env.<workspace>.<env>` | |
| Dokumen produk | `docs/<produk>/` (`RENCANA.md`, `ARSITEKTUR.md`, panduan) | `docs/majelis/` |
| Sprint | satu urutan bersama `sprints/sprint_NN.md`; judul diawali tag produk | `Sprint 18 [kegiatan] ...` |
| Commit | gaya yang ada, dengan lingkup produk | `feat(kegiatan): ...` |

Berkas `apps/web` dan `apps/api` **tidak diganti nama** menjadi `jemaat-*`: biayanya (skrip deploy, PM2, impor, dokumen) lebih besar daripada manfaatnya. Cukup dikenali sebagai produk "jemaat".

## 4. Struktur repositori (target)

```
apps/
├── api/              # jemaat — API (ada)            :4000
├── web/              # jemaat — web (ada)            :3000
├── portal/           # my     — web SSR              :3100   (Sprint 14)
├── kegiatan-api/     # kegiatan                      :4200   (belum)
├── kegiatan-web/     #                               :3200   (belum)
├── majelis-api/      # majelis                       :4300   (belum)
└── majelis-web/      #                               :3300   (belum)
packages/
├── types/            # tipe bersama (ada)
└── auth/             # verifikasi token + peran bersama (dibuat saat aplikasi kedua butuh)
deploy/
├── 1-setup-vps.sh, 2-deploy.sh, ecosystem.config.cjs   # jemaat (ada)
├── nginx-<subdomain>.<env>.conf                        # satu berkas per domain
├── landing/                                            # halaman "sedang disiapkan"
└── LANDING_CERTBOT.md
docs/
├── PLATFORM.md       # dokumen ini
├── <produk>/         # dokumen per produk
└── desain-portal/
sprints/
```

## 5. Kapasitas VPS (dikonfirmasi 24 Okt 2026)

Server: Ubuntu 24.04, **3 CPU core, 4 GB RAM, 60 GB disk** (terukur `free -m`: total ±3.915 MB). Dokumen lama menyebut 2 GB; itu salah.

Pemakaian nyata saat idle (24 Okt, sesudah deploy): terpakai ±1.135 MB, tersedia ±2.779 MB. Rinciannya: `gkjj-api` ±121 MB, `gkjj-web` ±207 MB, `gkj-klasis` ±38 MB, sisanya (±770 MB) sistem operasi, PostgreSQL, dan Nginx.

Perkiraan kasar bila semua produk hidup (anggap tiap Next ±200 MB dan tiap API ±120 MB, seperti yang ada sekarang; angka sebenarnya harus diukur):

| Komponen | Idle |
|---|---|
| Sekarang (OS, PostgreSQL, Nginx, jemaat, klasis) | ±1.135 MB |
| `portal` (Next) | +200 MB |
| `kegiatan` (web + API) | +320 MB |
| `majelis` (web + API) | +320 MB |
| **Total perkiraan** | **±1.975 MB dari 3.915 MB** |

Risiko utama bukan keadaan idle, tetapi **`next build`**: dengan batas heap 1.400 MB, satu build bisa memakai ±1,4–1,6 GB tambahan, jadi saat semua produk hidup puncaknya mendekati 3,5 GB dari 3,9 GB. Pegangan:

1. Build **satu per satu**, tidak paralel, dengan `NODE_OPTIONS=--max-old-space-size=1400`; pastikan swap aktif (`swapon --show`; terverifikasi 24 Okt: `/swapfile` 2 GB, terpakai ±55 MB saat idle).
2. Sebelum aplikasi baru hidup: `free -m`, `pm2 monit`, `ps aux --sort=-%mem | head`, lalu bandingkan dengan tabel di atas.
3. Bila puncak build melewati ±3,2 GB: build di mesin lain (CI/lokal) lalu kirim hasil build, atau naikkan RAM. Pisah server untuk `majelis` tetap pilihan bila isolasi data sensitif diinginkan, bukan karena memori.
4. 3 core cukup untuk beban saat ini; build paralel adalah yang akan merebut CPU dan memori bersamaan.

Landing statis di Nginx tidak memakai memori Node.

## 6. Keputusan terbuka (perlu diputuskan sebelum aplikasi terkait dibangun)

| # | Keputusan | Fakta saat ini | Rekomendasi |
|---|---|---|---|
| P1 | **Cara SSO** | Login menghasilkan JWT HS256 (7 hari) yang disimpan di `localStorage` pada origin `jemaat`; subdomain lain **tidak bisa membacanya**. CORS API hanya satu origin | Alur redirect: aplikasi lain mengalihkan ke `jemaat.../login?kembali=...`, setelah login dikembalikan dengan kode sekali pakai yang ditukar ke token. Lebih aman daripada cookie `Domain=.gkjjakarta.org` (cookie itu dikirim ke semua subdomain, termasuk yang kelak lebih lemah). Token baru: tanda tangan **asimetris** (EdDSA/RS256) agar API lain cukup menyimpan kunci publik, bukan `JWT_SECRET` bersama |
| P2 | **Peran baru** (Pengurus UPK, anggota MPH/MPL, notulis) | Peran sekarang ada di tabel user `jemaat` | Identitas tetap di `jemaat`; hak akses per produk disimpan di produk masing-masing, dikaitkan lewat id pengguna |
| P3 | **API terpisah atau satu API** | — | Terpisah per produk (isolasi), dengan syarat P5 terjawab |
| P4 | **Database** | Satu PostgreSQL | Database logis terpisah per produk di server yang sama; tidak ada FK antarproduk |
| P5 | **Kapasitas VPS** | 4 GB RAM, 3 core (dikonfirmasi 24 Okt); bagian 5 | Cukup untuk portal, kegiatan, dan majelis bila build dilakukan satu per satu dengan swap; ukur ulang sebelum tiap aplikasi baru hidup |
| P6 | **Data sensitif `majelis`** (notula, keputusan) | — | Dokumen keamanan tersendiri: siapa yang boleh baca, log akses, cadangan, retensi. Sebelum kode apa pun |
| P7 | **QR kartu anggota sebagai absensi** | **Diputuskan 24 Okt 2026**: token acak (Sprint 13); petugas login memindai kartu di `/m` (Sprint 13B), cari manual sebagai cadangan, tamu dihitung; online dengan antrean kirim ulang; hanya rekap; ±100 orang | Warga memindai sendiri, kios, offline penuh, dan kehadiran sebagai syarat ditunda. Data kehadiran ada di aplikasi jemaat; produk `kegiatan` kelak membacanya lewat API |

Sampai P1 diputuskan, `my` tetap **tanpa form password**: tombol "Masuk Warga" membuka `jemaat.../login`.

## 7. Mengganti landing dengan aplikasi

Contoh untuk `kegiatan` (domain lain sama):

1. Aplikasi sudah lolos tes, build, dan uji di lokal; env produksi siap; port bebas.
2. Tambahkan proses ke `deploy/ecosystem.config.cjs` (nama `gkjj-kegiatan-api` dan `gkjj-kegiatan-web`) atau berkas ekosistem produk.
3. Buat `deploy/nginx-kegiatan.prod.conf` (proxy ke port produk). **Pindahkan** blok `kegiatan.gkjjakarta.org` keluar dari `deploy/nginx-landing.prod.conf`.
4. Di VPS: pasang berkas baru, **hapus blok lama dari `landing.gkjjakarta.org`**, `nginx -t && systemctl reload nginx`. Sertifikat yang sudah ada tetap dipakai (certbot membaca `server_name`; bila blok HTTPS ikut terhapus, jalankan `certbot install --cert-name kegiatan.gkjjakarta.org`).
5. Hapus domainnya dari `deploy/landing/render.sh` dan folder `/var/www/gkjj-landing/<domain>`.
6. Perbarui tabel bagian 1 dokumen ini dan README.

Rollback: kembalikan blok landing dan reload Nginx (landing statis selalu bisa dipasang ulang dengan `render.sh`).

## 8. Daftar periksa menambah produk baru

- [ ] Baris di tabel bagian 1 dan port tidak bentrok
- [ ] `docs/<produk>/RENCANA.md` (tujuan, pengguna, data yang disimpan, siapa boleh akses)
- [ ] Keputusan P1–P6 yang relevan sudah dijawab
- [ ] Workspace `apps/<produk>-*` mengikuti pola dan masuk `turbo.json`
- [ ] Tes dan `type-check` bagian dari pipeline yang sama; tidak ada perubahan perilaku pada `jemaat`
- [ ] Env, PM2, Nginx, certbot, cadangan database, dan rencana rollback tertulis
- [ ] Anggaran memori (bagian 5) dicek
