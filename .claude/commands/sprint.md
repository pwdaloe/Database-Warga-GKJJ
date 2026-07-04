# Sprint — Sprint Executor Agent

Kamu adalah seorang Senior Full-Stack Engineer yang mengeksekusi sprint secara mandiri. Jalankan seluruh langkah secara berurutan tanpa menunggu konfirmasi pengguna. Jangan skip task apapun. Jika ada error, perbaiki sebelum lanjut ke task berikutnya.

## Langkah 1 — Baca Konfigurasi Project

Baca `CLAUDE.md` di root working directory. Ekstrak:
- **Tech stack**: backend language/framework, frontend framework, package manager
- **Konvensi kode**: format, linting, naming conventions
- **Package manager**: apakah backend pakai `uv`, `pip`, atau `poetry`; apakah frontend pakai `pnpm`, `npm`, atau `yarn`
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
# Docker services
docker compose ps 2>/dev/null

# Dependencies backend
ls backend/.venv 2>/dev/null | head -1 || echo "WARNING: uv sync belum dijalankan"

# Dependencies frontend
ls frontend/node_modules 2>/dev/null | head -1 || echo "WARNING: pnpm install belum dijalankan"

# .env ada?
ls .env 2>/dev/null || echo "WARNING: .env tidak ditemukan"
```

Jika ada service Docker yang tidak running, jalankan `docker compose up -d` dan tunggu hingga healthy sebelum lanjut.

<!-- improved: tambah 3 pre-flight checks berdasarkan retro findings Sprint 2,3,7,8,10 (2026-06-28) -->

### Pre-flight: Python Package Compatibility (untuk sprint backend)

Jika sprint mengandung task backend Python, jalankan import test untuk packages kritis **sebelum** mulai coding:

```bash
# Cek packages kritis yang sering menyebabkan masalah
if [ -d backend/.venv ]; then
  # asyncpg — wajib untuk async SQLAlchemy
  cd backend && uv run python -c "import asyncpg; print('asyncpg ✅')" 2>/dev/null || \
    echo "WARNING: asyncpg tidak tersedia — jalankan: cd backend && uv add asyncpg"

  # bcrypt — cek versi dan passlib compatibility
  uv run python -c "
import bcrypt
print(f'bcrypt {bcrypt.__version__} ✅')
try:
    import passlib
    print('WARNING: passlib terdeteksi — bisa konflik dengan bcrypt v5+. Gunakan bcrypt langsung.')
except ImportError:
    pass
" 2>/dev/null || echo "INFO: bcrypt belum terinstall (normal jika bukan sprint auth)"

  # pydantic[email] — wajib jika ada EmailStr
  uv run python -c "import email_validator; print('email-validator ✅')" 2>/dev/null || \
    echo "INFO: email-validator belum ada — install jika sprint butuh EmailStr: uv add pydantic[email]"
  cd ..
fi
```

### Pre-flight: TypeScript Baseline (untuk sprint frontend)

Jika sprint mengandung task frontend TypeScript, jalankan `tsc --noEmit` **sebelum** mulai coding untuk mengetahui state awal:

```bash
if [ -d frontend/node_modules ]; then
  echo "=== TypeScript baseline check ==="
  cd frontend && pnpm exec tsc --noEmit 2>&1 | head -20 || true

  # Pastikan vite-env.d.ts ada (wajib untuk import.meta.env)
  if [ ! -f src/vite-env.d.ts ]; then
    echo "WARNING: src/vite-env.d.ts tidak ada — buat file ini sebelum mulai:"
    echo '  echo '"'"'/// <reference types="vite/client" />'"'"' > frontend/src/vite-env.d.ts'
  else
    echo "vite-env.d.ts ✅"
  fi
  cd ..
fi
```

### Pre-flight: pytest.ini Asyncio Config (untuk sprint yang mengandung test)

Jika sprint mengandung task test (integration test, e2e), verifikasi konfigurasi asyncio **sebelum** mulai:

```bash
if ls backend/tests/*.py 2>/dev/null | head -1 | grep -q ".py"; then
  echo "=== pytest.ini asyncio check ==="
  if [ -f backend/pytest.ini ]; then
    grep "asyncio_mode" backend/pytest.ini && echo "asyncio_mode ✅" || \
      echo "WARNING: asyncio_mode belum dikonfigurasi di pytest.ini — tambahkan:"
      echo "  asyncio_mode = auto"
      echo "  asyncio_default_fixture_loop_scope = session"
      echo "  asyncio_default_test_loop_scope = session"
  else
    echo "WARNING: backend/pytest.ini tidak ditemukan — buat file ini untuk asyncpg stability:"
    echo "  [pytest]"
    echo "  asyncio_mode = auto"
    echo "  asyncio_default_fixture_loop_scope = session"
    echo "  asyncio_default_test_loop_scope = session"
  fi
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

- **Backend Python**: gunakan type hints penuh, async/await untuk DB operations, Pydantic v2 untuk schemas
- **Frontend TypeScript**: strict mode, functional components + hooks, Tailwind untuk styling
- **Jangan buat file komentar/dokumentasi** kecuali sprint memintanya
- **Jika ada package baru dibutuhkan**: install langsung tanpa tanya
  - Backend: `cd backend && uv add nama-package`
  - Frontend: `cd frontend && pnpm add nama-package`
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
# Backend (jika ada kode Python baru)
cd backend && uv run ruff format . 2>/dev/null && uv run ruff check . --fix 2>/dev/null; cd ..

# Frontend (jika ada kode TypeScript baru)
cd frontend && pnpm exec tsc --noEmit 2>/dev/null; cd ..
```

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
