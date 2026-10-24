# Rencana: Portal Jemaat GKJJ (beranda publik)

| | |
|---|---|
| **Status** | Rencana — direvisi 24 Okt 2026: alamat akhir pindah ke `my.gkjjakarta.org`. Perbaikan QR (Sprint 13) tetap prasyarat dan sedang ditahan menunggu keputusan QR absensi (`docs/PLATFORM.md` P7) |
| **Tanggal** | 2026-10-23, revisi 2026-10-24 |
| **Desain** | Kanvas "Portal Jemaat GKJJ — Desain Beranda" (5 layar: Beranda HP, Menu, Temui Pendeta, Saya/Masuk, Beranda Desktop). Salinan markup acuan di `docs/desain-portal/` |
| **Alamat sementara (lokal)** | Portal `http://localhost:3100` · Aplikasi data `http://localhost:3000` · API `http://localhost:4000` |
| **Alamat akhir** | `https://my.gkjjakarta.org` (domain sendiri; sekarang berisi halaman "sedang disiapkan", lihat `deploy/landing/`). Rencana `www.gkjjakarta.org/new` **dibatalkan** |
| **Dokumen terkait** | `docs/PLATFORM.md` (peta domain, SSO, kapasitas VPS), `docs/FITUR_TEMUI_PENDETA.md` (fitur janji penuh), `sprints/sprint_13.md` (prasyarat: perbaikan QR kartu anggota), `sprints/sprint_14.md` (sprint portal pertama, rinci) |

## 1. Tujuan

Mengganti halaman depan yang sekarang hanya berisi login menjadi **portal informasi jemaat**: ibadah minggu ini, kegiatan, renungan, layanan, dan daftar pendeta. Login warga dan pengelolaan data tetap di aplikasi yang sudah berjalan, tidak diubah perilakunya.

Prinsip yang mengikat seluruh sprint:
1. **Aplikasi data produksi tidak boleh terganggu.** Entry data sedang berjalan. Pekerjaan portal dipisah dari `apps/web` dan dari DB sebisa mungkin.
2. **Portal publik tidak pernah menampilkan data warga.** Hanya konten yang sengaja ditandai publik oleh pengelola.
3. **Alamat berasal dari konfigurasi, bukan dari kode.** Portal selalu berjalan di akar domain (lokal `localhost:3100`, produksi `my.gkjjakarta.org`), jadi tidak ada `basePath`. URL situs (`NEXT_PUBLIC_SITE_URL`) dan URL aplikasi data (`NEXT_PUBLIC_APP_URL`) diambil dari env.

## 2. Keputusan arsitektur (usulan, menunggu persetujuan)

| # | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| D1 | **Aplikasi baru `apps/portal`** (Next.js 15, React 19, Tailwind), port 3100, proses PM2 sendiri `gkjj-portal`, domain `my.gkjjakarta.org` | Terisolasi dari aplikasi data: deploy, crash, dan CSS tidak saling memengaruhi. Domain sendiri, jadi tanpa `basePath` dan tanpa menyentuh Nginx maupun WordPress di `www` | Menaruh di `apps/web` sebagai grup route: portal publik dan aplikasi data (login, data pribadi) berbagi proses dan CSS; satu bug menjatuhkan keduanya |
| D2 | **Render di server dengan cache (ISR)**, data dibaca dari API publik lewat fetch sisi server | HTML langsung berisi konten (cepat di HP lama, baik untuk mesin pencari), tanpa masalah CORS | Ekspor statis + fetch di browser: proses lebih sedikit, tapi butuh CORS multi-origin dan halaman kosong sebelum JS jalan |
| D3 | **Portal tidak menangani password** (sampai SSO diputuskan, `docs/PLATFORM.md` P1). Tombol "Masuk Warga" membuka `NEXT_PUBLIC_APP_URL/login` | Token login tersimpan di `localStorage` origin `jemaat`; `my` adalah origin berbeda meski satu domain induk, jadi tidak bisa membacanya. Tidak ada form kredensial baru yang harus diamankan | Form login di portal (seperti mockup layar 4): menyimpang dari mockup; layar "Saya" tetap ada tapi berisi penjelasan + tombol |
| D4 | **Konten dikelola lewat menu baru "Konten Portal" di aplikasi data** (Superadmin, Kepala Kantor, Staf Admin) | Satu tempat login, satu audit log, tanpa CMS tambahan | CMS eksternal: akun baru, risiko data tersebar |
| D5 | **Tabel konten baru, khusus portal, hanya menambah** (tanpa mengubah tabel warga) | Migrasi aditif, rollback aman | Memakai ulang tabel warga: berisiko membocorkan data |
| D6 | **Endpoint publik baru `GET /api/public/portal/*`**, hanya baca, mengembalikan field yang diizinkan (daftar putih), dengan tes yang mengunci field | Pola sama dengan `/api/public/member/:id` | — |
| D7 | Pencarian awal: **saring sisi server** di konten portal saja (kegiatan, renungan, pendeta, layanan), bukan data warga | Mencegah kebocoran | — |

Jawaban pertanyaan terbuka (user, 23 Okt 2026):
- **Q1 — Yang melayani `www.gkjjakarta.org` adalah WordPress.** *(Tidak lagi relevan sejak 24 Okt 2026: portal pindah ke `my.gkjjakarta.org`, sehingga `www` tidak disentuh. Catatan lama dipertahankan sebagai riwayat.)* Akibatnya Sprint 17 harus (a) memastikan di mana WordPress berjalan (satu VPS dengan Nginx yang sama, atau hosting lain; jika hosting lain, `/new` tidak bisa ditangani dari VPS ini dan rencana peluncuran berubah), (b) menambah `location ^~ /new/` di server Nginx `www` **di atas** aturan WordPress (`try_files ... /index.php`), sehingga permintaan `/new/...` tidak pernah masuk ke PHP, (c) memastikan WordPress tidak menimpa slug `/new` (halaman/kategori bernama "new", pengalihan kanonik, plugin cache), (d) tidak menyentuh pengaturan PHP/WordPress. Cek ini wajib sebelum Sprint 17 dimulai.
- **Q2 — Konten diisi oleh tim admin.** Formulir "Konten Portal" dibuat untuk non-teknis: bahasa Indonesia, pratinjau, tanggal tayang, validasi jelas, tanpa HTML mentah. Peran: Superadmin, Kepala Kantor, Staf Admin (D4).
- **Q3 — Foto dan profil pendeta boleh tampil publik.** Tetap dengan kolom persetujuan `setuju_tampil_publik` per pendeta (jejak persetujuan), tidak otomatis.
- **Q4 — Buat Janji cukup tombol WhatsApp.** Tombol membuka `wa.me` ke nomor pendeta/WA Center dengan pesan terisi (template yang bisa diubah di Konten Portal). Sistem janji lengkap (Sprint 18, opsional) ditunda.
- **Q5 — Endpoint QR diperbaiki dulu**, sebelum Sprint 14 berjalan: `sprints/sprint_13.md`.

## 3. Peta jalan

Ukuran: S ≈ 1–3 hari kerja, M ≈ 3–5, L ≈ 1–2 minggu (perkiraan kasar, bukan janji).

| Sprint | Isi | Ukuran | Menyentuh produksi? |
|---|---|---|---|
| *Landing `my` / `kegiatan` / `majelis`* | Halaman "sedang disiapkan", Nginx, SSL (`deploy/landing/`, `deploy/LANDING_CERTBOT.md`). Bukan sprint; dipasang di VPS oleh user | S | Ya (Nginx, tanpa aplikasi) |
| **13 — Perbaikan QR kartu anggota** (prasyarat) | Token acak di QR menggantikan id berurutan, rotasi token. Diputuskan 24 Okt: token juga menjadi kunci absensi (13B); kartu fisik belum dicetak. **Selesai dan dideploy 24 Okt (`241e2da`)** | M | Ya (kolom baru + deploy) |
| *13B — Absensi kegiatan* | Sesi absensi, petugas memindai kartu di `/m`, antrean kirim ulang, rekap. **Dijadwalkan setelah Sprint 14 mulai dikerjakan** (keputusan 24 Okt). `sprints/sprint_13b.md` | M–L | Ya (tabel baru, aditif) |
| **14 — Fondasi & Beranda statis** | `apps/portal`, desain sistem, layout HP/desktop, menu samping, Beranda dengan konten contoh dari berkas konfigurasi, tautan login, noindex. Tanpa `basePath` | M | Tidak (hanya lokal) |
| **15 — Konten dinamis** | Tabel & migrasi aditif, API publik, menu admin "Konten Portal" (Ibadah, Kegiatan, Renungan, Pengaturan portal), portal membaca API dengan cache. Gambar dari `api.gkjjakarta.org` perlu izin di CSP portal (`img-src`) atau diproksikan lewat portal | L | Ya (migrasi aditif, deploy API/web) |
| **16 — Pendeta & halaman konten** | Profil pendeta publik (dengan persetujuan), halaman Temui Pendeta, Buat Janji lewat tombol WhatsApp, halaman Ibadah/Kegiatan/Renungan, pencarian konten | M | Ya |
| **17 — Peluncuran `my.gkjjakarta.org`** | Mengganti landing dengan proxy ke portal (`docs/PLATFORM.md` bagian 7), PM2 + skrip deploy, cek memori VPS, SEO/OG, audit aksesibilitas & performa, isi konten awal oleh tim admin, tautan dari WordPress `www` ke `my` (dilakukan pengelola WP), daftar periksa go-live, rencana rollback (kembalikan landing) | M | Ya (Nginx `my`, PM2) |
| *18 — Janji penuh (opsional)* | Sistem janji sesuai `FITUR_TEMUI_PENDETA.md` | L | Ya |

Perubahan 24 Okt 2026 terhadap sprint 14–17: tanpa `basePath` dan tanpa mode ganda di Sprint 14; Q1 (WordPress) gugur dari Sprint 17; Sprint 17 kini mengganti landing yang sudah ber-SSL; satu pekerjaan baru, **kapasitas memori VPS** (Sprint 17 tidak boleh dideploy sebelum `free -m` dan `pm2 monit` dicek, `docs/PLATFORM.md` bagian 5). Keputusan SSO (P1) **tidak** menghalangi Sprint 14–17, tetapi menghalangi layar "Saya" yang sebenarnya (profil dan kartu di `my`), yang untuk sementara hanya tombol ke `jemaat`.

Berkas sprint 15–17 dibuat **di awal tiap sprint**, bukan sekarang, supaya mengikuti keputusan dan temuan sprint sebelumnya (pelajaran retro: rencana jauh ke depan cepat basi).

## 4. Rancangan data (Sprint 15–16)

Semua tabel baru, tanpa FK ke `warga`:

| Tabel | Isi | Catatan privasi |
|---|---|---|
| `portal_pengaturan` | tagline, tautan siaran langsung, tautan tata ibadah/warta, alamat, telepon, nomor WA Center | Hanya kontak institusi |
| `portal_ibadah` | nama, jam, hari, urutan, aktif | |
| `portal_kegiatan` | judul, mulai/selesai, lokasi, keterangan, tampil | |
| `portal_renungan` | judul, ayat, isi, tanggal tayang, gambar opsional | |
| `portal_pendeta` | nama tampil, gelar, emeritus, bidang pelayanan, bio, foto, jadwal teks, lokasi, **`setuju_tampil_publik`**, aktif, urutan; tautan opsional ke `kontak_gereja` | Tidak tampil sebelum persetujuan dicentang |
| `portal_layanan` (opsional) | tile "Apa yang dapat kami bantu?": judul, ikon, tautan, urutan | |

API publik (hanya `GET`, daftar putih field, batas laju yang sudah ada):
`/api/public/portal/beranda` (gabungan untuk halaman depan), `/ibadah`, `/kegiatan`, `/kegiatan/:id`, `/renungan`, `/renungan/:id`, `/pendeta`, `/pendeta/:id`, `/gambar/:tipe/:id` (biner dengan cache; menghindari base64 besar di JSON).

Tes wajib per endpoint publik: daftar field dikunci (seperti tes batas privasi `public.route.test.ts`), item `tampil=false`/`aktif=false` tidak pernah keluar, tanpa token tetap 200, dan route tulis tetap 401/403.

## 5. Keamanan & privasi

- Portal **tidak** membaca tabel warga, dan API publik portal tidak memuat relasi ke warga.
- Tanpa cookie pelacak dan tanpa skrip analitik pihak ketiga (tidak perlu banner cookie). Pengukuran, bila diperlukan, diputuskan terpisah.
- Foto pendeta: hanya dengan `setuju_tampil_publik`; dikompres di browser admin seperti foto warga.
- Konten admin disanitasi (teks polos/markdown terbatas, tanpa HTML mentah) untuk mencegah XSS di halaman publik.
- Header keamanan (helmet di API; CSP dasar di portal). `robots: noindex` sampai Sprint 17.
- Endpoint QR `/api/public/member/:id` (id berurutan) **diselesaikan lebih dulu atau bersamaan**: portal publik akan menarik lebih banyak pengunjung ke sana.

## 6. Rencana peluncuran ke `my.gkjjakarta.org` (ringkas; rinci di Sprint 17)

Prasyarat yang sudah ada: DNS `my` mengarah ke VPS, sertifikat SSL dan halaman landing terpasang (`deploy/LANDING_CERTBOT.md`).

1. Build portal dengan `NEXT_PUBLIC_SITE_URL=https://my.gkjjakarta.org` dan `NEXT_PUBLIC_APP_URL=https://jemaat.gkjjakarta.org`.
2. Cek memori VPS (`free -m`, `pm2 monit`); proses PM2 `gkjj-portal` di port 3100; build berurutan setelah web (`NODE_OPTIONS=--max-old-space-size=1400`).
3. Nginx: buat `deploy/nginx-my.prod.conf` (proxy ke `127.0.0.1:3100`, cache `/_next/static/`), pindahkan blok `my` keluar dari `nginx-landing.prod.conf`, `nginx -t` sebelum reload. Server `jemaat`, `api`, dan `www` tidak disentuh.
4. API: portal memanggil API lewat alamat internal (`API_URL=http://127.0.0.1:4000`), jadi `CORS_ORIGIN` tidak berubah. Hanya gambar yang diambil browser dari `api` yang perlu izin CSP.
5. `noindex` dilepas (meta, `robots.txt`) **hanya** setelah isi konten awal dan persetujuan user.
6. Rollback: pasang kembali blok landing `my`, `pm2 stop gkjj-portal`; aplikasi data tidak tersentuh.

## 7. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Memori VPS 2 GB saat build dua aplikasi Next | Deploy gagal atau proses dimatikan OOM | Build berurutan, batas heap, cek `free -m` sebelum deploy; uji build di lokal dengan `--max-old-space-size=1400` |
| Konten kosong/basi | Portal terlihat mati | Tugas pengisian awal di Sprint 17, penanggung jawab konten (Q2), tanggal tayang dan "Terakhir diperbarui" |
| Kebocoran data pribadi lewat endpoint publik | Pelanggaran UU PDP | Daftar putih field + tes penjaga + `setuju_tampil_publik` |
| Beban kerja ganda (aplikasi data + portal) | Perhatian terpecah | Portal sengaja dipisah dan bertahap; sprint 13 tanpa DB/produksi |
| Memori VPS tidak cukup untuk portal ditambah aplikasi lain | Proses dimatikan OOM, aplikasi data terganggu | Cek sebelum Sprint 17; opsi naik VPS atau pisah server (`docs/PLATFORM.md` bagian 5) |
| Domain `my` terlanjur dikenal sebagai tempat login | Warga mencoba masuk di `my` dan bingung | Landing dan portal menyediakan tombol jelas ke `jemaat.../login` sampai SSO selesai |
