# Sprint 9 — Penomoran KK Aman, Form Keluarga Satu Jalur, Tes Stabil

## Konteks

Sprint ini menutup pekerjaan yang tersisa dari **Sprint 8 dan retro 2026-10-05**:

1. **`nomorKeluarga` di `createKeluarga` rawan bentrok.** `KLG` + `count()+1` menghasilkan nomor duplikat bila ada KK
   yang pernah dihapus (jumlah baris < id tertinggi) atau dua permintaan bersamaan, padahal kolom `nomor_keluarga`
   `@unique` → permintaan gagal 500. Tiga jalur lain (`warga.service` ×2, `import.ts`) sudah memakai ID baris.
2. **Form Keluarga mengulang pola bug yang sama dengan form Warga**: pemetaan nilai awal terduplikasi di dua halaman
   (`keluarga/page.tsx`, `keluarga/[id]/page.tsx`) dan payload dikirim mentah (string kosong `''` tersimpan
   sebagai `''`, bukan `null`). Sprint 8 hanya menutup form Warga.
3. **Tes API rapuh saat mesin sibuk**: `import.route.test.ts` gagal acak dua kali (`socket hang up` dari supertest,
   direproduksi: 1 dari 4 run paralel). Bukan bug aplikasi, tetapi membuat sinyal tes tidak bisa dipercaya.
4. **Kebersihan repo**: `docs/final-import-pengguna.xlsx` (kemungkinan berisi kredensial awal) masih untracked dan
   rawan ter-commit tidak sengaja.

Pola wajib: helper bersama, tidak menduplikasi pemetaan; tes round-trip dengan mutation check (lihat `/qa` 4.3b).
Jangan ubah skema database.

## Tasks

### 1. Penomoran KK berbasis ID di `createKeluarga`

Di `apps/api/src/services/keluarga.service.ts`:
- Ganti `count()+1` dengan pola yang sudah dipakai jalur lain: buat KK dalam transaksi tanpa `nomorKeluarga`, lalu isi
  `KLG` + `padStart(id, 5, '0')`. Hasil tetap kompatibel dengan nomor lama (nomor lama ≤ id barisnya < id baru → tidak bentrok).
- Tes: dengan `count()` yang "salah" (mis. 3 sementara id baru 10) nomor tetap `KLG00010`; dua pembuatan berurutan
  menghasilkan nomor berbeda; nomor tidak lagi memanggil `count()`.

### 2. Form Keluarga: satu jalur nilai awal & payload

- Buat `apps/web/src/lib/keluargaPayload.ts`: `keluargaToFormDefaults(k)` dan `buildKeluargaPayload(formData)` (string kosong → `null`).
- Pakai di `keluarga/page.tsx` dan `keluarga/[id]/page.tsx` (hapus duplikasi pemetaan inline).
- Ekspor skema `KeluargaForm` untuk tes paritas.
- Tes round-trip (`keluargaPayload.roundtrip.test.tsx`): objek KK lengkap → nilai awal → render `KeluargaForm` → submit tanpa
  ubah → payload sama untuk setiap field; setiap field skema dipetakan oleh `keluargaToFormDefaults`; string kosong → `null`.
  **Mutation check**: hapus satu field dari helper → tes gagal.

### 3. Stabilkan tes API

- `apps/api/vitest.config.ts`: `retry: 2` dengan komentar alasan (supertest membuka server per permintaan; `socket hang up`
  saat beban tinggi). Kegagalan deterministik tetap gagal 3x, jadi tidak menutupi bug sungguhan.
- Catat penyebab & reproduksi di CHANGELOG.

### 4. Kebersihan repo

- `.gitignore`: tambah `docs/final-import-*.xlsx` (file lokal berisi data pengguna; tidak boleh ter-commit tidak sengaja).
  Jangan hapus/ubah file itu.

### 5. Dokumentasi & tracker

- README: jumlah tes, catatan penomoran KK.
- CHANGELOG entry Sprint 9; tracker ke 10; `learning_log.json` (blocker `nomorKeluarga` resolved, flake dicatat).

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm run test --workspace=apps/api
npm run test --workspace=apps/web
npm run build --workspace=apps/web
npm run build --workspace=apps/api
```

Semua harus sukses. Tambahan: jalankan suite API 4x paralel sekali untuk memastikan retry meredam `socket hang up`.

## Definition of Done

- [ ] `createKeluarga` tidak memakai `count()`; nomor KK = `KLG` + ID baris; tes membuktikan tidak bentrok saat `count()` < id
- [ ] Pemetaan nilai awal & payload Keluarga hanya ada di satu helper, dipakai kedua halaman; string kosong terkirim sebagai `null`
- [ ] Tes round-trip Keluarga lulus dan gagal bila satu field dihapus dari helper (mutation check)
- [ ] Suite API stabil pada run paralel (retry aktif, deterministik tetap gagal bila memang salah)
- [ ] `docs/final-import-pengguna.xlsx` tidak muncul lagi di `git status`, file asli tidak berubah
- [ ] Semua tes baru + lama pass, `type-check` dan `build` bersih di `apps/api` dan `apps/web`
