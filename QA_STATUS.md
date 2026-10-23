# QA Status
**Last Check**: 2026-10-23
**Project**: Database Warga GKJJ

## Ringkasan

| Layer | Test Files | Test Runner | Tests | Coverage (statement) |
|-------|-----------|-------------|-------|----------------------|
| Backend API (`apps/api`) | 24 | ✅ Vitest + Supertest | 395 passed | 78,5% |
| Frontend (`apps/web`) | 22 | ✅ Vitest + React Testing Library | 137 passed | 17,8% |

Type-check (`tsc --noEmit`) API dan web lulus; `next build` berhasil (23 Okt 2026, setelah patch dependensi).

**Catatan stack**: Express + TypeScript + Prisma di backend, Next.js 15 di frontend. Vitest dipakai di kedua workspace.

Jalankan test: `npm run test --workspace=apps/api` / `npm run test --workspace=apps/web` (atau `test:watch`, `test:coverage`).

## Test yang sudah ditulis

### Backend (`apps/api/tests/`)
| Area | File | Cakupan |
|---|---|---|
| Util | `utils/crypto.test.ts`, `utils/waNumber.test.ts` | enkripsi NIK (roundtrip, determinisme, null), normalisasi nomor WhatsApp |
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
| Data master | `routes/wilayah.route.test.ts`, `kelompok.route.test.ts`, `keluarga.route.test.ts` | matriks otorisasi tulis (403 tanpa menyentuh DB), validasi Zod, filter aktif/wilayah, urutan hapus wilayah, toggle aktif, 404/409 dari Prisma |

### Frontend (`apps/web/src/`)
Form dan payload Warga (round-trip, alamat KK, koordinat), Keluarga (payload, modal hapus KK), Profil Saya, Hubungi, Info Akun, Perpindahan, Reset Password, kartu Demografi, ProtectedRoute, UpdateBanner, versi aplikasi, helper Excel, Badge, Pagination.

## Coverage route backend (`apps/api/src/routes`, statement)

| Route | Coverage | Catatan |
|---|---|---|
| `hubungi.ts`, `system.ts`, `keluarga.ts`, `kelompok.ts`, `wilayah.ts` | 100% | tiga terakhir ditambah 24 Okt (otorisasi per peran, validasi, filter, urutan hapus); `keluarga.ts` meng-mock service, cakupan cakupan-kelompok ada di `keluarga.service.test.ts` |
| `import.ts` | 94% | |
| `auth.ts` | 78% | |
| `users.ts` | 75% | |
| `warga.ts` | 71% | |
| `pengaturan.ts` | 61% | |
| `perpindahan.ts` | 50% | |
| `dashboard.ts` | 38% | endpoint demografi dan filter diuji, sisanya belum |
| `logs.ts` | 22% | |
| `public.ts` | 18% | |

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
3. Tes route `dashboard.ts`, `logs.ts`, `public.ts`, `perpindahan.ts` (coverage 18–50%).
4. Tes import saat ini me-mock Prisma; coba import Excel nyata di lokal sebelum perubahan besar pada `import.ts`.
