# Retro Log
<!-- Dikelola otomatis oleh Retro Agent. -->

---

## [2026-07-05] — Retrospektif Sprint 1

**Project**: Database Warga GKJJ
**Scope**: Sprint 1 (pertama kali dieksekusi lewat sistem `/sprint`)
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint |
| Total tasks | 4 tasks (4/4 selesai, termasuk 1 opsional) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (dari CHANGELOG) | 3 |
| Recurring blockers (muncul >1x) | 2 |
| Skill gap terdeteksi | 4 (qa.md, devops.md, sprint.md, pm.md) |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — muncul 2 kali (review 2026-07-04 & 2026-07-05)
- **Severity**: MED
- **Root cause**: `/qa` (khususnya subcommand `coverage`) ditulis untuk stack Python/FastAPI + pytest + pnpm — bukan stack project ini (Express+TypeScript+Prisma di `apps/api`, Next.js di `apps/web`, test runner Vitest, package manager npm workspaces). Perintah seperti `uv run pytest --cov=app`, `cat backend/pytest.ini`, `pnpm run test --coverage` tidak match apapun di repo ini, sehingga rekomendasi PM untuk menambah test coverage di dua area paling berisiko (bulk-import & bulk-validate warga, ~2000 data produksi) tidak pernah benar-benar bisa dieksekusi otomatis lewat skill yang ada.
- **Skill yang perlu diupdate**: `qa.md`
- **Saran perbaikan**: Ganti seluruh referensi pytest/coverage.json/pnpm dengan `npm run test --workspace=apps/api -- --coverage` dan `npm run test --workspace=apps/web -- --coverage` (Vitest coverage provider v8), sesuaikan contoh test dari `@pytest.mark.asyncio` ke pola Vitest + supertest untuk endpoint Express.

#### Docker daemon tidak berjalan — muncul 2 kali (review 2026-07-04 & 2026-07-05)
- **Severity**: LOW
- **Root cause**: Butuh Docker Desktop dinyalakan manual oleh user (Postgres/Redis dev) — bukan gap skill, hanya blocker lingkungan lokal yang berulang dilaporkan.
- **Skill yang perlu diupdate**: tidak ada (di luar kendali agent), cukup dicatat sebagai reminder rutin di `/pm`.

### 🐛 Pola Git Bermasalah

- **File sering diubah ulang (sepanjang riwayat repo)**: `apps/api/src/services/warga.service.ts` (7×), `apps/api/src/routes/warga.ts` (7×), `apps/web/src/app/(dashboard)/warga/WargaForm.tsx` (6×), `apps/api/prisma/schema.prisma` (6×) — area `warga` (core domain) paling sering disentuh, wajar karena ini entitas utama aplikasi.
- **Commit "fix:" pra-sistem sprint**: 6 commit fix (`701e4e3`, `755dcc3`, `8ea312f`, `9e7112d`, `b440bdb`, `3a309dd`, `3d3ac50`, `6202f50`) — semuanya terjadi **sebelum** folder `sprints/` & sistem `/sprint` ada, jadi tidak bisa dikaitkan ke sprint tertentu. Tidak actionable untuk siklus sprint saat ini.
- **Commit duplikat**: `f6e606c` dan `d3db31b` sama-sama berjudul "feat: tambah fitur Validasi Data warga (bulk validate/revert + stamp)" — kemungkinan sisa proses rebase/cherry-pick sebelum sistem sprint berjalan. Tidak berdampak ke Sprint 1, hanya catatan historis.
- **Pasca Sprint 1 (`d63f5a2`)**: 0 fix/revert commit — eksekusi bersih, tidak ada rework.

### 🕳️ Gap Skill Coverage

- **Situasi**: Empat skill inti (`qa.md`, `devops.md`, `sprint.md`, `pm.md`) masih berisi path & tooling dari template generik Python/FastAPI + pnpm (`backend/.venv`, `uv sync`, `frontend/node_modules`, `pnpm install`, `pytest.ini`, `asyncpg`, `bcrypt`/`passlib`) yang tidak pernah diadaptasi ke struktur monorepo project ini (`apps/api`, `apps/web`, npm workspaces, Prisma, Vitest).
- **Tidak di-handle oleh**: keempat skill tersebut secara konsisten — saat menjalankan `/sprint` untuk Sprint 1, seluruh pre-flight check Python (asyncpg, bcrypt, pytest.ini) harus diabaikan manual karena tidak relevan, dan path `backend/`/`frontend/` di `/pm` Langkah 4C juga tidak match sehingga deteksi dependency-blocker harus dicek manual dengan path yang benar.
- **Saran**: Update keempat skill file agar konsisten memakai `apps/api` / `apps/web` sebagai path, `npm` sebagai package manager, dan Vitest sebagai test runner — bukan menulis skill baru, cukup menyesuaikan yang sudah ada (skill-skill ini jelas ditulis generik untuk banyak project, project ini yang perlu di-lock ke stack aktualnya).

### ✅ Yang Berjalan Baik

- Sprint 1 selesai 100% (4/4 task termasuk 1 opsional) dalam sekali eksekusi, tanpa fix/revert commit susulan — DoD sprint tercapai bersih.
- Sprint file (`sprint_01.md`) sangat detail (baris kode, nama fungsi, alasan kenapa backend tidak perlu diubah) — memudahkan eksekusi tanpa ambiguitas, tidak ada task yang perlu ditebak-tebak.
- Verifikasi otomatis (`type-check`, `build`, `test`) di `## Verifikasi` sprint file semuanya bisa langsung dijalankan sesuai isi file (tidak seperti pre-flight check lain yang generik) — karena ditulis khusus untuk project ini oleh commit `6eb989d`, bukan disalin dari template.
- Alur `/pm → /sprint → /retro` berjalan mulus end-to-end tanpa perlu intervensi user di tengah jalan.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | qa.md | Seluruh isi (pytest, coverage.json, pnpm) tidak sesuai stack Express+TS+Prisma/Next.js+Vitest+npm project ini | Ganti ke `npm run test --workspace=apps/api\|apps/web -- --coverage`, contoh test Vitest+supertest | ✅ applied (2026-07-05) |
| HIGH | devops.md | Pre-flight pakai `backend/.venv`, `uv sync`, `pnpm` — path & tooling salah | Ganti ke `apps/api/node_modules`, `apps/web/node_modules`, `npm install`, cek `npx prisma migrate status` | ✅ applied (2026-07-05) |
| HIGH | sprint.md | Pre-flight Python (asyncpg/bcrypt/pytest.ini) & path `frontend/`/`backend/` tidak relevan | Hapus blok Python, ganti path ke `apps/api`/`apps/web`, ganti pnpm→npm | ✅ applied (2026-07-05) |
| MED | pm.md | Langkah 4C cek `backend/.venv`/`frontend/node_modules` dengan `uv`/`pnpm` | Ganti ke `apps/api/node_modules`, `apps/web/node_modules`, cek `apps/api/.env` & `apps/web/.env.local` | ✅ applied (2026-07-05) |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Jalankan `/improve` untuk mengeksekusi keempat perbaikan skill di atas sebelum Sprint 2 dimulai — Sprint 2 (migration + email service backend) kemungkinan besar akan memicu pre-flight check Python yang salah di `sprint.md` jika belum diperbaiki.
2. Setelah `qa.md` diperbaiki, jalankan `/qa coverage` sungguhan untuk `apps/api/src/services/import.ts` dan `apps/api/src/routes/warga.ts`/`warga.service.ts` — blocker MED ini sudah 2 review berturut-turut tanpa tindak lanjut nyata karena tooling-nya memang belum bisa jalan.
3. Docker daemon check di `/pm`/`/devops` boleh tetap ada sebagai reminder, tapi tidak perlu dianggap blocker berulang di laporan — cukup sekali dicatat sebagai "precondition lokal", bukan risk yang harus muncul di tiap review.

---
