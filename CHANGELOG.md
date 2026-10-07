# Changelog — PM Log
<!-- Dikelola otomatis oleh PM Agent. Jangan edit manual. -->

---

## [2026-10-07 WIB] — Maintenance | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Rabu, 7 Oktober 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Perbaikan: KK ganda setelah Kepala Keluarga pindah KK (laporan produksi: Tri Endah Sulantari)
- **Gejala**: satu warga tampil di dua baris Data Keluarga dengan kepala yang sama
- **Akar masalah** (dibuktikan dari `activity_log` produksi): warga Kepala KK dipindah ke KK lain (`LAINNYA` di KK 70), lalu dijadikan Kepala lagi sehingga sistem membuat KK baru (KK 105).
  `kepala_keluarga_id` di KK lama (87, kini kosong) tidak dibersihkan, jadi KK kosong itu masih menunjuk dia sebagai kepala
- **Perbaikan**: `updateWarga` mengosongkan `kepala_keluarga_id` di KK lama (hanya bila warga itu memang kepalanya) saat ia pindah KK, membentuk KK baru, atau tidak lagi berstatus KEPALA;
  edit biasa tidak memakai transaksi tambahan. Data Keluarga memberi lencana **"KK kosong"** pada KK tanpa anggota
- **Tes**: 6 tes baru (`warga.kepala-kk.test.ts`), mutation check (pelepasan dimatikan → 4 gagal); API 293, web 127
- **Data produksi yang sudah terlanjur** tidak diubah oleh perbaikan ini: KK 87 perlu dihapus manual oleh Superadmin/Kepala Kantor, dan posisi Tri Endah (KK 70 vs KK 105) perlu dikonfirmasi staf

### ✅ Pembersihan data produksi (dilakukan manual oleh Daru, 2026-10-07)
- 14 KK kosong dihapus: KLG00008, 28, 33, 34, 36–40, 42–45, 87. Rinciannya: 1 duplikat kasus Tri Endah, 2 tanpa kepala (sisa data uji),
  11 sisa KK batch 5 Okt yang kepalanya sudah dipindah ke KK lain (warga nyata, divalidasi, dientry user 1). Backup `gkjj_prod_20261007_172955.dump` dibuat sebelumnya; query KK kosong setelahnya: 0 baris
- Keputusan staf: Tri Endah tetap Kepala di KK 105

### ✅ Perbaikan UI hapus KK
- Temuan: tombol hapus hanya ada di daftar Data Keluarga (Superadmin/Kepala Kantor); halaman detail KK tidak punya; penolakan server (KK masih punya anggota) dibuang diam-diam sehingga tombol terlihat tidak berfungsi
- `HapusKeluargaModal` dipakai di daftar dan detail: peringatan + tombol nonaktif bila KK masih punya anggota, pesan galat server tampil di modal, kembali ke daftar setelah hapus dari detail
- Tombol **Hapus KK** dan lencana "KK kosong" di halaman detail. 4 tes baru (mutation check: penampil galat dimatikan → 1 gagal); web 131 tes lulus
- Catatan alat uji: Vitest 4 menandai promise tertolak yang dikembalikan `vi.fn` sebagai galat tes walau sudah ditangani komponen; tes jalur galat memakai fungsi biasa

### ⚠️ Blockers Ditemukan
- Perbaikan KK-pindah (78b3660) sudah dideploy; perbaikan UI hapus KK belum dideploy (perubahan tampilan saja, tanpa skema)

---

## [2026-10-06 WIB] — Sprint 11/11 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Selasa, 6 Oktober 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 11 Selesai: Role Jemaat — Profil Saya, Verifikasi Staf, Catatan Jemaat
- **Role `JEMAAT`** (wajib tertaut ke warga; pembuatan lewat form Pengguna, tidak bisa lewat import Excel). Akun tanpa tautan: 403 fail-closed
- **Pagar global `jemaatGuard`**: banyak route lama hanya memakai `authenticate` tanpa `authorize` (GET `/warga`, `/keluarga`, `/dashboard`, …), sehingga
  role baru akan lolos ke sana walau `authorize(...)` tidak menyebut JEMAAT. Pagar menolak JEMAAT di **semua** route `/api/*` kecuali Profil Saya, Hubungi (GET),
  auth, system, public, dan autocomplete kelurahan. Route baru otomatis tertutup. Tes: 22 jalur ditolak (termasuk route yang belum ada); mutation check (pagar dimatikan → 13 tes gagal)
- **Profil Saya** (`GET/PUT /api/profil-saya`): id warga selalu dari akun login, bukan parameter. Whitelist Zod `.strict()` — nama lengkap, status keanggotaan, sakramen,
  relasi keluarga, `dataStatus`, konsen, koordinat → 400. Field: identitas (nama panggilan, tempat/tanggal lahir, NIK, golongan darah), kontak (telepon, WhatsApp + centang
  tampilkan, email, pendidikan, pekerjaan), alamat (KTP, domisili + centang "berbeda dengan KTP"), catatan jemaat
- **Alamat KK hanya kepala keluarga**: non-kepala 403 dan **tidak ada** field lain di request yang sama yang tertulis; kolom terkunci di UI
- **NIK**: 16 digit, bentrok dengan warga lain ditolak, terenkripsi, dimasker di tampilan (`3171••••••••0001`), tidak ada di audit log; kosong = tidak diubah
- **Verifikasi staf**: setiap perubahan mengembalikan `dataStatus` ke DRAFT (KK ikut), menandai `diubahMandiriAt` (badge "Diubah mandiri oleh jemaat" di Validasi Data), tercatat di
  `audit_log` (nilai lama/baru, `sumber: jemaat`); validasi staf mengosongkan penanda. Validator: Superadmin, Kepala Kantor, Staf Admin
- **Catatan jemaat** terpisah (`catatan_jemaat`, kolom `jenis` CATATAN/KEBUTUHAN/SURVEI siap dikembangkan); tampil bagi staf di Detail Warga; `Warga.catatan` internal tidak tersentuh
- **Web**: halaman Profil Saya 3 tab (mobile-first), sidebar & redirect pasca-login ke Profil Saya, `ProtectedRoute` membatasi JEMAAT, role Jemaat di form Pengguna (wajib pilih warga)
- **Migrasi aditif** (`role_jemaat_catatan`, `warga_diubah_mandiri`; nilai enum baru `JEMAAT`), data lama tidak berubah
- Tes: API 232 → 287 (+55), web 110 → 127 (+17); **mutation check**: hapus field dari `getProfil` → 2 tes gagal; hapus pengecekan kepala keluarga → 1 gagal; hapus field dari helper form → 1 gagal.
  Diverifikasi juga dengan query nyata ke DB lokal (baris uji dibuat lalu dihapus): kepala mengubah profil/KK/catatan, anggota ditolak 403 dan KK tidak berubah

### ⚠️ Blockers Ditemukan Saat Sprint
- UI Profil Saya **belum divalidasi visual di browser** (hanya tes komponen, type-check, build, dan query nyata ke DB lokal)
- Migrasi Sprint 10 dan 11 **belum dijalankan di produksi** (`prisma migrate deploy` — konfirmasi Daru). Nilai enum `JEMAAT` ditambahkan lewat `ALTER TYPE ADD VALUE`
- Aplikasi mobile `/m` tidak disesuaikan untuk JEMAAT; API menolak, dan halaman dialihkan ke Profil Saya (LOW)
- Belum ada alur membuat akun Jemaat massal (hanya satu per satu lewat form Pengguna)

### 🏃 Next Sprint
Belum direncanakan. Kandidat: pembuatan akun Jemaat massal (pilih banyak warga → kirim wa.me berurutan), survei/kebutuhan jemaat (`CatatanJemaat.jenis`), pengingat belum login

---

## [2026-10-06 WIB] — Sprint 10/11 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Selasa, 6 Oktober 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 10 Selesai: Akun Pengguna dari Warga, Notifikasi WhatsApp (wa.me), Kontak Gereja & Menu Hubungi
- **Skema** (migrasi aditif `20261006010449_notifikasi_akun_kontak_gereja`, tidak mengubah data lama): `Warga.whatsappBolehDitampilkan`, `User.whatsapp`,
  tabel `template_pesan`, `notifikasi_log`, `kontak_gereja` (+ enum jenis: WA Center, Kepala Kantor, Pendeta, Pendeta Emeritus)
- **Pengguna**: pemilih warga mengisi nama/WA/email otomatis (warga yang sudah punya akun tidak bisa dipilih); password kosong → **acak 10 karakter**,
  `mustChangePassword = true`, tampil **sekali** di modal Info Akun; reset password kosong → acak juga. Perbaikan sampingan: form edit sebelumnya tidak
  mengirim `wargaId` sehingga menyimpan = melepas tautan warga; sekarang `wargaId` ikut dikirim
- **Notifikasi**: `POST /users/:id/notifikasi` merender template (Akun Baru / Reset Password) dan membuat tautan **wa.me**; log hanya menyimpan nomor & password
  yang dimasker. Nomor dinormalisasi (`08xx`/`+62` → `628xx`); nomor tidak valid → 400, tidak pernah membuat tautan rusak
- **Pengaturan**: tab **Template Pesan** (edit, pratinjau langsung, validasi placeholder, kembalikan ke bawaan) dan **Kontak Gereja** (WA Center, Kepala Kantor,
  Pendeta & Pendeta Emeritus; masing-masing dapat diaktifkan/dinonaktifkan)
- **Hubungi** (semua role): WA Center, majelis kelompok (otomatis dari kelompok; hanya bila penatua mencentang "boleh ditampilkan ke jemaat" di tab Kontak warga),
  Kepala Kantor, Pendeta; respons hanya memuat nama + tautan, bukan nomor mentah
- **Form Warga**: centang "boleh ditampilkan ke jemaat"; round-trip + paritas skema diperluas, **mutation check** (hapus pemetaan field → 2 tes gagal)
- Tes: API 192 → 232 (+40), web 106 → 110 (+4); `type-check` dan `build` bersih. `PORTAL_URL` (env, default `https://jemaat.gkjjakarta.org`) menentukan `{{url_portal}}`

### ⚠️ Blockers Ditemukan Saat Sprint
- UI (modal Info Akun, tab Pengaturan, halaman Hubungi) **belum divalidasi visual di browser** — hanya tes komponen + type-check + build
- Tes komponen `InfoAkunModal` untuk jalur galat gagal aneh bila dijalankan lewat mock `api` (galat tampil sebagai kegagalan tes walau UI benar; hook yang sama
  lulus di tes terisolasi). Dipindah ke tes dengan hook di-mock; penyebab pastinya belum ditemukan (LOW)
- Migrasi baru **belum dijalankan di produksi**; deploy memerlukan `prisma migrate deploy` (konfirmasi Daru)
- Belum ada commit; pekerjaan masih di working tree

### 🏃 Next Sprint
Sprint 11: Role Jemaat (lihat & ubah data pribadi, alamat KK hanya kepala keluarga, antrean verifikasi, catatan jemaat)

---

## [2026-10-05 23:45 WIB] — Sprint 9/9 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Senin, 5 Oktober 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 9 Selesai: Penomoran KK Aman, Form Keluarga Satu Jalur, Tes Stabil
- `createKeluarga`: nomor KK = `KLG` + ID baris dalam transaksi (sebelumnya `KLG` + `count()+1` → duplikat/500 setelah ada KK terhapus
  atau dua permintaan bersamaan; kolom `nomor_keluarga` `@unique`). Konsisten dengan `warga.service` dan `import.ts`; nomor lama tidak bentrok
  (nomor lama ≤ ID barisnya < ID baru). 5 tes baru; **mutation check** (kembali ke `count()`) membuat 5 tes gagal
- Form Keluarga satu jalur: `keluargaToFormDefaults`/`buildKeluargaPayload` (`apps/web/src/lib/keluargaPayload.ts`) dipakai `keluarga/page.tsx`
  dan `keluarga/[id]/page.tsx`; string kosong sekarang tersimpan `NULL` (sebelumnya `''`); tes round-trip + paritas skema ↔ nilai awal
  (mutation check: hapus satu field → 3 tes gagal)
- Tes API stabil: `retry: 2` di `apps/api/vitest.config.ts`. **Akar flake**: supertest membuka server sementara per permintaan →
  `socket hang up` saat mesin sibuk (direproduksi 1 dari 4 run paralel; setelah retry 10 dari 10 run paralel lulus). Bukan bug aplikasi.
  Kegagalan deterministik tetap gagal 3x
- `.gitignore`: `docs/final-import-*.xlsx` (file lokal berisi data pengguna); file asli tidak diubah
- Total tes: API 187 → 192, web 101 → 106; `type-check` dan `build` bersih di kedua workspace
- Commit: lihat riwayat git (sprint 9)

### ⚠️ Blockers Ditemukan Saat Sprint
- Tidak ada blocker baru. Catatan: KK yang sudah ada dengan `kelompokId` kosong lolos validasi API (`kelompokId` opsional) walau form mewajibkan pilih kelompok —
  tidak diubah di sprint ini (LOW)
- Tampilan di perangkat nyata (bar pembaruan, form Keluarga) masih hanya terverifikasi lewat tes & build

---

## [2026-10-05 22:30 WIB] — Sprint 8/8 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Senin, 5 Oktober 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 8 Selesai: Konsistensi Data & Scoping — Tes Round-Trip, Penatua Fail-Closed, Peta per Peran
- Scoping baca Penatua **fail-closed** (`listWarga`/`listKeluarga`/`getWargaById`/`getKeluargaById`) memakai helper bersama `dashboardScope.ts`; penatua tanpa kelompok tidak lagi melihat semua data
- **Batas tulis penatua** di backend: `createWarga`, `updateWarga` (pindah KK), `createKeluarga`, `updateKeluarga` — KK/kelompok di luar miliknya → 403 (celah ditemukan retro: sebelumnya hanya UI `/m` yang mengunci kelompok)
- `GET /dashboard/map`: VIEWER mendapat `[]`; kartu peta disembunyikan untuk VIEWER
- Tes round-trip API per peran (`warga.roundtrip.test.ts`, 22 tes, store in-memory) dan tes round-trip form (`wargaPayload.roundtrip.test.tsx`, 5 tes, termasuk penjaga paritas skema ↔ `wargaToFormDefaults`); **mutasi uji** (proteksi tulis / satu field dimatikan) terbukti membuat tes gagal
- Tes baru: `keluarga.service.test.ts`, `dashboard.route.test.ts`, tambahan di `warga.service.test.ts`
- Total tes: API 126 → 178, web 69 → 74; `type-check` dan `build` bersih di kedua workspace
- Commit: lihat riwayat git (sprint 8)

### ⚠️ Blockers Ditemukan Saat Sprint
- Penomoran KK `nomorKeluarga = KLG + (count()+1)` di `createKeluarga` rawan duplikat/bentrok setelah ada data terhapus atau pembuatan bersamaan (path warga memakai ID, path ini tidak). MED — belum dikerjakan
- Uji tampilan di perangkat nyata (iPhone, peta VIEWER) belum dilakukan; hanya verifikasi kode & tes

---

## [2026-07-09 08:05 WIB] — Sprint 7/7 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Kamis, 9 Juli 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 7 Selesai: Perpindahan Jemaat — Frontend (List, Form, Cetak PDF, Email, WhatsApp)
- `hooks/usePerpindahan.ts`: list + mutations (create/update/approve/validate/remove/kirimEmail)
- `lib/perpindahanWhatsapp.ts`: build pesan & kirim WhatsApp ringkasan surat
- Halaman `/perpindahan`: filter jenis+search, badge status 3 kondisi (Menunggu
  Approval/Disetujui/Divalidasi) dengan info nama & tanggal approver/validator, aksi
  role-gated (Approve/Validate/Cetak PDF/Kirim Email/Kirim WhatsApp/Hapus)
- `PerpindahanForm.tsx`: search-select warga, validasi wargaId & jenis wajib
- Test baru: `PerpindahanForm.test.tsx` (3 test) + `perpindahanWhatsapp.test.ts` (4 test) —
  total test suite `apps/web` 22/22 pass, `type-check` & `build` bersih
- Verifikasi end-to-end manual via API (server dev sementara, port terpisah dari dev
  server user yang stale): catat → approve (status warga belum berubah) → validate
  (status → PINDAH_KELUAR) → cetak PDF (valid, 1995 bytes) → kirim email (dev log
  terkonfirmasi) — semua sesuai DoD
- Commit: `5bfa313`

### ⚠️ Blockers Ditemukan Saat Sprint
- Dev server API milik user di port 4000 ternyata proses lama (sejak 5 Juli, sebelum
  Sprint 5-7 ada) tanpa hot-reload aktif — tidak dikenali route Perpindahan/Import
  terbaru. Tidak disentuh (bukan proses yang dimulai sesi ini); verifikasi manual
  dilakukan lewat instance sementara di port lain. User disarankan restart dev server
  API-nya sendiri kalau ingin mencoba fitur ini secara interaktif.

### 🏃 Next Sprint
Belum ada sprint terjadwal berikutnya (Sprint 1-7 semua selesai). Rekomendasi retro
2026-07-08 masih berlaku untuk siklus berikutnya — lihat `RETRO.md`.

---

## [2026-07-08 20:55 WIB] — Sprint 6/7 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Rabu, 8 Juli 2026
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 6 Selesai: Test Coverage — Bulk Import & Validasi Warga (Backend)
- Sprint disisipkan sebelum Sprint 7 (Perpindahan Jemaat: Frontend, semula bernomor Sprint 6) —
  dipicu gate baru di `sprint.md` yang membaca `RETRO.md` sebelum mulai: blocker test coverage
  `import.ts`/`warga.service.ts` sudah HIGH & muncul 5x retro berturut-turut tanpa pernah jadi
  sprint eksplisit
- `apps/api/tests/routes/import.route.test.ts` (18 test): `POST /api/import/warga` &
  `/api/import/pengguna` — validasi baris, duplikat NIK/nomorInduk/username/email, resolve
  kelompok & buat KK baru, generate nomorAnggota, batas 200 rows, password ter-hash bukan plaintext
- `apps/api/tests/services/warga.service.test.ts` (26 test): `listWarga` (scoping
  `PENATUA_KELOMPOK`, search NIK terenkripsi, redaksi field per role UU PDP Pasal 16),
  `getWargaById`, `createWarga`/`updateWarga` (enkripsi NIK, transisi konsen PDP,
  buat KK baru), `deleteWarga`, `bulkValidasiWarga`
- Coverage naik dari 0%: `import.ts` 5.21% → 91.3%, `warga.service.ts` 3.61% → 97.59%
- Total test suite: 107/107 pass, `type-check` bersih di `apps/api`
- Tidak ada perubahan logic di `import.ts`/`warga.service.ts` — murni penambahan test
- Commit: `54c3e39`

### ⚠️ Blockers Ditemukan Saat Sprint
Tidak ada blocker ✅

### 🏃 Next Sprint
Sprint 7 — Perpindahan Jemaat: Frontend (List, Form, Cetak PDF, Email, WhatsApp)

---

## [2026-07-08 19:42 WIB] — Sprint 5/6 | ✅ DONE

**Project**: Database Warga GKJJ
**Reviewed**: Rabu, 8 Juli 2026 pukul 19:42 WIB
**Reviewed by**: Claude Code Sprint Agent

### ✅ Sprint 5 Selesai: Perpindahan Jemaat — Backend (CRUD, Approval, Surat PDF, Email)
- Migration `perpindahan_approver_ke_user`: `Perpindahan.approvedBy`/`validatedBy` dipindah dari `Warga` ke `User` (staf yang login selalu punya identitas via JWT, tidak semua staf punya baris `Warga`), tambah field `approvedAt`/`validatedAt`
- `perpindahan.service.ts`: list/get/create/update/approve/validate/delete, 2 tahap sign-off (approve → validate)
- Sinkronisasi otomatis `warga.statusKeanggotaan` saat **validate** (bukan approve): MASUK→AKTIF, KELUAR→PINDAH_KELUAR, MENINGGAL→MENINGGAL, dalam satu transaksi
- `surat.service.ts`: generate PDF "Surat Keterangan Pindah/Meninggal Jemaat" via `pdfkit`, dengan 2 baris tanda tangan (nama + jabatan + tanggal) untuk approver dan validator
- `email.service.ts` di-extend dengan `sendSuratPerpindahanEmail` (lampiran PDF, reuse transporter yang ada)
- Route `perpindahan.ts`: endpoint CRUD + `approve`/`validate` (role-gated berbeda tingkat) + `surat.pdf` (preview kapan saja) + `kirim-email` (hanya setelah validated)
- Test baru: `perpindahan.service.test.ts` (11 test) + `perpindahan.route.test.ts` (7 test) — total 63/63 test pass, `type-check` & `build` bersih di `apps/api`
- Commit: `514cc4b`

### ⚠️ Blockers Ditemukan Saat Sprint
- npm cache global (`~/.npm`) berisi file root-owned dari bug npm versi lama, menyebabkan `EACCES` saat install `pdfkit`/`date-fns` — di-resolve dengan cache folder sementara tanpa perlu `sudo chown` di mesin user

### 🏃 Next Sprint
Sprint 6 — Perpindahan Jemaat: Frontend (List, Form, Cetak PDF, Email, WhatsApp)

---

## [2026-07-08 18:57 WIB] — Sprint 4/7 | ✅ DONE (backfill retroaktif)

**Project**: Database Warga GKJJ
**Reviewed**: Rabu, 8 Juli 2026
**Reviewed by**: Claude Code Sprint Agent

> **Catatan**: entry ini ditulis retroaktif pada 2026-07-09 (saat eksekusi Sprint 7), dipicu gate
> "cek commit yatim" baru di `sprint.md`. Sprint 4 dikerjakan 2026-07-08 di luar alur `/sprint`
> normal (permintaan langsung user di tengah sesi lain, commit `1f2d520` tanpa label sprint), lalu
> didokumentasikan retroaktif di `sprints/sprint_04.md` — tapi laporan PM/CHANGELOG-nya baru
> menyusul sekarang. Lihat `RETRO.md` entry 2026-07-08 (section "Gap Skill Coverage") untuk detail
> gap ini.

### ✅ Sprint 4 Selesai: Kepatuhan PDP — Cookie Consent, Kebijakan Privasi, Konsen per-Warga
- Halaman `/kebijakan-cookie` dan `/kebijakan-privasi` (UU PDP No. 27/2022), bisa diakses tanpa login
- Cookie consent banner site-wide (pilihan "Hanya Esensial"/"Terima Semua" di `localStorage`), link kebijakan di footer login desktop & mobile
- Field `konsenPDP`/`tanggalKonsen` per-warga disambungkan penuh: `tanggalKonsen` ditentukan server (bukan client), hanya diisi ulang saat transisi belum-setuju → setuju, dikosongkan saat consent ditarik
- Checkbox konsen PDP di form warga (desktop) + tampilan status di halaman detail warga
- Skill baru `/eval` untuk evaluasi usulan fitur sebelum sprint planning, langsung diuji dengan audit kepatuhan PDP (`evals/EVAL_pdp-data-warga-jemaat_2026-07-08.md`) — menemukan 2 gap belum dikerjakan (lihat Rekomendasi)
- Verifikasi manual end-to-end via curl: create/tarik/re-consent PDP semua sesuai ekspektasi; type-check & build bersih di `apps/api`/`apps/web`
- Commit: `1f2d520`

### ⚠️ Blockers Ditemukan Saat Sprint
Tidak ada blocker ✅

### 💡 Rekomendasi PM
1. Gap dari audit `/eval`: visibilitas status konsen (badge/filter) di list `/warga` belum ada (effort kecil)
2. Kebijakan retensi (`retensiHingga`) butuh keputusan pengurus gereja dulu sebelum bisa dirancang teknis — **NEEDS MORE INFO**, bukan keputusan sepihak engineering
3. (Sudah ditindaklanjuti di Sprint 6) Test coverage `warga.service.ts`/`import.ts` — resolved 2026-07-08/09, lihat entry Sprint 6/7 di atas

### 🏃 Next Sprint
Sprint 5 — Perpindahan Jemaat: Backend (CRUD, Approval, Surat PDF, Email)

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
