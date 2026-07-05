# Changelog — PM Log
<!-- Dikelola otomatis oleh PM Agent. Jangan edit manual. -->

---

## [2026-07-05 10:01 WIB] — Sprint 1/3 | ✅ ON TRACK

**Project**: Database Warga GKJJ
**Reviewed**: Minggu, 5 Juli 2026 pukul 10:01 WIB
**Reviewed by**: Claude Code PM Agent

### 📊 Sprint Status
- **Current**: Sprint 1 — Tombol Kirim WhatsApp Template di Kartu Anggota Mobile
- **Progress**: 0/6 Definition of Done items selesai (0%)
- **Timeline**: ✅ ON TRACK — sprint plan baru dibuat kemarin (2026-07-04), scope kecil & murni frontend (tanpa perubahan backend), belum ada indikasi keterlambatan

### ✅ Done Since Last Review
- docs: README.md diperbarui ke v1.2 (fitur yang belum tercatat didokumentasikan)
- docs: panduan penatua kelompok + sprint plan untuk 3 sprint ke depan (WA mobile, reset password backend, reset password frontend)
- fix: samakan port `DATABASE_URL` di README & `.env.example` dengan `docker-compose.yml`
- Belum ada commit kode untuk Sprint 1 itu sendiri — `apps/web/src/lib/kartuWhatsapp.ts` (task #1 sprint) belum dibuat

### ⚠️ Blockers & Risks
| Severity | Item | Sprint Terdampak |
|----------|------|-----------------|
| MED | `import.ts` (bulk-import Excel) & `warga.service.ts` (bulk-validate) masih 0% test coverage — menyentuh ~2000 data warga produksi langsung | Carry-over dari review sebelumnya, belum ditindaklanjuti |
| LOW | `docs/final-import-pengguna.xlsx` untracked di working tree — perlu dipastikan bukan file berisi data warga asli sebelum ter-commit tidak sengaja | N/A |
| LOW | Docker daemon tidak berjalan — status healthy Postgres/Redis dev (`docker-compose.yml`) tidak bisa diverifikasi otomatis | Sprint 2 (butuh migration DB) |

### 💡 Rekomendasi PM
1. Mulai eksekusi Sprint 1 — scope kecil (4 task, murni frontend, tanpa backend), cocok diselesaikan cepat sebelum lanjut ke Sprint 2 yang lebih besar (migration + email service).
2. Tambah test coverage untuk `import.ts` & `warga.service.ts` (bulk-validate) sebelum operasi bulk berikutnya menyentuh data produksi — sudah dua kali review berturut-turut tanpa tindak lanjut.
3. Periksa `docs/final-import-pengguna.xlsx` (untracked) — pastikan tidak berisi data warga asli sebelum di-commit atau hapus jika hanya file sisa proses import.

### 🏃 Next Sprint
Sprint 2 — Reset Password Mandiri: Backend (Migration, Email Service, Endpoint)

---

## [2026-07-04 18:50 WIB] — Continuous Delivery | ⚠️ AT RISK

**Project**: Database Warga GKJJ
**Reviewed**: Sabtu, 4 Juli 2026 pukul 18:50 WIB
**Reviewed by**: Claude Code PM Agent

### 📊 Status
- **Model kerja**: Belum sprint-aware (tidak ada folder `sprints/`) — analisis berbasis git log & kondisi repo.
- **Total commit**: 25 (sepanjang riwayat repo)
- **Commit 7 hari terakhir**: 1 — `9d54a08 feat: tambah fitur bulk-import pengguna via Excel + migration & seed penatua kelompok` (2026-07-03)
- **Commit hari ini**: 0
- **Area paling aktif minggu ini**: fitur import pengguna (`apps/web/.../pengguna/page.tsx`, `ImportPenggunaModal.tsx`, `apps/api/src/routes/users.ts`, `import.ts`, migration `add_warga_validated_by`, `seed.ts`)

### ✅ Done Since Last Review
- Fitur bulk-import pengguna via Excel (username/penatua kelompok) + migration & seed pendukung
- Fix: trust proxy untuk express-rate-limit di belakang Nginx
- Fix: deploy script PM2 selalu jalan dari root user
- Fitur Validasi Data warga (bulk validate/revert + stamp)
- Setup infrastruktur testing (Vitest) di `apps/api` dan `apps/web` — 35 test backend (auth, error handler, enkripsi field) + 11 test frontend (Badge, Pagination), semua passing
- Perbaikan konfigurasi email PM Agent: `scripts/pm_email.applescript` dikunci ke `daru@sunartha.co.id`, CC list tim `@sunartha.co.id` (tidak relevan untuk project pribadi ini) dihapus

### ⚠️ Blockers & Risks
| Severity | Item | Dampak |
|----------|------|--------|
| MED | Fitur bulk-import (Excel) & bulk-validate warga — dua area paling berisiko karena langsung menyentuh ~2000 data warga produksi — masih 0% test coverage (`import.ts` 313 baris, `warga.service.ts` 349 baris) | Risiko silent bug di operasi bulk produksi |
| LOW | Working tree berisi banyak perubahan belum di-commit (setup testing, `CLAUDE.md`, `.claude/commands/`, `scripts/`) sejak sesi ini | Kalau belum di-commit, hilang kalau ada reset/checkout tidak sengaja |
| LOW | Docker daemon tidak berjalan di mesin ini — `docker-compose.yml` (postgres + redis dev) tidak bisa diverifikasi status healthy-nya | Development lokal yang bergantung container ini perlu Docker Desktop dinyalakan dulu |

### 💡 Rekomendasi PM
1. Prioritaskan `/qa write` untuk `import.ts` (bulk import Excel) dan `warga.service.ts` (bulk validate/revert) — area produksi paling berisiko dan saat ini paling tidak teruji.
2. Commit perubahan yang masih ada di working tree (setup Vitest + 46 test yang sudah lulus, fix email PM Agent) supaya jadi baseline yang aman, bukan cuma tersimpan lokal.
3. Nyalakan Docker Desktop kalau development lokal butuh Postgres/Redis dari `docker-compose.yml`.

### 🏃 Next
Belum ada sprint terjadwal — lanjutkan model continuous delivery, dengan fokus jangka pendek pada penambahan test coverage di area bulk-operasi sebelum menambah fitur baru.

---
