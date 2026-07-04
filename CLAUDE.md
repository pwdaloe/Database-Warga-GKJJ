# Database Warga GKJJ — Sistem database warga jemaat GKJ Jakarta

## Project Overview
Database Warga GKJJ adalah sistem pendataan dan pengelolaan data warga jemaat, mencakup entry data, cleansing, validasi bulk, dan pelaporan.
- **Backend**: Express + TypeScript + Prisma + PostgreSQL (`apps/api`)
- **Frontend**: Next.js 15 + React 19 + TanStack Query/Table + Tailwind (`apps/web`)
- **Monorepo**: Turborepo + npm workspaces (`apps/*`, `packages/*`)
- **Deploy**: VPS via PM2 + Nginx (lihat `DEPLOY.md` dan `deploy/`)

## Source Documentation
- `README.md` — overview umum
- `PANDUAN_PRODUK.md` — panduan fitur, entry data, cleansing, bug & feature request
- `DEPLOY.md`, `SETUP.md` — deployment dan setup environment
- `docs/` — dokumentasi tambahan

## Konvensi Kode

### TypeScript (Backend — `apps/api`)
- Express + TypeScript, Prisma sebagai ORM
- Zod untuk validasi input
- Command: `npm run db:generate`, `npm run db:migrate`, `npm run type-check` (workspace `apps/api`)

### TypeScript (Frontend — `apps/web`)
- Next.js App Router + React 19, functional components + hooks
- Tailwind untuk styling
- TanStack Query untuk data fetching, React Hook Form + Zod untuk form

### Git
- Commit message singkat, deskriptif, bahasa Indonesia mengikuti gaya commit yang sudah ada (`feat:`, `fix:`, `docs:`)
- Jangan commit kecuali diminta eksplisit oleh user

## Environment Variables
Lihat `SETUP.md` dan `.env.example` di masing-masing app (`apps/api`, `apps/web`) untuk variabel yang dibutuhkan (DATABASE_URL, JWT_SECRET, dll).

## Penting
- Project ini TIDAK punya `.claude/settings.json` yang meng-auto-allow semua operasi — tetap konfirmasi ke user untuk operasi berisiko (git push, migrasi DB, deploy, hapus data, dsb) sesuai instruksi default Claude Code.
- Skala data: ~2000 warga, banyak workflow entry data manual dan import dari Excel — hati-hati dengan operasi bulk/migrasi yang menyentuh data produksi.

# userEmail
purwandaru.w@gmail.com
