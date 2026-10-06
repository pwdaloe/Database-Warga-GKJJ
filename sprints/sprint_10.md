# Sprint 10 — Akun Pengguna dari Warga, Notifikasi WhatsApp (wa.me), Kontak Gereja & Menu Hubungi

## Konteks

Implementasi fase 1 dan 5 dari `docs/FITUR_NOTIFIKASI_AKUN_WA.md` (keputusan Daru 2026-10-06). Role **Jemaat** (fase 4) dikerjakan di Sprint 11.

Keputusan yang mengikat:
- Password awal **acak per pengguna**, wajib ganti saat login pertama (`mustChangePassword`). Tidak ada password global.
- Kirim lewat **tautan wa.me** (manual tekan Kirim). Hanya SUPERADMIN & KEPALA_KANTOR.
- Template configurable: **Akun Baru** dan **Reset Password**.
- Sumber nomor WA: field WhatsApp di tab Kontak form Warga; centang baru **"boleh ditampilkan ke jemaat"** (default tidak).
- **Kontak Gereja** (WA Center, Kepala Kantor, daftar Pendeta termasuk **Pendeta Emeritus**) diinput manual, masing-masing bisa **diaktifkan/dinonaktifkan**.
- Menu **Hubungi** untuk **semua role**: WA Center, majelis kelompok (otomatis dari data kelompok, hanya jika nomornya boleh ditampilkan), Kepala Kantor, Pendeta.

Pola wajib (retro 2026-10-05): helper bersama untuk pemetaan form↔payload dan **tes round-trip dengan mutation check** untuk field baru di form Warga. Migrasi hanya menambah tabel/kolom (aman untuk data produksi; tidak mengubah data lama).

## Tasks

### 1. Skema & migrasi
- `Warga.whatsappBolehDitampilkan Boolean @default(false)`; `User.whatsapp String? @db.VarChar(20)`.
- `TemplatePesan` (`kode` unik, `nama`, `isi`, `updatedBy`, `updatedAt`), `NotifikasiLog` (userId, templateKode, nomorMasker, pesanMasker, createdBy, createdAt), `KontakGereja` (`jenis` enum WA_CENTER/KEPALA_KANTOR/PENDETA/PENDETA_EMERITUS, `nama`, `whatsapp`, `keterangan`, `aktif`, `urutan`).
- Migration file baru; `prisma generate`.

### 2. Utilitas backend
- `utils/waNumber.ts`: `normalizeWa()` (08xx/+62/62/spasi/strip → 628xx, invalid → null), `waLink(nomor, teks?)`, `maskWa()`.
- `utils/password.ts`: `generatePassword()` (crypto, 10 karakter, tanpa karakter ambigu).
- `services/pesan.service.ts`: template bawaan, `renderTemplate()` (placeholder dikenal saja), `getTemplate()` (upsert default bila belum ada).
- Tes unit untuk ketiganya.

### 3. API pengguna
- `POST /users`: `password` opsional (kosong → acak, `mustChangePassword=true`), `whatsapp` opsional; respons memuat `passwordAwal` **hanya saat dibuat acak**.
- `PUT /users/:id`: terima `whatsapp`.
- `POST /users/:id/reset-password`: `password` opsional (kosong → acak + `mustChangePassword=true`), respons `passwordBaru` bila acak.
- `POST /users/:id/notifikasi` `{ templateKode, password }` → render, `waLink`, catat `NotifikasiLog` (password dimasker). Nomor: `user.whatsapp` ?? `warga.whatsapp`; tanpa nomor → 400.
- Tes route: create acak memuat `passwordAwal` + `mustChangePassword`; password manual tidak; reset acak; notifikasi tanpa nomor 400; log tidak memuat password; role selain SUPERADMIN/KEPALA_KANTOR ditolak.

### 4. API pengaturan & hubungi
- `GET/PUT /pengaturan/template-pesan(/:kode)` + `POST .../preview` (SUPERADMIN, KEPALA_KANTOR).
- `GET/POST/PUT/DELETE /pengaturan/kontak-gereja` + toggle aktif (menulis hanya SUPERADMIN, KEPALA_KANTOR).
- `GET /api/hubungi` (semua role login): `waCenter`, `kepalaKantor[]`, `pendeta[]` (hanya `aktif`, emeritus ditandai), `majelis` (kelompok pengguna → penatua; hanya bila `whatsappBolehDitampilkan` dan nomor valid; kelompok dari `user.kelompokId` atau keluarga warga tertaut). Kembalikan hanya nama + `waLink` (nomor ternormalisasi).
- Tes: item nonaktif tidak muncul; majelis tanpa centang tidak muncul; tanpa kelompok → `majelis: null`; semua role terautentikasi 200, tanpa token 401.

### 5. Warga: centang "boleh ditampilkan ke jemaat"
- Skema API + `WargaForm` (tab Kontak), `wargaToFormDefaults`, `buildWargaPayload`, tampilan detail.
- Tes round-trip diperluas + **mutation check**.

### 6. Web: form Pengguna
- Pemilih warga (cari nama; warga yang sudah punya akun tidak bisa dipilih) mengisi nama/WA/email otomatis; field WhatsApp; password opsional ("kosong = acak").
- Setelah simpan/reset: modal **Info Akun** menampilkan password sekali, pratinjau pesan, tombol **Kirim via WhatsApp** (wa.me) dan Salin. Aksi baris "Kirim info akun" (reset acak + modal).

### 7. Web: Pengaturan & Hubungi
- Pengaturan: tab **Template Pesan** (edit, pratinjau, daftar placeholder, kembalikan default) dan **Kontak Gereja** (daftar per jenis, tambah/ubah/hapus, toggle aktif; Pendeta & Emeritus).
- Halaman `/hubungi` + item sidebar untuk semua role; kontak kosong → pesan pengganti, bukan tautan rusak.

### 8. Dokumentasi & tracker
- Perbarui `docs/FITUR_NOTIFIKASI_AKUN_WA.md` (keputusan), `PANDUAN_PRODUK.md`, README (jumlah tes), CHANGELOG Sprint 10, tracker → 11, sprint_11.md (Role Jemaat).

## Verifikasi

```bash
npm run type-check --workspace=apps/api
npm run type-check --workspace=apps/web
npm test --workspace=apps/api
npm test --workspace=apps/web
npm run build --workspace=apps/web
```

## Definition of Done

1. Membuat pengguna dari warga mengisi nama/WA otomatis; password acak tampil sekali; login pertama memaksa ganti password.
2. Template dapat diubah dari Pengaturan dengan pratinjau; pesan hasilnya memuat portal, username, password.
3. Tombol Kirim membuka `wa.me` dengan nomor ternormalisasi; log tidak menyimpan password.
4. Daftar Pendeta (termasuk Emeritus) dapat diaktifkan/dinonaktifkan; yang nonaktif tidak tampil di Hubungi.
5. Hubungi tampil untuk semua role dengan empat kelompok kontak; majelis hanya tampil bila diberi centang.
6. Semua tes lulus; UI belum divalidasi visual di browser bila tidak ada browser tool (dinyatakan di laporan).
