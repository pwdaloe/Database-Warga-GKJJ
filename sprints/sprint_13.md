# Sprint 13 — Perbaikan QR Kartu Anggota: token acak menggantikan id berurutan

> **Status (24 Okt 2026): SELESAI DI LOKAL, belum dideploy** (lihat "Hasil pelaksanaan" di akhir). Direvisi setelah diskusi QR absensi. Token QR ini juga menjadi kunci absensi kegiatan (`sprints/sprint_13b.md`, `docs/PLATFORM.md` P7 diputuskan). Hasil diskusi: kartu fisik **belum dicetak**, jadi tidak perlu masa transisi panjang; kehadiran hanya rekap; uji coba ±100 orang.
> Perubahan terhadap rancangan awal: `QR_ALLOW_LEGACY_ID` **default `false`** (jika env tidak ada, id numerik ditolak). Tautan WhatsApp lama `/m/{id}` yang pernah terkirim (skala uji coba) **diabaikan** atas keputusan user 24 Okt 2026: tidak ada masa transisi, id numerik langsung ditolak. Token **tidak menampilkan data lebih dari sekarang** dan tidak dipakai di luar kartu, QR, dan absensi.

## Konteks

Prasyarat portal jemaat (`docs/RENCANA_PORTAL_JEMAAT.md`, keputusan user 2026-10-23: "endpoint QR kita perbaiki dahulu sebelum sprint portal berjalan").

**Celah saat ini** (ditemukan saat menulis tes route `public`, 2026-10-23):
- `GET /api/public/member/:id` terbuka tanpa login dan memakai **id warga berurutan** (1, 2, 3, ...). Siapa pun bisa menelusuri semua id dan mendapat nama lengkap, nama panggilan, nomor anggota/induk, foto, jenis kelamin, status keanggotaan, status baptis/sidi, dan kelompok/wilayah seluruh jemaat.
- QR kartu anggota (`apps/web/src/app/(dashboard)/kartu/page.tsx`), tautan WhatsApp kartu (`apps/web/src/lib/kartuWhatsapp.ts`), dan halaman publik `apps/web/src/app/m/[id]/page.tsx` semuanya memakai `/m/{id}`.
- Daftar kartu di aplikasi mobile penatua (`apps/web/src/app/m/(app)/kartu/page.tsx`) membuka `/m/${w.id}`.
- Risiko: data pribadi jemaat (termasuk foto) dapat dikumpulkan massal tanpa autentikasi, melanggar prinsip UU PDP No. 27/2022 yang dianut sistem ini. Portal publik yang akan datang menambah paparan.

Bukan celah isi (field yang keluar memang sengaja terbatas, dikunci tes `public.route.test.ts`), tetapi **celah enumerasi**: tebakan id berurutan.

## Keputusan yang mengikat (usulan; konfirmasi user di bagian "Pertanyaan")

- **Token acak** per warga: 128 bit dari `crypto.randomBytes(16)`, dikodekan base64url (22 karakter), kolom `qr_token` (unik, nullable saat migrasi, lalu diisi untuk semua warga dan otomatis saat warga baru dibuat). Tidak diturunkan dari id atau NIK.
- **Endpoint baru** `GET /api/public/member/:token`. Token tidak valid dan tidak ditemukan **sama-sama** `404` dengan pesan identik (tanpa "oracle").
- **Transisi dengan sakelar env `QR_ALLOW_LEGACY_ID`** (default `false`; `true` hanya bila tautan lama sudah terlanjur dikirim, lihat status di atas):
  - Tahap A (deploy sprint ini): token berfungsi; tautan lama `/m/{id}` masih berfungsi **terbatas** (laju diperketat) supaya kartu yang sudah tercetak/terkirim tidak langsung mati.
  - Tahap B (setelah kartu dicetak ulang / tautan dikirim ulang): `QR_ALLOW_LEGACY_ID=false`, id numerik ditolak dengan `404`. Tanggal Tahap B diputuskan user.
- **Batas laju khusus** `/api/public/member/*` (mis. 30 permintaan/menit/IP) agar penelusuran massal tidak praktis, di samping limiter global.
- **Header `Cache-Control: no-store`** dan **`X-Robots-Tag: noindex`** pada respons publik anggota.
- **Rotasi token**: Superadmin/Kepala Kantor/Staf Admin dapat membuat ulang token satu warga (kartu hilang atau bocor); token lama langsung mati; tercatat di audit log.
- Token hanya dikirim ke peran yang sudah boleh membuka Kartu Anggota (redaksi per peran lewat `sanitizeForRole`); tidak muncul di ekspor, log, atau respons peran lain.
- Isi respons publik **tidak berubah** pada sprint ini (daftar field tetap dikunci tes). Peninjauan apakah foto perlu tetap tampil dicatat sebagai pertanyaan, bukan diubah diam-diam.

## Tasks

1. **Skema & migrasi (aditif).** `Warga.qrToken String? @unique @map("qr_token") @db.VarChar(32)`. Hanya menambah kolom; tidak menyentuh data lain. Catat bahwa `prisma db push` di skrip deploy menangani kolom baru; tidak ada CHECK constraint baru.
2. **Pembangkit token.** `utils/qrToken.ts`: `buatQrToken()` (16 byte acak, base64url), `adalahQrTokenValid(str)` (panjang dan alfabet). Dipakai saat `createWarga`, import Excel, dan perpindahan yang membuat warga baru.
3. **Skrip backfill** idempotent `apps/api/scripts/backfill-qr-token.ts` (`npm run db:backfill-qr`): mengisi hanya baris `qr_token IS NULL`, per batch (mis. 200), tahan bentrok unik (ulang token bila bentrok), melaporkan jumlah. Read-only terhadap kolom lain. Bukan bagian skrip deploy; dijalankan manual setelah deploy.
4. **Endpoint publik.** `GET /api/public/member/:token` mencari berdasarkan `qrToken`. Jalur id numerik hanya hidup bila `QR_ALLOW_LEGACY_ID=true` (dengan limiter lebih ketat); bila `false` → `404` seragam. Header `no-store`/`noindex`. Daftar field respons tetap sama dan tetap dikunci tes.
5. **Rotasi.** `POST /api/warga/:id/qr-token/rotate` (`authorize` Superadmin, Kepala Kantor, Staf Admin; Penatua dibatasi ke kelompoknya bila diizinkan), menghasilkan token baru, audit log (aksi, id warga, tanpa menulis token ke log).
6. **Redaksi & tipe.** Tambah `qrToken` ke `packages/types` dan ke respons warga hanya untuk peran yang berhak (detail dan daftar yang dipakai halaman Kartu); VIEWER/JEMAAT tidak menerima.
7. **Web.** Halaman Kartu Anggota (cetak + pratinjau), `kartuWhatsapp.ts`, dan halaman publik `/m/[token]` memakai token; tautan di daftar kartu mobile penatua memakai token. Rute `/m/[id]` lama tetap menerima id numerik selama Tahap A (menampilkan hasil yang sama), lalu pesan "Kartu tidak ditemukan atau sudah diperbarui, hubungi gereja" bila `404`. Tombol "Buat ulang QR" di detail warga untuk peran berhak, dengan konfirmasi.
8. **Tes** (dengan mutation check):
   - token: panjang/alfabet, keunikan pada 10.000 pembangkitan, tidak bergantung pada id;
   - endpoint: token valid → 200 dengan daftar field terkunci; token salah dan token tidak ada → 404 identik (bandingkan badan respons); `no-store`; limiter bekerja;
   - transisi: `QR_ALLOW_LEGACY_ID=true` → id numerik masih 200; `false` → id numerik 404; nilai env tidak valid → perilaku aman (anggap `false`);
   - rotasi: token lama 404 setelah rotasi, peran tidak berhak 403, audit log tidak memuat token;
   - redaksi: `qrToken` hanya untuk peran berhak, tidak ada di respons VIEWER/JEMAAT, tidak ada di daftar yang tidak membutuhkannya;
   - backfill: idempotent (jalan dua kali tidak mengubah token), menangani bentrok;
   - web: QR berisi `/m/{token}` (dekode QR di tes), bukan id.
9. **Verifikasi nyata di lokal**: buat 2 warga, jalankan backfill, cetak/pratinjau kartu, pindai QR (dekode gambar) lalu buka tautannya, coba id numerik dengan `QR_ALLOW_LEGACY_ID=true` dan `false`, coba penelusuran cepat sampai terkena limiter.
10. **Dokumentasi**: README (env `QR_ALLOW_LEGACY_ID`, langkah transisi, backfill), PANDUAN_PRODUK (cara cetak ulang/kirim ulang kartu, cara membuat ulang QR), DEPLOY.md (urutan: deploy → backfill → kirim ulang kartu → Tahap B), CHANGELOG, tracker. Catat di backlog: peninjauan foto di halaman publik.

## Rencana deploy dan transisi (untuk user)

1. Deploy kode (kolom `qr_token` ditambahkan oleh `db push`; backup otomatis tetap berjalan).
2. Jalankan `npm run db:backfill-qr --workspace=apps/api` sekali; periksa jumlah terisi = jumlah warga.
3. Kartu baru yang dicetak dan tautan WhatsApp yang dikirim sejak itu memakai token. Kartu lama yang masih beredar tetap berfungsi (terbatas) selama Tahap A.
4. Tentukan tanggal Tahap B bersama gereja, umumkan, lalu set `QR_ALLOW_LEGACY_ID=false` di `apps/api/.env`, restart API. Setelah itu kartu lama berhenti berfungsi (jemaat diminta mengambil kartu baru).
5. Rollback: kembalikan `QR_ALLOW_LEGACY_ID=true` (tanpa deploy ulang); kolom `qr_token` boleh dibiarkan.

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
npm run build --workspace=apps/web
```

## Definition of Done

- Semua task selesai; type-check, tes, dan build lulus; tes baru terbukti menangkap mutasi.
- Di lokal: QR yang dicetak memuat token, tautannya terbuka, id numerik ditolak saat `QR_ALLOW_LEGACY_ID=false`, penelusuran cepat terkena limiter.
- `GET /api/public/member/:id` dengan id urut tidak lagi bisa dipakai menelusuri jemaat setelah Tahap B.
- Tidak ada token di log, ekspor, atau respons peran yang tidak berhak.
- Migrasi hanya menambah kolom; tidak ada deploy atau perubahan data produksi tanpa konfirmasi user; jadwal Tahap B ditetapkan user.

## Pertanyaan untuk user (menentukan detail sprint)

1. ~~Kartu fisik / tautan WhatsApp sudah dibagikan?~~ **Dijawab 24 Okt: kartu belum dicetak; tautan WhatsApp lama hanya skala uji coba dan boleh diabaikan.** `QR_ALLOW_LEGACY_ID` tetap ada sebagai pengaman, default `false`.
2. **Apakah foto perlu tetap tampil di halaman QR publik?** Usulan: tetap tampil sekarang, dinilai ulang setelah token berjalan.
3. **Siapa yang boleh membuat ulang QR?** Usulan: Superadmin, Kepala Kantor, Staf Admin.

## Hasil pelaksanaan (24 Okt 2026) dan penyimpangan dari rancangan

Semua task selesai di lokal; **belum di-commit ke main, belum dideploy**. Penyimpangan yang disengaja:

1. **Token dibuat oleh database, tanpa skrip backfill.** Kolom `qr_token VARCHAR(32) NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-','')`. PostgreSQL mengisi semua baris lama dengan token unik saat kolom ditambahkan, dan warga baru (form, impor, perpindahan) otomatis mendapat token tanpa mengubah tiga jalur pembuatan. Format: 32 hex huruf kecil (122 bit acak bawaan UUID v4 untuk baris baru; 128 bit untuk rotasi), bukan base64url 22 karakter. `utils/qrToken.ts` memvalidasi pola yang sama. Task 3 (skrip backfill `db:backfill-qr`) **tidak dibuat** karena tidak diperlukan. Prasyarat: PostgreSQL ≥ 13. **Temuan saat verifikasi**: `prisma db push` menolak menambah constraint unik ke tabel berisi tanpa `--accept-data-loss` (diuji di DB sementara dengan 1.183 baris), sehingga SQL aditif (`prisma/migrations/20261024100000_warga_qr_token/migration.sql`) dijalankan **manual sebelum deploy**; setelah itu `db push` melaporkan "already in sync" dan aplikasi lama tetap bisa INSERT. Urutan di `DEPLOY.md`.
2. **`omit` global di klien Prisma** (`utils/prismaOmit.ts`): `qrToken` tidak pernah dibaca kecuali diminta (`omit: { qrToken: false }` atau `select`). Redaksi per peran (`sanitizeForRole`) tetap ada sebagai lapisan kedua. Lebih aman daripada daftar putih per respons karena respons baru tidak bisa membocorkannya tidak sengaja.
3. **Token disamarkan di log akses** (`morgan`): `/api/public/member/[token]`. Log Nginx tetap memuatnya (dicatat di `DEPLOY.md`).
4. **Tahap B dilebur**: tidak ada masa transisi (keputusan user: kartu belum dicetak, tautan lama skala uji coba boleh diabaikan). `QR_ALLOW_LEGACY_ID` default mati.
5. **DB lokal diubah dengan `ALTER TABLE` langsung (psql), bukan `prisma db push`**, karena `db push` lokal juga akan men-DROP `nomor_sidi` yang masih ada di DB dev. Hasil SQL identik dengan yang akan dibuat `db push` di produksi (`prisma migrate diff` tidak lagi menampilkan selisih untuk `qr_token`).

**Verifikasi yang dilakukan**
- API 33 file / 555 tes (sebelumnya 29 / 496), web 30 file / 172 tes (sebelumnya 25 / 155); `type-check` dan `build` API dan web lulus.
- Mutation check: 14 mutasi API dan 8 mutasi web, semuanya tertangkap setelah satu tes diperbaiki (tes konfirmasi memeriksa terlalu cepat).
- Server nyata (lokal): token valid 200 dengan field terkunci; id numerik 404 bila env tidak diset dan 200 bila `true`; 404 seragam; header `no-store`/`noindex`; limiter (id lama 10/menit, token 30/menit); VIEWER tidak menerima `qrToken` di daftar maupun detail; 8 endpoint lain tidak membocorkan token; rotasi: 403 untuk Majelis/Penatua/Viewer, token lama 404 dan baru 200, audit log tanpa token.
- Browser: halaman Kartu menampilkan QR yang **didekode** (Vision macOS dari tangkapan layar) menjadi `{origin}/m/{token}` yang sama dengan token di DB; tautan token membuka kartu; `/m/{id}` menampilkan "Kartu Tidak Tersedia"; tombol "Buat ulang QR" tampil di detail warga.

**Belum diverifikasi**: klik "Buat ulang QR" di browser (dialog `confirm` bawaan browser; logikanya dicakup tes komponen dan API nyata), cetak ID Card (jendela print), halaman `/m/kartu` mobile di HP, uji dengan kamera HP fisik, penyamaran token oleh `morgan` hanya dilihat di keluaran log (tidak ada tes otomatis untuk integrasinya), dan seluruh langkah di produksi.
