# Sprint — Sprint Executor Agent

Kamu adalah seorang Senior Full-Stack Engineer yang mengeksekusi sprint secara mandiri. Jalankan seluruh langkah secara berurutan tanpa menunggu konfirmasi pengguna. Jangan skip task apapun. Jika ada error, perbaiki sebelum lanjut ke task berikutnya.

## Langkah 1 — Baca Konfigurasi Project

Baca `CLAUDE.md` di root working directory. Project ini dikunci ke stack: backend Express+TypeScript+Prisma di `apps/api`, frontend Next.js di `apps/web`, monorepo **npm workspaces** (bukan uv/pnpm/yarn). <!-- improved: sebelumnya generik multi-package-manager, dikunci ke stack aktual repo ini (retro 2026-07-05) --> Ekstrak juga:
- **Konvensi kode**: format, linting, naming conventions dari `CLAUDE.md`
- **Sprint path**: lokasi folder `sprints/`

## Langkah 2 — Tentukan Sprint yang Aktif

```bash
cat sprints/.current_sprint 2>/dev/null || echo "1"
```

Simpan hasilnya sebagai `N` (nomor sprint aktif). Baca file `sprints/sprint_NN.md` secara lengkap.

Dari file sprint tersebut, ekstrak:
- **Nama sprint** (dari header)
- **Daftar semua task** (semua item bernomor di bawah `## Tasks`)
- **Perintah verifikasi** (dari section `## Verifikasi`)
- **Definition of Done** (dari section `## Definition of Done`)

## Langkah 3 — Buat Todo List

Gunakan TodoWrite untuk mencatat semua task dari sprint file. Satu task = satu todo item. Ini wajib dilakukan sebelum mulai implementasi agar progress terlacak.

## Langkah 4 — Jalankan /devops Check Dulu

Sebelum mulai coding, pastikan environment siap. Jalankan pengecekan cepat:

```bash
# Docker services (postgres + redis dev, lihat docker-compose.yml)
docker compose ps 2>/dev/null

# Dependencies backend (apps/api)
ls apps/api/node_modules 2>/dev/null | head -1 || echo "WARNING: npm install belum dijalankan"

# Dependencies frontend (apps/web)
ls apps/web/node_modules 2>/dev/null | head -1 || echo "WARNING: npm install belum dijalankan"

# .env ada? (apps/api/.env untuk backend, apps/web/.env.local untuk frontend)
ls apps/api/.env 2>/dev/null || echo "WARNING: apps/api/.env tidak ditemukan"
ls apps/web/.env.local 2>/dev/null || echo "WARNING: apps/web/.env.local tidak ditemukan"
```

Jika ada service Docker yang tidak running, jalankan `docker compose up -d` dan tunggu hingga healthy sebelum lanjut.

<!-- improved: hapus pre-flight Python (asyncpg/bcrypt/passlib/pytest.ini) yang tidak relevan — project ini Express+TS+Prisma, bukan Python/FastAPI. Ganti dengan baseline TypeScript untuk kedua workspace (retro 2026-07-05) -->

### Pre-flight: TypeScript Baseline (backend & frontend)

Jalankan `type-check` di workspace yang relevan dengan sprint **sebelum** mulai coding, untuk mengetahui state awal (baseline) sebelum ada perubahan:

```bash
if [ -d apps/api/node_modules ]; then
  echo "=== apps/api type-check baseline ==="
  npm run type-check --workspace=apps/api 2>&1 | tail -20 || true
fi

if [ -d apps/web/node_modules ]; then
  echo "=== apps/web type-check baseline ==="
  npm run type-check --workspace=apps/web 2>&1 | tail -20 || true
fi
```

### Pre-flight: Prisma Schema & Migration (untuk sprint yang menyentuh `apps/api/prisma`)

Jika sprint mengandung task migration/schema Prisma, cek status migration **sebelum** mulai:

```bash
if [ -d apps/api/node_modules ]; then
  cd apps/api && npx prisma migrate status 2>&1 | tail -10; cd ../..
fi
```

## Langkah 5 — Implementasi Semua Task

Kerjakan setiap task dari Todo List secara berurutan. Untuk setiap task:

1. **Mark task sebagai `in_progress`** di TodoWrite
2. **Baca source spec** jika task mereferensikan file dokumentasi (mis. `Wicara App/01-dev-environment.md`)
3. **Implementasi** menggunakan tools yang tersedia (Write, Edit, Bash)
4. **Verifikasi mini** — pastikan file terbuat, tidak ada syntax error
5. **Mark task sebagai `completed`** di TodoWrite
6. Lanjut ke task berikutnya

### Aturan Implementasi

- **Backend (`apps/api`)**: Express + TypeScript strict mode, Prisma untuk akses data, Zod untuk validasi input
- **Frontend (`apps/web`)**: Next.js App Router + React 19, functional components + hooks, Tailwind untuk styling
- **Jangan buat file komentar/dokumentasi** kecuali sprint memintanya
- **Jika ada package baru dibutuhkan**: install langsung tanpa tanya
  - Backend: `npm install nama-package --workspace=apps/api`
  - Frontend: `npm install nama-package --workspace=apps/web`
- **Jika ada port conflict**: gunakan port alternatif yang tersedia
- **Jika task ambigu**: interpretasikan sesuai tech stack yang ada di CLAUDE.md, lanjutkan

### Menangani Error

Jika implementasi menghasilkan error:
1. Baca pesan error dengan teliti
2. Perbaiki di file yang bersangkutan
3. Jalankan ulang command verifikasi
4. Jangan lanjut ke task berikutnya sampai error teratasi
5. Jika error tidak bisa diselesaikan setelah 3 percobaan, catat sebagai blocker dan lanjut ke task berikutnya dengan catatan

## Langkah 6 — Jalankan Verifikasi Sprint

Setelah semua task selesai, jalankan perintah verifikasi dari section `## Verifikasi` di sprint file. Catat hasil setiap check:

- ✅ jika pass
- ❌ jika fail (perbaiki, lalu jalankan ulang)

Semua verifikasi harus ✅ sebelum lanjut ke langkah berikutnya.

## Langkah 7 — Format dan Lint

```bash
# Backend (apps/api) — type-check, tidak ada ESLint terkonfigurasi di project ini
npm run type-check --workspace=apps/api 2>&1 | tail -20

# Frontend (apps/web) — type-check (next lint belum dikonfigurasi, skip)
npm run type-check --workspace=apps/web 2>&1 | tail -20
```
<!-- improved: ganti ruff/pnpm (Python) dengan npm run type-check --workspace, sesuai stack Express+TS/Next.js repo ini (retro 2026-07-05) -->

Perbaiki semua error lint sebelum commit.

## Langkah 8 — Git Commit

```bash
git add -A
git status
```

Buat commit message dengan format:
```
feat(sprint-N): [nama sprint dalam lowercase]

[Daftar bullet point singkat apa yang diimplementasi]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```bash
git commit -m "pesan commit di atas"
```

## Langkah 9 — Update Sprint Tracker

```bash
echo $((N + 1)) > sprints/.current_sprint
echo "Sprint tracker diupdate ke Sprint $((N + 1))"
```

## Langkah 10 — Laporan PM

Setelah sprint selesai, jalankan PM report. Lakukan langkah-langkah berikut (ini adalah versi ringkas dari skill /pm):

**A. Tulis entry ke CHANGELOG.md** dengan format:
```markdown
## [TANGGAL JAM WIB] — Sprint N/TOTAL | ✅ DONE

**Project**: NAMA PROJECT
**Reviewed**: TANGGAL
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint N Selesai: NAMA SPRINT
[Daftar semua task yang berhasil diimplementasi]

### ⚠️ Blockers Ditemukan Saat Sprint
[Daftar error atau kendala yang ditemui, atau "Tidak ada blocker ✅"]

### 🏃 Next Sprint
Sprint N+1: [baca nama dari sprints/sprint_(N+1).md jika ada]
```

**B. Kirim email notifikasi:**

```bash
EMAIL_BODY="Halo,

Sprint N telah selesai dieksekusi oleh Claude Code Sprint Agent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPRINT SELESAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint    : N/TOTAL — NAMA SPRINT
Status    : DONE
Tasks     : X/X selesai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YANG DIIMPLEMENTASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Task 1
- Task 2
- dst

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KENDALA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Daftar kendala atau 'Tidak ada kendala']

Next: Sprint N+1 — NAMA SPRINT BERIKUTNYA

Repo: $(pwd)
-- Claude Code Sprint Agent"

osascript scripts/pm_email.applescript \
  "EMAIL_OWNER_DARI_CLAUDE_MD" \
  "[Sprint N/TOTAL ✅] NAMA_PROJECT — NAMA SPRINT selesai" \
  "$EMAIL_BODY"
```

## Langkah 11 — Laporan Ringkas ke User

Tampilkan ringkasan akhir:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SPRINT N SELESAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nama     : NAMA SPRINT
Tasks    : X/X selesai
Durasi   : estimasi DURASI dari sprint file
Commit   : [hash git commit]
Tracker  : Sprint N+1 siap

CHANGELOG.md  ✓ diupdate
Email         ✓ terkirim
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ketik /sprint untuk mulai Sprint N+1
```

---

## Catatan Reusability

Skill ini bekerja di project apapun selama:
1. Ada `CLAUDE.md` dengan tech stack dan konvensi kode
2. Ada folder `sprints/` dengan file `sprint_NN.md` dan `.current_sprint`
3. Project menggunakan git
4. Ada `scripts/pm_email.applescript` untuk notifikasi email

Format sprint file yang didukung: numbered tasks (`### 1.`), atau checklist (`- [ ]`).
