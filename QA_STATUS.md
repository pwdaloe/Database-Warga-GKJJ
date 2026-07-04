# QA Status
**Last Check**: 2026-07-04
**Project**: Database Warga GKJJ

## Ringkasan

| Layer | Test Files | Test Runner | Tests |
|-------|-----------|-------------|-------|
| Backend API (`apps/api`) | 5 | ✅ Vitest + Supertest | 35 passed |
| Frontend (`apps/web`) | 2 | ✅ Vitest + React Testing Library | 11 passed |

**Catatan stack**: Project ini pakai **Express + TypeScript + Prisma** di backend dan **Next.js 15** di frontend (bukan Python/FastAPI) — Vitest dipilih untuk kedua workspace agar konsisten satu tool di seluruh monorepo.

Jalankan test: `npm run test --workspace=apps/api` / `npm run test --workspace=apps/web` (atau `test:watch`, `test:coverage`).

## Test yang sudah ditulis

### Backend (`apps/api/tests/`)
| File | Area | Cakupan |
|---|---|---|
| `utils/crypto.test.ts` | Enkripsi field (NIK, dll) | roundtrip, determinisme, null handling, backward-compat, error jika key tidak ada |
| `middleware/errorHandler.test.ts` | Error handler global | ZodError, AppError, Prisma P2002/P2025/P2003, prod vs dev message |
| `middleware/auth.test.ts` | JWT authenticate/authorize | token hilang/invalid, role guard |
| `services/auth.service.test.ts` | login/getMe/changePassword (prisma di-mock) | happy path + semua error path |
| `routes/auth.route.test.ts` | Route `/api/auth/*` end-to-end via supertest | validasi 400, 401, 201 |

### Frontend (`apps/web/src/components/ui/`)
| File | Area |
|---|---|
| `Badge.test.tsx` | Mapping label per tipe status, fallback nilai tak dikenal |
| `Pagination.test.tsx` | Rentang data, tombol prev/next disabled, klik nomor halaman |

## Endpoint Coverage Matrix (`apps/api/src/routes`)

| Route file | Test Ada? |
|---|---|
| `auth.ts` | ✅ |
| `dashboard.ts` | ❌ |
| `import.ts` | ❌ (bulk import Excel — 313 baris, perlu effort tersendiri) |
| `kelompok.ts` | ❌ |
| `keluarga.ts` | ❌ |
| `logs.ts` | ❌ |
| `pengaturan.ts` | ❌ |
| `public.ts` | ❌ |
| `users.ts` | ❌ |
| `warga.ts` | ❌ (bulk validate/revert — 349 baris service, perlu effort tersendiri) |
| `wilayah.ts` | ❌ |

## Rekomendasi

1. **Prioritas berikutnya**: `warga.service.ts` (bulk validate/revert) dan `import.ts` (bulk import Excel) — ini area paling berisiko karena langsung menyentuh ~2000 data warga produksi, tapi juga paling besar (300+ baris), jadi butuh sesi `/qa write` terpisah dengan fixture data Excel contoh.
2. Untuk `import.ts`/`warga.ts`, pertimbangkan test dengan Prisma di-mock (unit-style, seperti `auth.service.test.ts`) dulu sebelum investasi ke integration test dengan Postgres test database sungguhan.
3. Jalankan `/qa write` lagi untuk melanjutkan ke `keluarga.ts`, `users.ts`, dan komponen frontend yang lebih kompleks (form, tabel data warga).
