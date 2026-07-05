# Changelog — PM Log
<!-- Dikelola otomatis oleh PM Agent. Jangan edit manual. -->

---

## [2026-07-05 15:32 WIB] — Sprint 3/3 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Minggu, 5 Juli 2026 pukul 15:32 WIB
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 3 Selesai: Reset Password Mandiri — Frontend (Desktop & Mobile)
- `forgotPasswordRequest` & `resetPasswordRequest` ditambahkan di `lib/auth.ts`
- Link "Lupa password?" ditambahkan di halaman login desktop & mobile
- Halaman `/forgot-password` & `/reset-password` (desktop) — `useSearchParams` dibungkus `<Suspense>`
- Halaman `/m/forgot-password` & `/m/reset-password` (mobile), styling konsisten dengan `/m/login`
- Pesan sukses forgot-password tampil persis dari response API (anti user-enumeration, tidak dibuat pesan sendiri)
- Validasi zod: password baru minimal 8 karakter, konfirmasi password harus cocok
- Test baru `ResetPasswordForm.test.tsx`, total 15/15 test pass, `type-check` & `build` bersih
- **Alur end-to-end diverifikasi manual** via `npm run dev`: forgot-password → link muncul di dev email log → reset-password → login dengan password baru berhasil → token yang sama ditolak saat dipakai ulang
- Commit: `cf84b0a`

### ⚠️ Blockers Ditemukan Saat Sprint
Tidak ada blocker saat ini ✅ (sprint ini murni frontend, tidak menyentuh Prisma/Docker)

### 🏃 Next Sprint
Tidak ada sprint berikutnya terdaftar di `sprints/` — Sprint 1–3 (reset password mandiri, end-to-end) sudah selesai semua. Lihat `RETRO.md` untuk rekomendasi siklus berikutnya (test coverage `import.ts`/`warga.service.ts` sudah dieskalasi ke HIGH).

---

## [2026-07-05 15:20 WIB] — Sprint 2/3 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Minggu, 5 Juli 2026 pukul 15:20 WIB
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 2 Selesai: Reset Password Mandiri — Backend (Migration, Email Service, Endpoint)
- Kolom `resetTokenHash` & `resetTokenExpiry` ditambahkan ke model `User` + migration `add_password_reset_token`
- Migration terpisah `sync_schema_with_existing_features` untuk catch-up schema drift dev DB lokal yang belum pernah tercatat (activity_log, master_kelurahan, komisi_config, kepala_keluarga_id, dsb — fitur sprint-sprint sebelumnya)
- `email.service.ts` dibuat dengan fallback `jsonTransport` (tidak butuh SMTP asli untuk dev)
- `requestPasswordReset` & `resetPassword` ditambahkan di `auth.service.ts`, anti user-enumeration (pesan response identik)
- Endpoint `POST /api/auth/forgot-password` (rate limited 5/15menit) & `POST /api/auth/reset-password` ditambahkan, tanpa auth middleware
- Env vars SMTP & `APP_URL` ditambahkan ke `.env.example`
- Test baru: `auth.service.reset.test.ts` & `auth.reset.route.test.ts` — total 46/46 test pass, `type-check` bersih (api & web)
- Commit: `0e1f457`

### ⚠️ Blockers Ditemukan Saat Sprint
- Port Postgres dev (5433) bentrok dengan container project lain (`fw_odoo_db`) — di-resolve dengan pindah ke port 5435 (docker-compose.yml, README.md, .env.example diupdate), dikonfirmasi ke user sebelum diubah
- DB dev lokal drift dari `schema.prisma` (migration history tidak lengkap untuk beberapa fitur lama) — di-resolve dengan `prisma migrate reset` (dikonfirmasi eksplisit ke user karena Prisma AI-safety-gate) lalu reseed data master

### 🏃 Next Sprint
Sprint 3 — Reset Password Mandiri: Frontend (Desktop & Mobile)

---

## [2026-07-05 10:47 WIB] — Sprint 2/3 | ⚠️ AT RISK

**Project**: Database Warga GKJJ
**Reviewed**: Minggu, 5 Juli 2026 pukul 10:47 WIB
**Reviewed by**: Claude Code PM Agent

### 📊 Sprint Status
- **Current**: Sprint 2 — Reset Password Mandiri: Backend (Migration, Email Service, Endpoint)
- **Progress**: 0/8 Definition of Done items selesai (0%)
- **Timeline**: ⚠️ AT RISK — sprint baru saja pindah ke Sprint 2 (belum ada commit kode untuk sprint ini), dan prasyarat teknis (Postgres dev) belum jalan sehingga langkah pertama sprint (migration Prisma) belum bisa dieksekusi

### ✅ Done Since Last Review
- feat(sprint-1): tombol kirim WhatsApp template di kartu anggota mobile (`d63f5a2`) — Sprint 1 selesai & diverifikasi (type-check, build, test 11/11 pass)
- docs: update CHANGELOG PM log & tracker untuk penyelesaian Sprint 1 (`83c8e49`)
- improve(skills): kunci qa/devops/sprint/pm ke stack Express+TS+Prisma & Next.js (`2a19771`)
- `sprints/.current_sprint` sudah maju ke `2`, tapi belum ada kode Sprint 2 (`nodemailer`, `email.service.ts`, `resetTokenHash`, endpoint `forgot-password`) yang dibuat

### ⚠️ Blockers & Risks
| Severity | Item | Sprint Terdampak |
|----------|------|-----------------|
| HIGH | Container Postgres/Redis dev (`docker compose`) belum running — `docker compose ps` kosong meski daemon Docker aktif. Sprint 2 butuh `prisma migrate dev` yang perlu Postgres lokal jalan | Sprint 2 (blocking, task #2) |
| MED | `import.ts` (bulk-import Excel) & `warga.service.ts` (bulk-validate) masih 0% test coverage — carry-over dari 2 review PM sebelumnya, belum ada file test baru untuk keduanya meski Vitest sudah di-setup | Berjalan di produksi tanpa test — risiko terhadap ~2000 data warga |
| LOW | Sprint 3 (frontend reset password) explicit menyatakan "jangan jalankan kalau Sprint 2 belum selesai" — pastikan urutan eksekusi dijaga | Sprint 3 |

### 💡 Rekomendasi PM
1. Jalankan `docker compose up -d` untuk start Postgres & Redis dev sebelum mulai eksekusi Sprint 2 — ini blocker langsung untuk task migration di awal sprint.
2. Tambah test coverage untuk `import.ts` & `warga.service.ts` (bulk-validate) — sudah tiga kali review berturut-turut tanpa tindak lanjut, dan fitur ini menyentuh data produksi ~2000 warga secara langsung.
3. Eksekusi Sprint 2 penuh sesuai desain `jsonTransport` fallback (tidak perlu kredensial SMTP asli malam ini) sebelum lanjut ke Sprint 3 — jangan skip verifikasi `type-check` & `test` di akhir sprint.

### 🏃 Next Sprint
Sprint 3 — Reset Password Mandiri: Frontend (Desktop & Mobile)

---

## [2026-07-05 10:11 WIB] — Sprint 1/3 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Minggu, 5 Juli 2026 pukul 10:11 WIB
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 1 Selesai: Tombol Kirim WhatsApp Template di Kartu Anggota Mobile
- Ekstrak logika kirim WA ke helper bersama `apps/web/src/lib/kartuWhatsapp.ts`
- Halaman desktop `kartu/page.tsx` diupdate memakai helper bersama (tanpa duplikasi kode)
- Tombol kirim WA ditambahkan di hasil pencarian mobile `/m/kartu`, dengan `stopPropagation` agar tidak memicu navigasi
- Tombol "Kirim Kartu via WhatsApp" ditambahkan di halaman detail warga mobile (task opsional #4, ikut dikerjakan)
- Verifikasi: `type-check` ✅, `build` ✅, `test` (11/11) ✅
- Commit: `d63f5a2`

### ⚠️ Blockers Ditemukan Saat Sprint
Tidak ada blocker saat ini ✅ (catatan: `next lint` di-skip karena project belum ada konfigurasi ESLint — di luar scope verifikasi sprint ini)

### 🏃 Next Sprint
Sprint 2 — Reset Password Mandiri: Backend (Migration, Email Service, Endpoint)

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
