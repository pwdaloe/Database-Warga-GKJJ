# Sprint 6 — Test Coverage: Bulk Import & Validasi Warga (Backend)

## Konteks

> **Catatan penomoran**: sprint ini disisipkan sebelum Sprint 7 (Perpindahan Jemaat: Frontend,
> semula bernomor Sprint 6). Dipicu oleh `RETRO.md` entry 2026-07-08, yang menyatakan blocker ini
> HIGH & muncul **5 kali retro berturut-turut** tanpa pernah jadi sprint eksplisit — area ini
> menyentuh ~2000 data warga produksi langsung (bulk import Excel & bulk validasi) tanpa jaring
> pengaman test sama sekali sejak 2026-07-04.

Dua file backend murni logic, 0% test coverage:
- `apps/api/src/routes/import.ts` — bulk import warga (`POST /api/import/warga`) & bulk import
  pengguna (`POST /api/import/pengguna`), maks 200 baris per call, tiap baris diproses independen
  (baris gagal tidak menggagalkan baris lain, hasil dikembalikan sebagai log per baris)
- `apps/api/src/services/warga.service.ts` — CRUD warga inti + `bulkValidasiWarga` (validasi
  massal `DRAFT` → `AKTIF`, dipakai alur cleansing data), termasuk logic sensitif: enkripsi NIK,
  konsen PDP (`konsenPDP`/`tanggalKonsen`), redaksi field per role (`sanitizeForRole`, UU PDP
  Pasal 16), dan scoping akses `PENATUA_KELOMPOK` per kelompok

Ikuti pola test yang sudah ada: mock `../../src/utils/prisma.js` dengan `vi.mock` (lihat
`apps/api/tests/services/perpindahan.service.test.ts` untuk service test, `apps/api/tests/routes/perpindahan.route.test.ts` untuk route test dengan `supertest` + `jwt.sign` token per role).
`import.ts` tidak punya file service terpisah (logic langsung di route handler) — test lewat HTTP
layer dengan `supertest`, bukan test unit terhadap fungsi (fungsi helper seperti `parseDate`/
`normJK`/`normUsername` tidak di-export, jangan export-paksa hanya demi test — cukup verifikasi
lewat behavior endpoint end-to-end per skenario baris).

**Jangan ubah logic di `import.ts`/`warga.service.ts`** kecuali menemukan bug nyata saat menulis
test (kalau ada, catat sebagai temuan terpisah di laporan akhir sprint, jangan diam-diam
diperbaiki tanpa disebutkan — sprint ini murni menambah test, bukan refactor).

## Tasks

### 1. Test route `import.ts` — `POST /api/import/warga`

Buat `apps/api/tests/routes/import.route.test.ts`. Mock `prisma.warga`, `prisma.kelompok`,
`prisma.keluarga`. Cover:

- 403 kalau role tidak diizinkan (cuma `SUPERADMIN`/`KEPALA_KANTOR`/`STAF_ADMIN` yang boleh)
- Baris dengan `namaLengkap` < 2 karakter → gagal dengan alasan "Nama lengkap wajib diisi"
- Baris dengan `jenisKelamin` tidak valid → gagal dengan alasan yang menyebut nilai asli
- Baris dengan NIK yang sudah terdaftar (mock `prisma.warga.findUnique` return existing) → gagal,
  alasan menyebut nama yang sudah pakai NIK itu
- Baris dengan `nomorInduk` duplikat → gagal, alasan menyebut nama pemilik nomor induk
- Baris dengan `kelompokKode` yang tidak ditemukan → gagal
- Baris sukses dengan `statusKeluarga=KEPALA` + `kelompokKode` valid → membuat `keluarga` baru,
  `warga` ter-assign `keluargaId`-nya, dan `keluarga` di-update dengan `kepalakeluargaId`
- Baris sukses tanpa `kelompokKode` → `keluargaId` null, tetap berhasil
- 1 baris gagal + 1 baris sukses dalam 1 request → response `{ total, berhasil, gagal, log }`
  mencerminkan keduanya dengan benar (baris gagal tidak menghentikan proses baris lain)
- Request dengan lebih dari 200 rows → ditolak validasi Zod (400)

### 2. Test route `import.ts` — `POST /api/import/pengguna`

Tambahkan ke file yang sama. Mock `prisma.user`, `prisma.kelompok`, `bcryptjs.hash`. Cover:

- 403 kalau role bukan `SUPERADMIN`/`KEPALA_KANTOR`
- Username < 3 karakter (setelah normalisasi) → gagal
- Email format tidak valid → gagal
- Password < 8 karakter → gagal
- Role tidak ada di daftar `ROLES` → gagal
- Username atau email yang sudah dipakai (mock `prisma.user.findFirst` return existing) → gagal,
  alasan menyebut field mana yang duplikat ("Username" vs "Email")
- `kelompokKode` diisi tapi tidak ditemukan → gagal
- Baris sukses → `bcrypt.hash` dipanggil, `prisma.user.create` dipanggil dengan `passwordHash`
  (bukan plaintext password) dan `role` sesuai

### 3. Test service `warga.service.ts` — `listWarga` & `getWargaById`

Buat `apps/api/tests/services/warga.service.test.ts`. Mock `prisma.warga`, dan
`../../src/utils/crypto.js` (`encryptField`/`decryptField`, cukup passthrough atau prefix
sederhana di mock — tidak perlu enkripsi asli). Cover:

- `listWarga`: role `PENATUA_KELOMPOK` dengan `kelompokId` → `where.keluarga.kelompokId` di-scope
  otomatis ke kelompoknya, mengabaikan filter `kelompokId`/`wilayahId` dari caller
- `listWarga`: search dengan pola NIK (10-16 digit) → memanggil `encryptField` dan menambahkan
  kondisi NIK exact-match terenkripsi di `where.OR`
- `listWarga`: hasil di-redaksi sesuai role — role `VIEWER` tidak boleh melihat `nik`, `alamatKtp`,
  `telepon`, `whatsapp`, `email`, `latitude`, `longitude`; role `SUPERADMIN`/`KEPALA_KANTOR` melihat
  semua field apa adanya
- `getWargaById`: 404 kalau data tidak ditemukan
- `getWargaById`: 403 kalau `PENATUA_KELOMPOK` mengakses warga di luar kelompoknya

### 4. Test service `warga.service.ts` — `createWarga` & `updateWarga`

Tambahkan ke file yang sama. Cover:

- `createWarga`: NIK yang dikirim dienkripsi sebelum `prisma.warga.create` dipanggil (bukan
  plaintext)
- `createWarga`: `konsenPDP=true` → `tanggalKonsen` diisi tanggal saat itu (server-side, bukan
  dari input client meski client kirim `tanggalKonsen` lain)
- `createWarga`: `konsenPDP` tidak dikirim/false → `tanggalKonsen` tetap null
- `createWarga`: `newKeluarga` diberikan & belum ada `keluargaId` → `keluarga` baru dibuat dalam
  transaksi, `nomorKeluarga` di-generate dari ID
- `createWarga`: `statusKeluarga=KEPALA` → `keluarga.kepalakeluargaId` di-update ke ID warga baru
- `createWarga`: `nomorAnggota` di-generate dari ID warga setelah insert (format `WRG00001` dst)
- `updateWarga`: transisi konsen belum-setuju → setuju mengisi `tanggalKonsen` baru; tarik konsen
  (`konsenPDP=false`) mengosongkan `tanggalKonsen`; tetap `true` → `true` tidak mengubah
  `tanggalKonsen` lama
- `updateWarga`: upgrade jadi `KEPALA` tanpa `keluargaId` + `newKeluarga` diberikan → buat KK baru
  dalam transaksi terpisah dari path update biasa

### 5. Test service `warga.service.ts` — `deleteWarga` & `bulkValidasiWarga`

Tambahkan ke file yang sama. Cover:

- `deleteWarga`: 404 kalau warga tidak ditemukan
- `deleteWarga`: 400 kalau warga punya akun `user` terkait (tidak boleh dihapus sebelum akun
  dinonaktifkan)
- `deleteWarga`: sukses kalau tidak ada akun terkait
- `bulkValidasiWarga`: 400 kalau `ids` kosong
- `bulkValidasiWarga`: 400 kalau `ids` lebih dari 500
- `bulkValidasiWarga`: 403 kalau role `PENATUA_KELOMPOK` (tidak boleh validasi sama sekali)
- `bulkValidasiWarga` action `validate`: hanya meng-update warga dengan `dataStatus=DRAFT`
  (where clause), set `validatedBy`/`validatedAt`
- `bulkValidasiWarga` action `revert`: hanya meng-update warga dengan `dataStatus=AKTIF`,
  mengosongkan `validatedBy`/`validatedAt`

## Verifikasi

```bash
npm run test --workspace=apps/api
npm run test:coverage --workspace=apps/api 2>&1 | tail -40
```

Cek coverage `import.ts` dan `warga.service.ts` di `apps/api/coverage/coverage-summary.json` —
keduanya harus ≥ 60% lines (kategori "Acceptable" atau lebih baik per `qa.md`, naik dari 0%).

## Definition of Done

- [ ] `apps/api/tests/routes/import.route.test.ts` dibuat, cover semua skenario Task 1 & 2
- [ ] `apps/api/tests/services/warga.service.test.ts` dibuat, cover semua skenario Task 3, 4, 5
- [ ] Coverage `import.ts` ≥ 60% lines (dari 0%)
- [ ] Coverage `warga.service.ts` ≥ 60% lines (dari 0%)
- [ ] Semua test baru + lama pass (`npm run test --workspace=apps/api`)
- [ ] `type-check` bersih di `apps/api`
- [ ] Tidak ada perubahan logic di `import.ts`/`warga.service.ts` — kalau ditemukan bug nyata saat
      menulis test, dicatat sebagai temuan di laporan akhir sprint, bukan diperbaiki diam-diam
- [ ] Laporan akhir sprint menyebutkan angka coverage sebelum/sesudah untuk kedua file, supaya
      `RETRO.md` bisa menutup blocker recurring ini secara eksplisit
