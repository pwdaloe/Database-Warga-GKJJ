# Sprint K1 — kegiatan.gkjjakarta.org: fondasi, login, master, dan formulir Program Kerja

> **Status (24 Okt 2026): SELESAI DI LOKAL, belum dipasang di VPS.** Hasil dan temuan ada di bagian "Hasil pelaksanaan" di akhir berkas.

## Konteks

Siklus RKA 2027: **pra-muker 15 Nov 2026, muker 22 Nov 2026**. Aplikasi harus live paling lambat **Min 1 Nov** (gerbang go/no-go **Jum 30 Okt**), jendela pengisian UPK 2–9 Nov. Rencana, keputusan, dan fallback: `docs/kegiatan/RENCANA_MVP_MUKER_2026.md`. Latar dan arah jangka menengah: `docs/kegiatan/BRIEF_MODUL_KEGIATAN.md`. Peta platform: `docs/PLATFORM.md` (kegiatan = produk baru: `apps/kegiatan-api` :4200, `apps/kegiatan-web` :3200, database `gkjj_kegiatan`).

Sprint ini **tidak menyentuh** `apps/api`, `apps/web`, database `gkjj_prod`/`gkjj_db`, maupun produksi sampai tugas pemasangan (tugas 12) yang dijalankan user.

## Keputusan yang mengikat

- Login sendiri (tabel pengguna sendiri, bcrypt, JWT 12 jam, wajib ganti password sementara). **Tanpa SSO** (ditunda, `docs/PLATFORM.md` P1).
- Unit pengajuan = **Program Kerja**; berisi **Kegiatan/jadwal**, **Indikator**, **RAB**, **Sumber dana**, dan **acuan visi-misi**.
- Uang = bilangan bulat rupiah (`BigInt` di DB, `number` aman di API dengan batas atas 1 triliun). **Total RAB dan total sumber dana dihitung server**; kiriman klien yang tidak cocok diabaikan atau ditolak.
- Pengusul = **Unit** berjenis `UPK` (14) atau `POS` (2 pos Penatalayanan). Akses ditegakkan **di server** per unit.
- Pengurus = BPH per unit: `KETUA`, `SEKRETARIS`, `BENDAHARA` dengan nama, WhatsApp, email.
- Data contoh diberi tanda `isContoh = true` dan dapat dibuang dengan satu perintah; **tidak ada data pribadi nyata** di seed (email memakai `.invalid`, nomor WhatsApp contoh).
- Master (tahun anggaran, bidang, unit, pagu, pengurus, acuan visi-misi, satuan, kategori biaya) **dapat diedit admin dan tidak tertanam di kode**; seed hanya mengisi nilai awal.

## Model data (ringkas)

`TahunAnggaran` · `Bidang` · `Unit` (+`jenis`, `alias`) · `PaguUnit` (tahun × unit) · `Pengurus` (unit × jabatan) · `Pengguna` (role: ADMIN, SEKRETARIAT, KOORDINATOR_BIDANG, PENGURUS_UPK, MAJELIS) · `AcuanStrategis` (jenis VISI/MISI/SASARAN, hierarki, per tahun) · `Satuan` · `KategoriBiaya` · `ProgramKerja` (status DRAFT/DIAJUKAN) · `ProgramAcuan` · `KegiatanJadwal` (`kategoriWaktu`: SEKALI, PERIODE, RENTANG, TAHUN) · `Indikator` · `RabItem` · `SumberDana` (GEREJA, SWADAYA, PENGGALANGAN, DONASI) · `Program2026` (baseline evaluasi A–D) · `LogAudit`.

## Tasks

1. **Kerangka `apps/kegiatan-api`**: workspace, `tsconfig`, Vitest, Prisma 7 + adapter pg (klien tunggal di `src/utils/prisma.ts`, tes penjaga seperti `prismaClient.guard`), `prisma.config.ts`, helmet/CORS/rate limit/morgan, `errorHandler` (Zod, AppError, Prisma P2002), `/health`, `.env.example`. Tambah ke `turbo.json` bila perlu.
2. **Skema Prisma + seed**: seluruh model di atas; seed idempoten (tahun 2027, 5 bidang, 14 UPK + 2 POS dengan alias, pagu = angka 2026 per UPK, 48 pengurus contoh, visi + 4 aspek, satuan dan kategori biaya awal, 46 Program2026 dari matriks evaluasi, admin awal dari env). Perintah buang data contoh.
3. **Autentikasi**: login, `/me`, ganti password, rate limit login, JWT; admin membuat akun dan mengatur ulang password acak (ditampilkan sekali + tautan `wa.me`); akun UPK terhubung ke `Pengurus`.
4. **Master API (admin)**: CRUD unit, pagu per tahun, pengurus, acuan, satuan, kategori biaya, tahun anggaran (jendela buka/tutup), salin master ke tahun berikutnya. `GET /api/master` untuk dropdown formulir.
5. **Program Kerja API**: daftar (terlingkup per peran), detail, buat draft, simpan (hanya DRAFT, hanya unit pemilik, hanya selama jendela buka), **ajukan** (validasi lengkap + daftar periksa 9 butir + total sumber dana = total RAB), **tarik kembali** ke draft, hapus draft. Kunci setelah penutupan. Audit log.
6. **Dashboard API**: pagu vs pengajuan per unit (Nilai, Pengajuan, Tersedia, status **Under/Over/Sesuai/Belum mengajukan**), per bidang, per aspek visi, gereja vs mandiri.
7. **Tes API** dengan mutation check: matriks otorisasi per peran dan per unit, akses lintas unit (403), jendela tutup, perhitungan uang (`BigInt`, pembulatan, batas), validasi ajukan, dashboard (kasus Belum mengajukan vs Under), serta tes penjaga: tidak ada klien Prisma kedua, tidak ada kebocoran `passwordHash`.
8. **Kerangka `apps/kegiatan-web`** (Next 15, Tailwind, TanStack Query): login, layout ramah HP, guard rute, ganti password wajib.
9. **Halaman pengurus UPK**: daftar Program Saya, **formulir Program Kerja 10 bagian** (draft, banyak jadwal/indikator/RAB, hitung otomatis, sumber dana, daftar periksa, ajukan, tarik), ringkasan untuk Formulir RKA (cetak).
10. **Halaman admin**: master (unit, pagu, pengurus, acuan, satuan, kategori), pengguna, tahun anggaran, dashboard perbandingan.
11. **Verifikasi nyata di lokal**: alur penuh dengan akun uji (login → isi → ajukan → tarik → dashboard) di lebar 390 px dan desktop; kasus negatif (unit lain, jendela tutup); catat apa yang belum dicoba.
12. **Pemasangan (dijalankan user di VPS)**: `DEPLOY_KEGIATAN.md` (buat database dan user DB, `.env`, `db push`, seed, PM2, Nginx untuk `kegiatan` menggantikan landing, sertifikat sudah ada, cadangan, rollback). Tidak ada perubahan ke `jemaat`/`api`.
13. **Dokumentasi**: `docs/kegiatan/` (arsitektur, panduan pengurus UPK satu halaman, panduan admin), README, PLATFORM, CHANGELOG, QA_STATUS.

## Definition of Done

- Pengurus satu UPK bisa login, mengisi, mengajukan, dan menarik kembali Program Kerja; tidak bisa melihat atau mengubah milik UPK lain; admin melihat dashboard perbandingan yang benar.
- Total RAB = jumlah baris; total sumber dana wajib sama dengan total RAB saat mengajukan; semua dihitung server.
- Tes, `type-check`, dan build lulus; mutation check pada aturan uang dan akses tertangkap.
- Tidak ada perubahan di `apps/api`, `apps/web`, database jemaat, atau produksi sebelum user menjalankan tugas 12.

## Hasil pelaksanaan (24 Okt 2026)

Semua tugas 1–13 selesai di lokal; pemasangan (tugas 12) hanya berupa berkas dan panduan, **belum dijalankan di VPS**.

**Yang ada**
- `apps/kegiatan-api` (Express, Prisma 7, database `gkjj_kegiatan`): login (JWT, pengguna dibaca ulang tiap permintaan, batas laju, password sementara wajib diganti), master (tahun, unit, pagu, pengurus BPH, visi-misi, satuan, kategori), Program Kerja (draft, simpan, ajukan, tarik, hapus), dashboard pagu vs pengajuan, akun (password acak sekali tampil + tautan WhatsApp), audit log.
- `apps/kegiatan-web` (Next 15): login, ganti password, daftar program, formulir 9 bagian + daftar periksa, ringkasan cetak, dashboard, master admin (5 tab), akun.
- Seed: 5 bidang, 14 UPK + 2 pos, pagu 2026 (total Rp300.000.000), 48 posisi BPH contoh, visi + 4 aspek, 46 program 2026. Data contoh dapat dibuang.
- Pemasangan: `deploy/DEPLOY_KEGIATAN.md`, `3-deploy-kegiatan.sh`, `ecosystem.kegiatan.config.cjs`, `nginx-kegiatan.prod.conf`, `ganti-landing.sh`, `env.kegiatan-api.production`.

**Penyimpangan dari rancangan**
1. API di **jalur `/api` pada domain yang sama** (bukan subdomain baru): tanpa DNS/sertifikat baru dan tanpa CORS lintas asal.
2. Jendela pengajuan dikendalikan **status manual** (Belum dibuka/Dibuka/Ditutup) oleh admin; tanggal rencana hanya informasi. Lebih mudah diuji dan tidak bergantung zona waktu.
3. `ajukan` memeriksa kelengkapan dari **data tersimpan di database**, bukan kiriman klien; klien menyimpan dulu lalu mengajukan.
4. Ekspor Excel, telaah koordinator, skoring, dan potensi peserta dari data jemaat **belum** (K2/K3 sesuai rencana).

**Verifikasi**
- API: 12 file, 188 tes; web: 3 file, 27 tes; `type-check` dan `build` keduanya lulus; suite jemaat tidak berubah (API 559, web 172). Mutation check: 25 mutasi API dan 8 web tertangkap (satu mutasi web setara, tidak mengubah perilaku).
- Server nyata (lokal): login benar/salah, program unit lain 404, dashboard terbatas per peran, hitungan uang cocok manual (Komisi Anak Rp2,5 juta, Remaja Rp21 juta, total Rp23,5 juta).
- Browser: login, daftar program, formulir baru, simpan draft, validasi server (9 masalah), selisih sumber dana, ajukan (terkunci + tombol tarik), dashboard sekretariat, master tahun, halaman akun.
- Skrip `ganti-landing.sh` diuji pada berkas Nginx tiruan (dua blok terbuang, domain lain utuh, kurung seimbang, domain tak ada = berkas tak berubah).

**Belum diverifikasi**: tarik kembali dan hapus di browser, halaman ringkasan cetak, tab master selain Tahun, pembuatan akun dan tombol WhatsApp di browser, tampilan 390 px (HP), uji dengan beberapa pengguna serentak, dan seluruh langkah di VPS (`nginx -t` pada konfigurasi baru belum pernah dijalankan; Nginx tidak ada di mesin ini).
