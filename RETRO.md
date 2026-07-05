# Retro Log
<!-- Dikelola otomatis oleh Retro Agent. -->

---

## [2026-07-05] — Retrospektif Sprint 3 (wrap-up Sprint 1–3: Reset Password Mandiri)

**Project**: Database Warga GKJJ
**Scope**: Sprint 3, sekaligus wrap-up Sprint 1–3 (seluruh isi `sprints/` sudah selesai)
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint (Sprint 3), + wrap-up Sprint 1–3 |
| Total tasks | 5 tasks (5/5 selesai) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (Sprint 3) | 0 |
| Recurring blockers (semua sprint) | 1 (test coverage, masih 3x/HIGH, belum ditindaklanjuti) |
| Skill gap terdeteksi | 0 baru di Sprint 3 |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — masih 3x, belum resolved
- Tidak ada progres baru di Sprint 3 (murni frontend, tidak menyentuh file ini). Severity tetap HIGH
  sejak eskalasi otomatis di retro Sprint 2. Masih menunggu jadi task eksplisit di sprint mendatang —
  lihat rekomendasi di bawah, ini poin paling penting yang tersisa dari seluruh siklus reset password.

Tidak ada pola blocker baru dari Sprint 3 — eksekusi bersih tanpa insiden.

### 🐛 Pola Git Bermasalah

- **Pasca Sprint 3 (`cf84b0a`)**: 0 fix/revert commit.
- **Ringkasan 3 sprint (`d63f5a2`, `0e1f457`, `cf84b0a`)**: total 0 fix/revert commit di ketiganya —
  konsisten bersih sejak sistem `/sprint` dipakai (dibandingkan era pra-sistem yang punya banyak
  commit "fix:" susulan untuk file yang sama, mis. `warga.service.ts`/`warga.ts` 7×).

### 🕳️ Gap Skill Coverage

Tidak ada gap baru ditemukan di Sprint 3. Perbaikan dari retro Sprint 2 (`sprint.md`: drift-check
Prisma, Prisma consent gate, port-conflict check; `retro.md`: eskalasi recurring blocker) tidak
sempat diuji ulang di Sprint 3 karena sprint ini tidak menyentuh Prisma/Docker — validasi nyata baru
akan terjadi di sprint berikutnya yang menyentuh backend/migration lagi.

### ✅ Yang Berjalan Baik

- Ketiga sprint (reset password mandiri, end-to-end: backend migration+email+endpoint, lalu
  frontend desktop+mobile) selesai 100% tanpa satupun fix/revert commit susulan.
- Alur `/pm → /sprint → /retro → /improve → /sprint (ulang)` berjalan penuh otonom sesuai instruksi,
  termasuk menangani 2 blocker HIGH di tengah jalan (port conflict, schema drift) dengan konfirmasi
  eksplisit ke user tanpa henti prosesnya.
- Verifikasi end-to-end manual (bukan cuma unit test) benar-benar dijalankan untuk alur reset
  password: forgot-password → link di dev email log → reset-password → login dengan password baru
  → token ditolak saat dipakai ulang. Ini persis skenario yang diminta di DoD sprint 3.
- Skill improvement dari retro Sprint 2 langsung diaplikasikan sebelum lanjut sprint berikutnya
  (siklus self-learning bekerja sesuai desain).

### 🔧 Kandidat Perbaikan Skill

Tidak ada kandidat baru dari Sprint 3. Kandidat lama dari retro Sprint 2 (sprint.md drift-check,
consent gate, port-check; retro.md eskalasi) sudah applied — lihat entry retro sebelumnya.

### 💡 Rekomendasi untuk Siklus Berikutnya

1. **Prioritas utama**: buat sprint baru khusus test coverage `import.ts` (bulk-import Excel) &
   `warga.service.ts` (bulk-validate) — blocker ini HIGH sejak retro Sprint 2 dan sudah 3 review
   berturut-turut tanpa tindak lanjut nyata. Ini area yang langsung menyentuh ~2000 data warga
   produksi tanpa jaring pengaman test sama sekali.
2. Validasi ulang perbaikan `sprint.md` (drift-check Prisma, port-conflict check) di sprint
   berikutnya yang benar-benar menyentuh Prisma/Docker — Sprint 3 tidak jadi kesempatan untuk
   memverifikasi perbaikan itu bekerja seperti diharapkan.
3. Tidak ada sprint baru terdaftar di `sprints/` setelah ini (`sprints/.current_sprint` = 4, tidak
   ada `sprint_04.md`) — perlu dibuat sprint plan baru sebelum `/sprint` bisa dijalankan lagi.

---

## [2026-07-05] — Retrospektif Sprint 2

**Project**: Database Warga GKJJ
**Scope**: Sprint 2
**Reviewed**: Minggu, 5 Juli 2026
**Reviewed by**: Claude Code Retro Agent

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | 1 sprint (Sprint 2) |
| Total tasks | 8 tasks (8/8 selesai) |
| Fix/revert commits (pasca sprint) | 0 |
| Unique blockers (Sprint 2) | 2 baru (port conflict, schema drift) |
| Recurring blockers (muncul >1x, semua sprint) | 1 (test coverage import.ts/warga.service.ts, sekarang 3x) |
| Skill gap terdeteksi | 3 (sprint.md ×2, devops.md) |

### 🔁 Pola Blocker Sistemik

#### Test coverage `import.ts` & `warga.service.ts` masih 0% — muncul 3 kali (2026-07-04, 2026-07-05 pagi, 2026-07-05 siang)
- **Severity**: MED (kandidat naik ke HIGH kalau muncul lagi)
- **Root cause**: `qa.md` sudah diperbaiki sejak retro Sprint 1 agar toolingnya cocok (Vitest, `npm run test --workspace=apps/api -- --coverage`), tapi **tidak pernah benar-benar dijalankan**. Ini bukan lagi gap tooling — ini gap proses: rekomendasi PM tidak pernah menjelma jadi task konkret di sprint manapun.
- **Skill yang perlu diupdate**: `retro.md` / `pm.md` (lihat kandidat baru di bawah — usulkan eskalasi otomatis setelah 3x occurrence)
- **Saran perbaikan**: Jadikan ini task eksplisit di sprint berikutnya (atau sprint tersendiri), bukan sekadar catatan naratif yang mudah dilewati.

#### Docker daemon tidak berjalan — sebelumnya muncul 2 kali, **resolved** di Sprint 2
- Daemon aktif & container sehat sepanjang Sprint 2. Ditandai resolved di `learning_log.json`; kalau muncul lagi nanti dihitung ulang dari awal, bukan lanjutan streak lama.

### 🆕 Blocker Baru di Sprint 2 (baru 1x, tapi berpotensi berulang di mesin dev yang sama)

#### Port Postgres (5433) bentrok dengan container project lain di mesin dev
- **Severity**: HIGH (blocking, sebelum di-resolve)
- **Root cause**: `docker-compose.yml` pakai port hardcoded tanpa pre-check ketersediaan port di level OS. Mesin dev ini menjalankan >20 container dari banyak project sekaligus — kolisi port lintas-project adalah risiko nyata, bukan kasus langka.
- **Resolved**: pindah ke port 5435, dikonfirmasi ke user dulu sebelum ubah `docker-compose.yml`/README/`.env.example`.
- **Skill yang perlu diupdate**: `devops.md` — tambah pre-check `lsof` untuk port yang dideklarasikan `docker-compose.yml` sebelum `docker compose up -d`.

#### Schema drift: `schema.prisma` lebih maju dari migration history tercatat
- **Severity**: HIGH (memaksa reset DB dev di tengah sprint)
- **Root cause**: Sejumlah fitur lama (activity_log, master_kelurahan, komisi_config, nomor_induk, dll) sudah ada di `schema.prisma` dan dipakai kode, tapi tidak pernah punya migration file — kemungkinan diterapkan ke environment lain lewat `prisma db push` langsung. `prisma migrate status` melaporkan "up to date" karena hanya membandingkan DB vs migration history tercatat, bukan vs `schema.prisma` — jadi masalah ini baru ketahuan pertengahan sprint saat `migrate dev` menolak jalan & minta reset.
- **Resolved**: migration dipecah dua — satu untuk catch-up drift lama (`sync_schema_with_existing_features`), satu lagi murni untuk fitur sprint ini (`add_password_reset_token`). Reset DB dev dikonfirmasi eksplisit ke user (termasuk melewati Prisma AI-agent consent gate dengan `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`).
- **Skill yang perlu diupdate**: `sprint.md` — tambah pre-check `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ...` sebelum mulai task migration, supaya drift terdeteksi SEBELUM eksekusi dimulai, bukan di tengah jalan.

### 🐛 Pola Git Bermasalah

- **Pasca Sprint 2 (`0e1f457`)**: 0 fix/revert commit — semua error (migration drift, port conflict) diselesaikan **sebelum** commit, bukan lewat commit susulan. Eksekusi bersih.
- Tidak ada file yang di-"fix ulang" pasca Sprint 2 — pola berbeda dari sprint-sprint lama pra-sistem (`warga.service.ts`, `warga.ts` sering direvisi berkali-kali sebelum sistem `/sprint` ada).

### 🕳️ Gap Skill Coverage

- **Situasi**: `sprint.md` Langkah 4 (pre-flight Prisma) cuma cek `migrate status`, tidak cukup untuk mendeteksi schema-ahead-of-migrations drift.
- **Situasi**: `devops.md` tidak cek port availability sebelum `docker compose up` — baru ketahuan gagal setelah dicoba.
- **Situasi**: Tidak ada dokumentasi soal Prisma AI-agent consent gate (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) di skill manapun — kalau tidak familiar, agent bisa bingung/berhenti di error yang sebenarnya straightforward untuk ditangani (minta konfirmasi eksplisit user, lalu jalankan ulang dengan env var itu).
- **Tidak di-handle oleh**: `sprint.md`, `devops.md`.
- **Saran**: Update kedua skill (bukan bikin baru) — lihat tabel kandidat perbaikan di bawah.

### ✅ Yang Berjalan Baik

- Sprint 2 selesai 100% (8/8 task) dalam sekali eksekusi meski ada 2 blocker HIGH di tengah jalan — tidak ada task yang di-skip.
- Migration drift ditangani dengan benar secara arsitektural: dipisah jadi 2 file migration (catch-up vs fitur baru) alih-alih dicampur jadi satu migration raksasa yang membingungkan riwayat.
- Konfirmasi user diminta secara eksplisit dan tepat waktu untuk 2 operasi berisiko (ganti port shared infra, reset DB) — sesuai instruksi `CLAUDE.md` soal operasi berisiko, tidak di-skip meski sedang mode otomatis penuh.
- Prisma AI-agent consent gate dihormati sepenuhnya (tidak dilewati/di-bypass) — konfirmasi baru diminta khusus untuk gate ini, bukan reuse jawaban sebelumnya.
- 46/46 test pass, `type-check` bersih di kedua workspace — tidak ada regresi ke Sprint 1.

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | sprint.md | Pre-flight Prisma cuma cek `migrate status`, tidak deteksi schema-ahead-of-migrations drift | Tambah `prisma migrate diff --from-schema-datasource --to-schema-datamodel` sebelum task migration dimulai | ✅ applied (2026-07-05) |
| MED | sprint.md | Tidak ada dokumentasi Prisma AI-agent consent gate | Tambah section penanganan `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` | ✅ applied (2026-07-05) |
| MED | devops.md | Tidak cek port availability sebelum `docker compose up` | Tambah pre-check `lsof` untuk port di `docker-compose.yml` | ✅ applied (2026-07-05) — ternyata devops.md sudah punya check ini, fix diterapkan di sprint.md yang belum memanggilnya |
| MED | retro.md / pm.md | Recurring blocker 3x tanpa tindak lanjut nyata (test coverage) | Auto-usulkan jadi task eksplisit sprint berikutnya setelah occurrence ≥3 | ✅ applied (2026-07-05) — aturan ditambahkan di retro.md, langsung diterapkan: blocker test coverage dinaikkan MED→HIGH |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Jalankan `/improve` untuk mengaplikasikan 4 perbaikan skill di atas sebelum Sprint 3 dimulai — Sprint 3 murni frontend (tidak sentuh Prisma/Docker), jadi tidak mendesak, tapi sebaiknya tidak menumpuk utang lagi seperti retro Sprint 1.
2. Test coverage `import.ts`/`warga.service.ts` sudah 3x direkomendasikan tanpa tindak lanjut — pertimbangkan buat sebagai sprint kecil tersendiri setelah Sprint 3 selesai, alih-alih terus jadi catatan MED yang lewat begitu saja.
3. Sebelum Sprint 3 (frontend), tidak ada risiko Prisma/Docker — fokus verifikasi `npm run build --workspace=apps/web` karena sprint ini pakai `useSearchParams` yang butuh `<Suspense>` di halaman ter-static-generate (sudah diwanti-wanti di sprint file itu sendiri).

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
