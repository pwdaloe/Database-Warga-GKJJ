# QA Status
**Last Check**: 2026-10-23 (produksi `111bc3e`)
**Project**: Database Warga GKJJ

## Ringkasan

| Layer | Test Files | Test Runner | Tests | Coverage (statement) |
|-------|-----------|-------------|-------|----------------------|
| Backend API (`apps/api`) | 34 | ✅ Vitest + Supertest | 559 passed | ±85% (belum diukur ulang) |
| Frontend (`apps/web`) | 30 | ✅ Vitest + React Testing Library | 172 passed | 17,8% (belum diukur ulang) |

Type-check (`tsc --noEmit`) API dan web lulus; `next build` berhasil (23 Okt 2026, setelah patch dependensi).

**Catatan stack**: Express + TypeScript + Prisma di backend, Next.js 15 di frontend. Vitest dipakai di kedua workspace.

Jalankan test: `npm run test --workspace=apps/api` / `npm run test --workspace=apps/web` (atau `test:watch`, `test:coverage`).

## Test yang sudah ditulis

### Backend (`apps/api/tests/`)
| Area | File | Cakupan |
|---|---|---|
| Util | `utils/crypto.test.ts`, `utils/waNumber.test.ts` | enkripsi NIK (roundtrip, determinisme, null), normalisasi nomor WhatsApp |
| Klien Prisma | `utils/prismaClient.guard.test.ts` | tidak ada `new PrismaClient(` selain `utils/prisma.ts`, adapter terpasang, seed exit 1 saat gagal |
| Token QR | `utils/qrToken.test.ts`, `utils/prismaOmit.test.ts`, `routes/public.route.test.ts`, `public.limiter.route.test.ts`, `warga.qr.route.test.ts` | format 128 bit dan 10.000 token unik, 404 seragam, sakelar `QR_ALLOW_LEGACY_ID` (nilai tidak valid = mati), `no-store`/`noindex`, batas laju, redaksi `qrToken` per peran, rotasi (matriks peran, audit tanpa token, retry P2002), `omit` global, penyamaran token di log |
| Middleware | `middleware/auth.test.ts`, `middleware/errorHandler.test.ts` | JWT dan role guard, ZodError/AppError/Prisma P2002/P2025/P2003 |
| Auth | `services/auth.service*.test.ts`, `routes/auth*.test.ts` | login, ganti password, reset password mandiri |
| Warga | `services/warga.service.test.ts`, `warga.kepala-kk.test.ts`, `warga.roundtrip.test.ts`, `routes/warga.keanggotaan.route.test.ts` | validasi, kepala KK, round-trip edit per peran, Keanggotaan (Sidi, Menikah) |
| Keluarga | `services/keluarga.service.test.ts` | pindah KK, KK kosong, penunjuk kepala |
| Import | `routes/import.route.test.ts` | bulk import Excel |
| Dashboard | `routes/dashboard.route.test.ts`, `services/dashboardScope.test.ts` | cakupan per kelompok, filter wilayah/kelompok, demografi |
| Perpindahan | `services/perpindahan.service.test.ts`, `routes/perpindahan.route.test.ts` | alur 2 tahap, surat |
| Akun & WhatsApp | `routes/akun-wa.route.test.ts` | password acak, notifikasi, template, kontak gereja |
| Jemaat | `routes/jemaat.route.test.ts` | role Jemaat, Profil Saya |
| Sistem | `routes/system.route.test.ts` | status sistem dan versi |
| Log & publik | `routes/logs.route.test.ts`, `public.route.test.ts` | hanya SUPERADMIN/KEPALA_KANTOR, filter + paginasi, validasi `days` hapus massal, serialisasi BigInt; endpoint QR publik hanya memilih kolom terbatas (tes menjaga batas privasi) |
| Ringkasan dashboard | `routes/dashboard.ringkasan.route.test.ts` | stats, sebaran, terbaru, komisi-stats: cakupan penatua (fail-closed), filter, urutan majelis |
| Perpindahan (akses) | `routes/perpindahan.akses.route.test.ts` | otorisasi per aksi, kirim email, surat PDF |
| Data master | `routes/wilayah.route.test.ts`, `kelompok.route.test.ts`, `keluarga.route.test.ts` | matriks otorisasi tulis (403 tanpa menyentuh DB), validasi Zod, filter aktif/wilayah, urutan hapus wilayah, toggle aktif, 404/409 dari Prisma |

### Frontend (`apps/web/src/`)
Form dan payload Warga (round-trip, alamat KK, koordinat), Keluarga (payload, modal hapus KK), Profil Saya, Hubungi, Info Akun, Perpindahan, Reset Password, kartu Demografi, ProtectedRoute, UpdateBanner, versi aplikasi, helper Excel, Badge, Pagination.

## Coverage route backend (`apps/api/src/routes`, statement)

| Route | Coverage | Catatan |
|---|---|---|
| `hubungi.ts`, `system.ts`, `keluarga.ts`, `kelompok.ts`, `wilayah.ts`, `logs.ts`, `public.ts`, `dashboard.ts` | 100% | `keluarga`, `kelompok`, `wilayah`, `logs`, `public`, `dashboard` ditambah 24 Okt (otorisasi per peran, validasi, filter, urutan hapus); `keluarga.ts` meng-mock service, cakupan cakupan-kelompok ada di `keluarga.service.test.ts` |
| `perpindahan.ts` | 95% | matriks otorisasi per aksi, surat PDF, kirim email |
| `import.ts` | 94% | |
| `auth.ts` | 78% | |
| `users.ts` | 75% | |
| `warga.ts` | 71% | |
| `pengaturan.ts` | 61% | |

Service yang paling lemah: `surat.service.ts` (5%) dan `email.service.ts` (54%); ada dua service lain di bawah 70% dan satu di 0% (nama terpotong di laporan coverage, perlu dicek). Fondasi (`auth.service`, `warga.service`, middleware, util) di atas 90%.

## Celah dan risiko

- **Data nyata lolos dari test**: sudah 9x terjadi; varian relasional dijawab oleh `integritas.service` + `npm run db:integritas` (dijalankan setelah tiap deploy). Pasca-deploy 23 Okt: 8 KK kosong ditemukan, sedang dibersihkan manual oleh admin lewat aplikasi.
- **Frontend 17,8%**: halaman dan hook belum diuji; yang teruji adalah payload, form kunci, dan komponen UI.
- **Belum pernah diuji visual di browser**: form Keanggotaan desktop, detail warga, halaman `/m`. Kartu Demografi dan form Keanggotaan (390px) dicek 23 Okt.
- **Constraint DB tidak ikut `prisma db push`**: CHECK `warga_menikah_konsisten_chk` harus dipasang manual (sudah diverifikasi di produksi).
- **Dependensi**: 4 temuan `npm audit --omit=dev` tersisa (1 high, 3 moderate): `next`/`postcss` menunggu Next 16, `exceljs`/`uuid` tanpa perbaikan aman. Prisma 7 sudah dideploy (23 Okt); client Prisma digenerate ke `apps/api/src/generated/` dan wajib `npx prisma generate` setelah clone.

## Rekomendasi

1. Tes `surat.service.ts` (PDF surat perpindahan) dengan memeriksa isi teks yang dihasilkan.
2. Tes halaman web yang paling sering dipakai penatua: daftar Warga dan Validasi Data.
3. Tes route `pengaturan.ts` (61%), `users.ts` (75%), `warga.ts` (71%, cabang 34%), `auth.ts` (78%).
4. Tes import saat ini me-mock Prisma; coba import Excel nyata di lokal sebelum perubahan besar pada `import.ts`.
