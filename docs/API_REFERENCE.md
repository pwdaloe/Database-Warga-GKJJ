# API Reference — Database Warga GKJJ

Base URL: `http://localhost:4000/api`

> Dokumentasi ini di-generate oleh skill `/docs api` dari kode route aktual di `apps/api/src/routes/`.
> Last updated: 8 Juli 2026 (Sprint 5 — Perpindahan Jemaat backend)

## Autentikasi

Semua endpoint (kecuali `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, dan `/public/*`) memerlukan header:
```
Authorization: Bearer <token>
```
Token JWT didapat dari `POST /auth/login`, berlaku sesuai `JWT_EXPIRES_IN` (default 7 hari). Endpoint yang membutuhkan role tertentu ditandai **Role** di bawah; selain itu cukup login (role apa pun).

## Format Response

Semua response sukses mengikuti amplop yang sama:
```json
{ "success": true, "data": { }, "meta": { } }
```
`meta` hanya muncul pada endpoint yang dipaginasi (`total`, `page`, `limit`, `totalPages`). Endpoint `POST` yang membuat resource baru mengembalikan status `201`; `DELETE` yang tidak mengembalikan body memakai status `204`.

Response error:
```json
{ "success": false, "error": "Pesan error dalam Bahasa Indonesia" }
```

**Error umum di semua endpoint:**
| Code | Kondisi |
|---|---|
| 400 | Body/query tidak valid (Zod), atau error bisnis (mis. relasi masih dipakai) |
| 401 | Token tidak ada / tidak valid / expired |
| 403 | Role tidak memiliki akses (`authorize()` gagal) |
| 404 | Resource tidak ditemukan |
| 409 | Konflik unique constraint (Prisma) |

---

## Autentikasi (`/auth`)

### `POST /auth/login`
**Role:** Tanpa auth

**Request Body:**
```json
{ "username": "string", "password": "string" }
```
**Response `201`:** `{ token: string, user: {...} }`

### `GET /auth/me`
Data user yang sedang login (dari token).

### `POST /auth/change-password`
**Request Body:**
```json
{ "passwordLama": "string", "passwordBaru": "string (min. 8 karakter)" }
```

### `POST /auth/logout`
Stateless JWT — hanya konfirmasi, client yang menghapus token tersimpan.

### `POST /auth/forgot-password`
**Role:** Tanpa auth · **Rate limit:** 5 request / 15 menit per IP

**Request Body:**
```json
{ "usernameOrEmail": "string" }
```
Response **selalu generik** (anti user-enumeration) — tidak membocorkan apakah akun terdaftar. Mengirim email berisi link reset (berlaku 30 menit); mode dev (`SMTP_HOST` kosong) link di-log ke console.

### `POST /auth/reset-password`
**Role:** Tanpa auth

**Request Body:**
```json
{ "token": "string (dari link email)", "passwordBaru": "string (min. 8 karakter)" }
```
**Error:** 400 jika token tidak ditemukan/sudah dipakai/expired.

---

## Warga (`/warga`)

### `GET /warga`
**Query:** `page`, `limit`, `search`, `kelompokId`, `wilayahId`, `statusKeanggotaan`, `jenisKelamin`, `dataStatus`, `sudahSidi`, `sudahBaptis`

Response field sensitif (`nik`, koordinat GPS, `alamatKtp`, kontak) di-redaksi otomatis sesuai role (lihat [Role & Hak Akses](../README.md#role--hak-akses) di README).

### `GET /warga/ulang-tahun`
Daftar warga yang berulang tahun bulan ini (untuk widget dashboard/kartu).

### `PATCH /warga/bulk-status`
**Role:** SUPERADMIN, KEPALA_KANTOR, STAF_ADMIN

**Request Body:**
```json
{ "ids": [1, 2, 3], "action": "validate | revert" }
```
Maks 500 id per panggilan. Men-stamp `validatedBy`/`validatedAt` pada tiap baris.

### `GET /warga/:id`
Setiap akses dicatat ke `AuditLog` dengan action `ACCESS` (UU PDP Pasal 16 & 49) — userId, wargaId, IP, timestamp.

### `POST /warga`
**Role:** SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN, PENATUA_KELOMPOK

**Request Body (ringkas):**
```json
{
  "namaLengkap": "string (2-150)",
  "jenisKelamin": "L | P",
  "keluargaId": "number | null",
  "newKeluarga": { "kelompokId": "number", "alamat": "string", "...": "..." },
  "nik": "string (16 digit, opsional)",
  "statusKeluarga": "KEPALA | ISTRI | ANAK | MENANTU | CUCU | LAINNYA",
  "statusKeanggotaan": "AKTIF | NON_AKTIF | KATEKUMEN | PINDAH_KELUAR | MENINGGAL",
  "konsenPDP": "boolean",
  "...": "field kontak, sakramen, alamat, foto — lihat bodySchema di warga.ts"
}
```
`newKeluarga` opsional — dipakai untuk membuat KK baru sekaligus saat warga adalah Kepala Keluarga.

### `PUT /warga/:id`
Sama seperti `POST`, body sama. `tanggalKonsen` **ditentukan server**, bukan dari client — hanya terisi ulang saat transisi belum-setuju → setuju, dikosongkan saat consent ditarik.

### `DELETE /warga/:id`
**Role:** SUPERADMIN, KEPALA_KANTOR

---

## Keluarga (`/keluarga`)

### `GET /keluarga`
**Query:** `page`, `limit`, `search`, `kelompokId`, `wilayahId`, `status`, `dataStatus`

### `GET /keluarga/:id`
Detail keluarga + daftar anggota.

### `POST /keluarga`
**Role:** SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN, PENATUA_KELOMPOK

**Request Body:**
```json
{
  "kelompokId": "number", "kepalakeluargaId": "number | null",
  "alamat": "string", "rt": "string", "rw": "string",
  "kelurahan": "string", "kecamatan": "string", "kota": "string", "kodePos": "string",
  "teleponRumah": "string", "status": "AKTIF | NON_AKTIF", "dataStatus": "DRAFT | VALIDASI | AKTIF | TIDAK_AKTIF"
}
```

### `PUT /keluarga/:id`
Body sama seperti `POST`.

### `DELETE /keluarga/:id`
**Role:** SUPERADMIN, KEPALA_KANTOR

### `POST /keluarga/:id/approve`
**Role:** SUPERADMIN, KEPALA_KANTOR

---

## Perpindahan Jemaat (`/perpindahan`)

Pencatatan pindah masuk/keluar/meninggal dengan **2 tahap sign-off**: `approve` (persetujuan awal) → `validate` (finalisasi, baru di sini `warga.statusKeanggotaan` disinkronkan). Lihat keputusan produk lengkap di [`sprints/sprint_05.md`](../sprints/sprint_05.md).

### `GET /perpindahan`
**Query:** `page`, `limit`, `jenis` (`MASUK`/`KELUAR`/`MENINGGAL`), `search`

### `GET /perpindahan/:id`
Detail perpindahan beserta data warga, approver, dan validator terkait.

### `POST /perpindahan`
**Role:** SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN

**Request Body:**
```json
{
  "wargaId": "number",
  "jenis": "MASUK | KELUAR | MENINGGAL",
  "gerejaAsalTujuan": "string (opsional, maks 200)",
  "tanggalPerpindahan": "string date (opsional)",
  "nomorSurat": "string (opsional, maks 50)",
  "keterangan": "string (opsional)"
}
```

### `PUT /perpindahan/:id`
Body sama seperti `POST` (partial — semua field opsional).

### `POST /perpindahan/:id/approve`
**Role:** SUPERADMIN, KEPALA_KANTOR, MAJELIS

Mengisi `approvedBy` (dari token) dan `approvedAt`. **Tidak** mengubah `warga.statusKeanggotaan`.

### `POST /perpindahan/:id/validate`
**Role:** SUPERADMIN, KEPALA_KANTOR

Mensyaratkan sudah `approved`. Mengisi `validatedBy`/`validatedAt` DAN mengupdate `warga.statusKeanggotaan` dalam satu transaksi sesuai mapping: `MASUK`→`AKTIF`, `KELUAR`→`PINDAH_KELUAR`, `MENINGGAL`→`MENINGGAL`.

**Error:** 400 jika belum di-approve.

### `DELETE /perpindahan/:id`
**Role:** SUPERADMIN, KEPALA_KANTOR

Response `204` tanpa body.

### `GET /perpindahan/:id/surat.pdf`
Generate PDF "Surat Keterangan Pindah/Meninggal Jemaat" (via `pdfkit`), berisi 2 baris tanda tangan (nama + jabatan + tanggal) untuk approver dan validator. Bisa diakses kapan pun sebagai preview draft (tidak mensyaratkan sudah divalidasi). Response `Content-Type: application/pdf`.

### `POST /perpindahan/:id/kirim-email`
**Role:** SUPERADMIN, KEPALA_KANTOR, MAJELIS, STAF_ADMIN

Mengirim PDF surat sebagai lampiran ke email warga (via `nodemailer`).

**Error:** 400 jika belum divalidasi, atau warga belum punya email terdaftar.

---

## Master Data

### Wilayah (`/wilayah`)
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| `GET` | `/wilayah` | login apa pun | Semua wilayah + kelompok + jumlah KK per kelompok. `?all=true` untuk termasuk yang nonaktif |
| `POST` | `/wilayah` | SUPERADMIN, KEPALA_KANTOR | Body: `{ kode, nama, keterangan? }` |
| `PUT` | `/wilayah/:id` | SUPERADMIN, KEPALA_KANTOR | Body sama seperti `POST` |
| `DELETE` | `/wilayah/:id` | SUPERADMIN, KEPALA_KANTOR | 400 jika masih ada KK terdaftar di kelompok manapun di wilayah ini |
| `PATCH` | `/wilayah/:id/toggle` | SUPERADMIN, KEPALA_KANTOR | Toggle `aktif` |

### Kelompok (`/kelompok`)
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| `GET` | `/kelompok` | login apa pun | `?wilayahId=` untuk filter |
| `POST` | `/kelompok` | SUPERADMIN, KEPALA_KANTOR | Body: `{ wilayahId, kode, nama, penatua_nama_temp?, keterangan? }` |
| `PUT` | `/kelompok/:id` | SUPERADMIN, KEPALA_KANTOR | Body sama seperti `POST` |
| `PATCH` | `/kelompok/:id/toggle` | SUPERADMIN, KEPALA_KANTOR | Toggle `aktif` |

---

## Dashboard (`/dashboard`)

### `GET /dashboard/stats`
`{ totalWarga, totalKeluarga, wargaDraft }`

### `GET /dashboard/komisi-stats`
Distribusi jumlah warga aktif per komisi berdasarkan rentang usia yang dikonfigurasi di Pengaturan.

### `GET /dashboard/map`
**Query:** `kelurahan` (opsional)

Koordinat warga (maks 500) yang punya `latitude`/`longitude` terisi, untuk peta di Dashboard.

---

## Pengaturan (`/pengaturan`)

### Master Kelurahan
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| `GET` | `/pengaturan/kelurahan` | login apa pun | `?search=` (maks 20 hasil jika ada search) |
| `POST` | `/pengaturan/kelurahan` | SUPERADMIN, KEPALA_KANTOR | Body: `{ nama, kecamatan, kota, kodePos? }` |
| `PUT` | `/pengaturan/kelurahan/:id` | SUPERADMIN, KEPALA_KANTOR | Body sama seperti `POST` |
| `DELETE` | `/pengaturan/kelurahan/:id` | SUPERADMIN, KEPALA_KANTOR | |

### Komisi Config
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| `GET` | `/pengaturan/komisi` | login apa pun | |
| `PUT` | `/pengaturan/komisi/:id` | SUPERADMIN, KEPALA_KANTOR | Body: `{ nama, minUsia, maxUsia?, urutan, warna }` |

---

## Sistem

### Pengguna (`/users`)
Seluruh endpoint di bawah **Role:** SUPERADMIN, KEPALA_KANTOR (di-guard di level router).

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/users` | Daftar pengguna |
| `POST` | `/users` | Body: `{ nama, username, email, password (min 8), role, kelompokId?, wargaId? }` |
| `PUT` | `/users/:id` | Body sama tanpa `password` |
| `PATCH` | `/users/:id/toggle` | Toggle `aktif` |
| `POST` | `/users/:id/reset-password` | Body: `{ password (min 8) }` |

### Log Aktivitas (`/logs`)
**Role:** SUPERADMIN, KEPALA_KANTOR

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/logs` | Query: `status` (`all`/`success`/`error`), `userId`, `path`, `page`, `limit` (10–200) |
| `DELETE` | `/logs` | `?days=90` — hapus log lebih lama dari N hari |

### Import (`/import`)
| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| `POST` | `/import/warga` | SUPERADMIN, KEPALA_KANTOR, STAF_ADMIN | Body: `{ rows: [...] }`, maks 200 baris. Response: `{ total, berhasil, gagal, log[] }` |
| `POST` | `/import/pengguna` | SUPERADMIN, KEPALA_KANTOR | Body: `{ rows: [...] }`, maks 200 baris, format sama |

---

## Publik (`/public`) — tanpa autentikasi

### `GET /public/member/:id`
Info anggota terbatas untuk kartu digital (dipanggil dari `/m/[id]`). **Tidak** mengembalikan NIK, alamat, koordinat, atau kontak.

**Error:** 400 jika id bukan angka, 404 jika warga tidak ditemukan.
