# Sprint 8 — Konsistensi Data & Scoping: Tes Round-Trip, Penatua Fail-Closed, Peta per Peran

## Konteks

Sprint ini lahir dari **retro 2026-10-05** (`RETRO.md`). Retro 2026-10-03 sudah mewajibkan blocker
"bug data-nyata lolos dari test" (kini **8x**, HIGH) menjadi task sprint nyata, tetapi sprint-nya tidak
pernah dibuat — dan bug sejenis muncul lagi 4x dalam 2 hari (koordinat/NIK terhapus saat edit role
terbatas, alamat KK dibuang, form detail tanpa foto/alamat/koordinat, nomor WRG vs Induk tidak konsisten).
Akar masalahnya sama: tes menguji tiap lapisan sendiri-sendiri (service dengan prisma di-mock, form
tanpa API), tidak pernah alur **simpan → muat ulang → tampil** per peran.

Selain itu retro menemukan **inkonsistensi scoping** untuk `PENATUA_KELOMPOK`:
- Dashboard sudah **fail-closed** (`apps/api/src/services/dashboardScope.ts`) — penatua tanpa kelompok melihat 0.
- `listWarga`/`getWargaById`/`listKeluarga`/`getKeluargaById` masih **fail-open** (tanpa `kelompokId` → semua data).
- `createWarga` dan `updateWarga` **tidak membatasi tulis**: penatua bisa membuat warga di KK/kelompok lain
  atau memindahkan warga ke KK kelompok lain (hanya frontend `/m` yang mengunci kelompok).
- Peta dashboard (`GET /dashboard/map`) mengirim koordinat ke `VIEWER`, padahal `sanitizeForRole`
  menyembunyikannya. Kebijakan sudah diputuskan pemilik: **semua role editor boleh melihat/mengisi
  koordinat; hanya VIEWER (read-only) yang tidak**.

Pola wajib: gunakan helper yang sudah ada (`wargaScope`/`keluargaScope` di `dashboardScope.ts`,
`wargaToFormDefaults`/`buildWargaPayload` di `apps/web/src/lib/wargaPayload.ts`); **jangan** menduplikasi
logika scoping/pemetaan. Jangan ubah skema database.

## Tasks

### 1. Scoping baca fail-closed untuk Penatua tanpa kelompok

Di `apps/api/src/services/warga.service.ts` dan `keluarga.service.ts`:
- `listWarga` / `listKeluarga`: untuk `PENATUA_KELOMPOK`, gabungkan `wargaScope(user)` / `keluargaScope(user)`
  ke `where` (penatua tanpa `kelompokId` → hasil kosong, bukan semua data). Filter `kelompokId`/`wilayahId`
  dari caller tetap diabaikan untuk penatua, seperti sekarang.
- `getWargaById` / `getKeluargaById`: penatua tanpa `kelompokId` → `403`, bukan lolos.
- Tambah tes service untuk keempat fungsi (penatua dengan kelompok, tanpa kelompok, role lain tidak berubah).

### 2. Batasi TULIS Penatua ke kelompoknya (backend)

- `createWarga`: tambah parameter opsional `user?: JwtPayload` (parameter ke-4; route meneruskan `req.user!`).
  Untuk `PENATUA_KELOMPOK`: `keluargaId` yang diberikan harus milik kelompoknya, `newKeluarga.kelompokId`
  harus sama dengan `user.kelompokId`; selain itu `403`. Penatua tanpa kelompok → `403`.
- `updateWarga`: jika `data.keluargaId` mengubah ke KK lain, KK tujuan harus di kelompok penatua; `newKeluarga.kelompokId` juga harus kelompok penatua.
- `createKeluarga` / `updateKeluarga` (`keluarga.service.ts`, route `POST/PUT /keluarga` terbuka untuk penatua): tambah parameter opsional `user`; KK baru/ubah hanya di kelompok penatua, dan penatua tidak boleh memindahkan KK ke kelompok lain atau mengubah KK milik kelompok lain.
- Tes: penatua membuat warga di KK sendiri (lolos), di KK/kelompok lain (403), tanpa kelompok (403);
  memindahkan ke KK kelompok lain (403). Panggilan lama tanpa `user` tetap berfungsi (tes eksisting tidak berubah).

### 3. Peta dashboard sesuai kebijakan koordinat

- `GET /api/dashboard/map`: untuk `VIEWER` kembalikan array kosong (koordinat disembunyikan untuk VIEWER).
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`: sembunyikan kartu peta untuk `VIEWER`.
- Tes untuk perilaku API (VIEWER → `[]`; role editor → data, tetap ter-scope kelompok untuk penatua).

### 4. Tes round-trip API per peran (service, store in-memory)

Buat `apps/api/tests/services/warga.roundtrip.test.ts` dengan fake `prisma.warga` stateful
(`findUnique`/`findMany`/`update`) sehingga alur **baca (tersaring per peran) → payload seperti dikirim form
(field tersembunyi = `null`) → `updateWarga` → baca ulang** diuji lewat kode service asli. Untuk setiap peran
`SUPERADMIN`, `KEPALA_KANTOR`, `MAJELIS`, `STAF_ADMIN`, `PENATUA_KELOMPOK` assert:
- field yang tidak boleh dilihat peran itu **tidak berubah** di penyimpanan setelah edit field lain;
- field yang diedit **berubah**;
- koordinat/NIK/Alamat KTP tetap utuh sesuai matriks redaksi.

### 5. Tes round-trip form (paritas defaults ↔ payload)

Buat `apps/web/src/lib/wargaPayload.roundtrip.test.tsx`: ambil objek warga lengkap (bentuk respons API,
semua field termasuk foto, alamat KTP/Domisili, koordinat, sakramen, kontak, alamat KK), render `WargaForm`
dengan `wargaToFormDefaults(warga)`, submit tanpa mengubah apa pun, lalu `buildWargaPayload` — assert
**setiap field yang dimuat ikut terkirim dengan nilai sama** (selain field turunan yang memang dibuang).
Tes ini harus gagal bila ada field yang ditambahkan ke form tetapi lupa di-map di `wargaToFormDefaults`.

### 6. Dokumentasi & tracker

- README: bagian Role & Hak Akses (scoping tulis penatua, fail-closed baca), peta (VIEWER), jumlah tes.
- Hitung ulang jumlah tes untuk tabel Pengujian di README.

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm run test --workspace=apps/api
npm run test --workspace=apps/web
npm run build --workspace=apps/web
npm run build --workspace=apps/api
```

Semua harus sukses.

## Definition of Done

- [ ] Penatua tanpa kelompok: `/warga`, `/keluarga`, detail warga, dan detail keluarga tidak mengembalikan data kelompok lain (kosong / 403), konsisten dengan dashboard
- [ ] Penatua tidak bisa membuat warga di KK/kelompok lain maupun memindahkan warga ke KK kelompok lain (403, ada tes)
- [ ] Peta dashboard tidak mengirim/menampilkan koordinat untuk VIEWER; role editor tetap melihat sesuai scoping
- [ ] Tes round-trip API lulus untuk kelima peran; hapus proteksi di `updateWarga` membuatnya gagal (tes benar-benar menguji)
- [ ] Tes round-trip form lulus dan gagal bila satu field dihapus dari `wargaToFormDefaults`
- [ ] Semua tes baru + lama pass, `type-check` dan `build` bersih di `apps/api` dan `apps/web`
- [ ] README diperbarui; blocker "bug data-nyata" di `learning_log.json` diberi catatan tindak lanjut
