# Sprint 13 — Perbaikan QR Kartu Anggota: token acak menggantikan id berurutan

> **Status (24 Okt 2026): DITAHAN.** QR kartu anggota akan dipakai juga sebagai alat absensi kegiatan (platform `kegiatan.gkjjakarta.org`), sehingga desain token dan siapa yang memindai perlu diputuskan lebih dulu (`docs/PLATFORM.md` P7). Isi di bawah adalah rancangan perbaikan celah enumerasi dan akan ditulis ulang sesuai hasil diskusi.

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
- **Transisi dua tahap** dengan sakelar env `QR_ALLOW_LEGACY_ID` (default `true` selama transisi):
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

1. **Apakah kartu anggota fisik atau tautan QR sudah dibagikan ke jemaat?** Jika belum (atau hanya segelintir), Tahap A bisa dilewati: langsung `QR_ALLOW_LEGACY_ID=false` saat deploy.
2. **Apakah foto perlu tetap tampil di halaman QR publik?** Tanpa token (jika bocor/difoto), foto adalah data paling sensitif di halaman itu. Usulan: tetap tampil sekarang, dinilai ulang setelah token berjalan.
3. **Siapa yang boleh membuat ulang QR?** Usulan: Superadmin, Kepala Kantor, Staf Admin.
