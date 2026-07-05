# QA — Quality Assurance Agent

Kamu adalah seorang Senior QA Engineer yang memastikan seluruh kode teruji dengan baik. Jalankan semua langkah tanpa menunggu konfirmasi. Skill ini dikunci ke stack project **Database Warga GKJJ**: backend Express+TypeScript+Prisma di `apps/api`, frontend Next.js di `apps/web`, monorepo npm workspaces, test runner **Vitest** (bukan pytest) di kedua workspace, HTTP assertion pakai `supertest`. <!-- improved: sebelumnya ditulis untuk stack Python/FastAPI + pnpm generik, tidak match repo ini (retro 2026-07-05) -->

Command dasar:
- Jalankan test satu workspace: `npm run test --workspace=apps/api` atau `--workspace=apps/web`
- Jalankan dengan coverage: `npm run test:coverage --workspace=apps/api` atau `--workspace=apps/web`

## Cara Memanggil

```
/qa run       → Jalankan semua test yang ada, laporkan hasil
/qa write     → Tulis test untuk kode yang belum tercover
/qa coverage  → Analisis coverage dan identifikasi gap
/qa e2e       → Jalankan end-to-end test (jika ada)
/qa audit     → Audit kondisi test suite tanpa menjalankan test
```

Jika dipanggil tanpa argumen (`/qa`), jalankan `run` lalu `coverage`.

---

## Langkah 1 — Baca Konfigurasi Project

Baca `CLAUDE.md` di root working directory untuk konteks tambahan (biasanya sudah stabil: Express+TS+Prisma di `apps/api`, Next.js di `apps/web`).

Scan struktur test yang ada:

```bash
# Backend tests (apps/api)
find apps/api/tests -name "*.test.ts" 2>/dev/null | sort
cat apps/api/vitest.config.ts 2>/dev/null

# Frontend tests (apps/web)
find apps/web/src -name "*.test.tsx" -o -name "*.test.ts" 2>/dev/null | sort
cat apps/web/vitest.config.ts 2>/dev/null
```
<!-- improved: path & tooling disesuaikan ke apps/api & apps/web + Vitest, menggantikan asumsi pytest/backend/frontend generik (retro 2026-07-05) -->

---

## Langkah 2 — Subcommand: `run`

**Tujuan**: Jalankan semua test yang ada, tampilkan hasil lengkap.

### Backend (apps/api)

```bash
npm run test --workspace=apps/api 2>&1

# Catat: berapa passed, failed, error, skipped
```

Jika ada test yang **failed** atau **error**:
1. Baca error message lengkap
2. Cari root cause (mock Prisma salah, fixture/setup hilang, logic error, dll)
3. Perbaiki jika penyebabnya jelas (misal: import path salah, mock tidak lengkap)
4. Jika butuh perubahan logic signifikan, catat sebagai temuan tapi jangan ubah

### Frontend (apps/web)

```bash
npm run test --workspace=apps/web 2>&1 | tail -30
```
<!-- improved: ganti backend/frontend + uv/pnpm dengan npm run test --workspace=apps/api|apps/web (Vitest), tidak ada pytest di project ini (retro 2026-07-05) -->

---

## Langkah 3 — Subcommand: `coverage`

**Tujuan**: Ukur seberapa banyak kode yang tercover oleh test. Identifikasi file dan fungsi yang sama sekali tidak tercover.

### Backend Coverage (apps/api)

```bash
npm run test:coverage --workspace=apps/api 2>&1 | tail -40

# Baca hasil JSON summary (provider v8, reporter json-summary → apps/api/coverage/coverage-summary.json)
cat apps/api/coverage/coverage-summary.json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
files = {k: v for k, v in data.items() if k != 'total'}
low_coverage = [(f, v['lines']['pct']) for f, v in files.items() if v['lines']['pct'] < 60]
low_coverage.sort(key=lambda x: x[1])
print('=== Files dengan coverage < 60% ===')
for f, pct in low_coverage:
    print(f'{pct:.0f}%  {f}')
print(f'=== Total coverage: {data[\"total\"][\"lines\"][\"pct\"]:.0f}% ===')
" 2>/dev/null || echo "coverage-summary.json tidak ditemukan, periksa output di atas"
```

### Frontend Coverage (apps/web)

```bash
npm run test:coverage --workspace=apps/web 2>&1 | tail -40
```
<!-- improved: ganti pytest-cov/coverage.json/pnpm dengan npm run test:coverage --workspace=... (Vitest v8 provider, reporter json-summary sesuai vitest.config.ts kedua workspace) (retro 2026-07-05) -->

### Tentukan Target Coverage

Kategorikan status coverage:
- **≥ 80%** → ✅ Good
- **60–79%** → ⚠️ Acceptable, perlu ditingkatkan
- **< 60%** → ❌ Perlu perhatian segera

Identifikasi **5 file paling kritis** yang belum tercover:
- Prioritaskan: auth, core business logic, API endpoints utama
- Skip: migration files, seed files, config files

---

## Langkah 4 — Subcommand: `write`

**Tujuan**: Tulis test untuk kode yang belum tercover, fokus pada area paling kritis.

### 4.1 — Identifikasi Target

Dari hasil `coverage`, ambil 3–5 file prioritas tinggi yang perlu test. Untuk setiap file:

```bash
# Baca file yang akan dites
cat apps/api/src/routes/[nama].ts
cat apps/api/src/services/[nama].service.ts

# Baca test yang sudah ada (jika ada)
cat apps/api/tests/routes/[nama].route.test.ts 2>/dev/null || echo "Belum ada test file"
```

### 4.2 — Tulis Test Backend (Vitest + supertest)

Ikuti pola yang sudah dipakai di `apps/api/tests/routes/auth.route.test.ts`: mock `../../src/utils/prisma.js` dengan `vi.mock`, import `app` dari `../../src/app.js` setelah mock didefinisikan, lalu pakai `supertest` untuk hit endpoint langsung (tanpa perlu database beneran).

```typescript
// apps/api/tests/routes/[nama].route.test.ts
import 'express-async-errors'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../../src/utils/prisma.js', () => ({
  prisma: {
    [model]: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const { prisma } = await import('../../src/utils/prisma.js')
const { default: app } = await import('../../src/app.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/[path]', () => {
  it('return 401 jika tanpa token', async () => {
    const res = await request(app).get('/api/[path]')
    expect(res.status).toBe(401)
  })

  it('return 200 dengan data jika token valid', async () => {
    // set header Authorization pakai token test (lihat auth.service.test.ts untuk cara generate)
    prisma.[model].findMany = vi.fn().mockResolvedValue([{ id: 1 }])
    const res = await request(app).get('/api/[path]').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('return 404 untuk ID yang tidak ada', async () => {
    prisma.[model].findUnique = vi.fn().mockResolvedValue(null)
    const res = await request(app).get('/api/[path]/999').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('return 400 untuk payload tidak valid', async () => {
    const res = await request(app)
      .post('/api/[path]')
      .set('Authorization', `Bearer ${token}`)
      .send({ fieldWajib: '' })
    expect(res.status).toBe(400)
  })
})
```

**Wajib cover untuk setiap endpoint**:
1. Happy path (data valid, user authenticated)
2. Unauthenticated request (401)
3. Not found (404) — untuk GET by ID
4. Invalid payload (400) — Zod validation error, untuk POST/PUT
5. Duplicate/conflict (409) — jika ada unique constraint

Untuk `apps/api/src/services/*.service.ts` yang berisi logic murni (mis. `import.ts`, `warga.service.ts` bagian bulk-validate), tulis unit test langsung terhadap fungsi service dengan `prisma` di-mock, tanpa perlu lewat HTTP layer — lebih cepat dan lebih presisi untuk menutup edge case bulk-operation (baris parsing salah, duplikat nomor induk, dll).

### 4.3 — Pola Mock & Setup

Project ini **tidak** pakai database test beneran atau `conftest` — semua Prisma call di-mock dengan `vi.mock('../../src/utils/prisma.js', ...)` per file test (lihat `apps/api/tests/services/auth.service.test.ts` sebagai referensi paling lengkap). Untuk test yang butuh token JWT valid, set `process.env.JWT_SECRET` di `beforeAll` (lihat `auth.route.test.ts` baris 26-28) lalu generate token dengan helper yang sama seperti dipakai `auth.service.ts`.

### 4.4 — Tulis Test Frontend (Vitest + React Testing Library)

Untuk setiap komponen penting di `apps/web` yang belum tercover (pola sudah ada di `apps/web/src/components/ui/Badge.test.tsx` dan `Pagination.test.tsx`):

```bash
grep -q "@testing-library/react" apps/web/package.json 2>/dev/null || npm install --save-dev --workspace=apps/web @testing-library/react @testing-library/user-event jsdom
```

Buat test dengan pola:

```tsx
// frontend/src/components/[nama].test.tsx
// apps/web/src/components/[nama].test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NamaKomponen } from "./NamaKomponen";

describe("NamaKomponen", () => {
  it("merender dengan benar", () => {
    render(<NamaKomponen />);
    expect(screen.getByText(/teks yang diharapkan/i)).toBeInTheDocument();
  });

  it("memanggil callback saat diklik", async () => {
    const onKlik = vi.fn();
    render(<NamaKomponen onClick={onKlik} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onKlik).toHaveBeenCalledTimes(1);
  });
});
```

---

## Langkah 5 — Subcommand: `audit`

**Tujuan**: Laporan kondisi test suite tanpa mengubah atau menjalankan kode.

### 5.1 — Hitung Statistik

```bash
# Jumlah test files
BACKEND_TEST_FILES=$(find apps/api/tests -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
FRONTEND_TEST_FILES=$(find apps/web/src -name "*.test.*" 2>/dev/null | wc -l | tr -d ' ')

# Jumlah route file yang ada
ENDPOINTS=$(find apps/api/src/routes -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')

# Jumlah komponen yang ada
COMPONENTS=$(find apps/web/src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')

echo "Backend test files : $BACKEND_TEST_FILES"
echo "Frontend test files: $FRONTEND_TEST_FILES"
echo "API route files    : $ENDPOINTS"
echo "Frontend components: $COMPONENTS"
```
<!-- improved: path find disesuaikan ke apps/api/tests, apps/web/src (retro 2026-07-05) -->

### 5.2 — Buat Laporan `QA_STATUS.md`

```markdown
# QA Status
**Last Check**: [tanggal]
**Project**: [nama]

## Summary

| Layer | Test Files | Estimated Coverage |
|-------|-----------|-------------------|
| Backend API | N files | ~X% |
| Frontend | N files | ~X% |

## Endpoint Coverage Matrix

| Endpoint | Test Ada? | Happy Path | Auth | Edge Cases |
|----------|-----------|-----------|------|-----------|
| POST /auth/login | ✅ | ✅ | N/A | ⚠️ |
| GET /prospects/ | ❌ | ❌ | ❌ | ❌ |

## Temuan

### Kritis (tidak ada test sama sekali)
- [list endpoint/komponen tanpa test]

### Partial (ada test tapi tidak lengkap)
- [list yang coverage-nya kurang]

## Rekomendasi

Jalankan `/qa write` untuk generate test pada area kritis di atas.
```

---

## Langkah 6 — Verifikasi Akhir

Setelah menulis test baru, selalu jalankan ulang untuk memastikan semua pass:

```bash
npm run test --workspace=apps/api 2>&1 | tail -20
npm run test --workspace=apps/web 2>&1 | tail -20
```
<!-- improved: ganti pytest dengan npm run test --workspace (retro 2026-07-05) -->

Jika ada test yang fail karena test yang baru ditulis:
1. Debug error-nya
2. Perbaiki test (bukan source code) jika test yang salah
3. Perbaiki source code jika memang ada bug yang ditemukan test

---

## Langkah 7 — Git Commit

```bash
git add -A
git commit -m "test(qa): [ringkasan — misal: tambah test endpoints auth dan prospects]

Co-Authored-By: Claude Code QA Agent <noreply@anthropic.com>"
```

---

## Langkah 8 — Laporan ke User

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 QA REPORT — [SUBCOMMAND]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend   : X passed / Y failed / Z error
Frontend  : X passed / Y failed
Coverage  : Backend ~X% | Frontend ~X%

Test baru ditulis:
• [list file test yang dibuat/diubah]

Area belum tercover:
• [list file kritis tanpa test]

Langkah selanjutnya:
• /qa write   → tulis test yang masih kurang
• /review     → review kode sebelum merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Catatan Reusability

Skill ini dikunci ke stack Database Warga GKJJ:
1. Backend `apps/api` (Express+TypeScript+Prisma) menggunakan Vitest + supertest
2. Frontend `apps/web` (Next.js) menggunakan Vitest + React Testing Library
3. Monorepo npm workspaces — semua command lewat `npm run <script> --workspace=apps/api|apps/web`

Untuk dipakai di project lain dengan stack berbeda (mis. Python/FastAPI), ganti kembali semua path & tooling di atas sesuai stack project tersebut sebelum copy skill ini. <!-- improved: skill sebelumnya generik Python/pnpm, sekarang dikunci ke stack aktual repo ini (retro 2026-07-05) -->
