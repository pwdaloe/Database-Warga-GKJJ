# Database Warga GKJJ

Aplikasi manajemen data jemaat **Gereja Kristen Jawa Jakarta (GKJJ)** berbasis web.  
Dibangun dengan arsitektur monorepo untuk mengelola data warga, keluarga, kelompok, wilayah, dan aktivitas gereja secara terpusat.

**Versi:** `v1.0` · **Terakhir diperbarui:** 31 Mei 2026

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Persyaratan](#persyaratan)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Role & Hak Akses](#role--hak-akses)
- [Halaman Publik](#halaman-publik)
- [Kontak & Bantuan](#kontak--bantuan)

---

## Fitur

### Beranda

#### Dashboard
- Statistik ringkasan: **Total Warga**, **Total Keluarga**, **Kelompok Aktif**, **Perlu Divalidasi** (status Draft)
- Setiap kartu statistik bisa diklik untuk navigasi langsung ke halaman terkait
- **Chart distribusi komisi** — bar chart warna-warni menampilkan jumlah anggota per komisi berdasarkan rentang usia (Recharts), rentang usia dapat dikonfigurasi di Pengaturan
- **Peta lokasi warga** — pin interaktif berbasis OpenStreetMap (Leaflet) untuk warga yang memiliki koordinat rumah, dengan filter per kelurahan

---

### Data Jemaat

#### Data Warga
- Tambah, edit, hapus data warga dengan form multi-tab:
  - **Tab Identitas** — nama, foto, NIK, tempat/tanggal lahir, golongan darah
  - **Tab Keanggotaan** — status keluarga (Kepala KK, Istri, Anak, dll.), status keanggotaan, sakramen baptis & sidi
  - **Tab Kontak** — telepon, WhatsApp, email, pendidikan, pekerjaan
  - **Tab Keluarga** — pilih/cari keluarga, atau buat keluarga baru otomatis saat warga sebagai Kepala KK (dengan validasi wajib pilih kelompok)
  - **Tab Alamat** — Alamat KTP, Alamat Domisili (jika berbeda), koordinat GPS (latitude/longitude) dengan panduan Google Maps
- **Foto warga** — upload foto, dikompres otomatis di browser (max 400px, JPEG 80%), disimpan sebagai base64
- **Filter & pencarian** — cari nama, filter per wilayah, kelompok, status keanggotaan, jenis kelamin, status dokumen
- **Status dokumen** — alur Draft → Validasi → Aktif → Tidak Aktif
- **Detail warga** — halaman biodata lengkap, tampilkan foto asli jika ada
- **Wizard tambah warga** — setelah input Kepala KK, lanjut ke step 2 untuk tambah anggota keluarga

#### Data Keluarga
- Tambah, edit, hapus data kepala keluarga (KK)
- Form keluarga baru dengan pemisahan: field Kelompok (wajib, muncul di tab Keluarga) dan Alamat (tab Alamat) — tidak ada duplikasi input
- Detail halaman: info kepala keluarga, tabel anggota, edit alamat inline
- **Autocomplete kelurahan** — ketik nama kelurahan, otomatis isi kecamatan, kota, dan kode pos dari master data
- Aksi: Lihat detail, Edit, Hapus, Approve

#### Kartu Anggota
- Search anggota (minimal 2 huruf) dengan hasil real-time
- **ID Card digital** menampilkan:
  - Logo GKJ Jakarta
  - Foto atau avatar inisial berwarna (biru = laki-laki, pink = perempuan)
  - Nomor induk warga (prioritas `nomorInduk`, fallback ke `nomorAnggota`)
  - Kelompok, wilayah, penatua, status keanggotaan, tanggal validasi
  - Badge Baptis & Sidi
  - **QR Code** yang mengarah ke halaman kartu digital publik
- **Cetak ID Card** — buka jendela print dengan layout 85.6 × 72mm (ukuran kartu), logo GKJ, QR code, siap cetak
- **Kirim via WhatsApp** — buka `wa.me` dengan pesan terformat berisi data keanggotaan + link kartu digital; peringatan jika nomor tidak tersedia
- **Buka Data Warga** — navigasi langsung ke detail biodata

---

### Organisasi

#### Wilayah & Kelompok
- Tampilan accordion per wilayah, expand/collapse
- Setiap wilayah: badge kode, nama, jumlah kelompok, jumlah KK
- Tabel kelompok di dalam setiap wilayah: kode, nama, penatua/PJ, jumlah KK
- Operasi per wilayah: **Edit**, **Aktifkan/Nonaktifkan**, **Hapus** (hanya jika tidak ada KK terdaftar)
- Operasi per kelompok: **Edit**, **Aktifkan/Nonaktifkan**
- Tambah kelompok langsung dari dalam card wilayah

---

### Utilitas

#### Import Data
Wizard 5 langkah untuk import massal data warga dari file Excel:

1. **Upload** — drag & drop atau klik, accept `.xlsx` / `.xls`
2. **Mapping kolom** — tabel pemetaan header Excel ke field sistem, dengan **auto-mapping otomatis** (50+ pola nama kolom)
3. **Preview & validasi** — tampilkan 10 baris pertama, highlight baris bermasalah, summary valid/invalid
4. **Processing** — kirim per batch 100 baris, progress bar real-time
5. **Hasil** — summary sukses/gagal, log per baris dengan alasan kegagalan, download log Excel

**Template Excel** (tombol "Download Template"):
- **Sheet 1 — Data Warga**: 23 kolom, header field wajib ditandai `*`, 2 baris contoh data
- **Sheet 2 — Petunjuk Pengisian**: tabel format & nilai yang diterima per field
- **Sheet 3 — Referensi Kelompok**: daftar kode, nama kelompok, wilayah, dan penatua dari database

#### Perpindahan *(coming soon)*
- Pencatatan masuk, keluar, dan meninggal

---

### Sistem

#### Manajemen Pengguna
- Daftar pengguna: nama, username, email, role, kelompok, status aktif, waktu login terakhir
- Tambah pengguna baru dengan form: nama, username, email, password (min. 8 karakter), role, kelompok
- **Edit** — ubah semua field kecuali password
- **Reset Password** — modal khusus, password baru minimal 8 karakter
- **Toggle Aktif/Nonaktif** — akun nonaktif tidak bisa login
- Akses hanya untuk **Superadmin** dan **Kepala Kantor**

#### Log Aktivitas
- Setiap operasi **POST/PUT/PATCH/DELETE** otomatis dicatat ke tabel `activity_log`
- Data yang dicatat: waktu, method, path, HTTP status, pesan error (jika ada), body snapshot (password disanitasi), IP address, durasi, nama pengguna
- **Filter**: Semua / Error saja / Sukses saja, filter path
- **Klik baris** → expand detail: request body snapshot + pesan error lengkap
- Badge warna per method (POST=biru, PUT=kuning, PATCH=ungu, DELETE=merah) dan status (2xx=hijau, 4xx=oranye, 5xx=merah)
- **Auto-refresh** tiap 30 detik
- Tombol "Bersihkan Log" — hapus entri lebih dari 90 hari

#### Pengaturan
**Tab Rentang Umur Komisi:**
- Konfigurasi min/max usia dan warna per komisi (default: Anak 0–11, Pra-Remaja 12–14, Remaja 15–18, Pemuda 19–35, Dewasa 36–59, Adiyuswa ≥60)
- Edit inline dengan color picker
- Langsung memperbarui chart distribusi di Dashboard

**Tab Master Kelurahan:**
- 63 kelurahan Jakarta Timur pre-seeded (10 kecamatan: Cakung, Cipayung, Ciracas, Duren Sawit, Jatinegara, Kramat Jati, Makasar, Matraman, Pasar Rebo, Pulo Gadung)
- Tabel searchable + filter per kecamatan
- CRUD: tambah, edit, hapus
- Data dipakai untuk **autocomplete** field kelurahan di form Keluarga

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, TanStack Query, React Hook Form, Zod |
| **Grafik** | Recharts |
| **Peta** | React-Leaflet + OpenStreetMap (gratis, tanpa API key) |
| **QR Code** | qrcode |
| **Excel** | SheetJS (xlsx) |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Build Tool** | Turborepo |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |

---

## Struktur Proyek

```
Database-Warga-GKJJ/
├── apps/
│   ├── api/                        # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Skema database
│   │   │   └── seed-master.ts      # Seed kelurahan & komisi config
│   │   └── src/
│   │       ├── middleware/
│   │       │   ├── auth.ts         # JWT authentication
│   │       │   ├── errorHandler.ts # Prisma & Zod error mapping
│   │       │   └── activityLogger.ts # Request logging middleware
│   │       ├── routes/
│   │       │   ├── auth.ts
│   │       │   ├── warga.ts
│   │       │   ├── keluarga.ts
│   │       │   ├── wilayah.ts
│   │       │   ├── kelompok.ts
│   │       │   ├── dashboard.ts    # Stats, komisi chart, peta
│   │       │   ├── pengaturan.ts   # Master kelurahan & komisi config
│   │       │   ├── import.ts       # Batch import Excel
│   │       │   ├── users.ts        # Manajemen pengguna
│   │       │   ├── logs.ts         # Activity log
│   │       │   └── public.ts       # Endpoint publik (tanpa auth)
│   │       ├── services/
│   │       │   ├── warga.service.ts
│   │       │   ├── keluarga.service.ts
│   │       │   └── auth.service.ts
│   │       └── utils/
│   └── web/                        # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── (auth)/login/   # Halaman login
│           │   ├── (dashboard)/    # Halaman yang memerlukan auth
│           │   │   ├── dashboard/  # Dashboard + chart + peta
│           │   │   ├── warga/      # Data warga + wizard
│           │   │   ├── keluarga/   # Data keluarga + detail
│           │   │   ├── kartu/      # Kartu anggota + QR
│           │   │   ├── wilayah/    # Master wilayah & kelompok
│           │   │   ├── import/     # Wizard import Excel
│           │   │   ├── pengguna/   # Manajemen pengguna
│           │   │   ├── log/        # Log aktivitas
│           │   │   └── pengaturan/ # Pengaturan sistem
│           │   └── m/[id]/         # Kartu digital publik (tanpa auth)
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Sidebar.tsx # Navigasi bergroup + v1.0 badge
│           │   │   └── ProtectedRoute.tsx
│           │   └── ui/             # Modal, Badge, Pagination, FormField
│           └── hooks/              # Custom React hooks per domain
├── database/
├── docs/
├── docker-compose.yml
└── package.json
```

---

## Persyaratan

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker Desktop** (untuk PostgreSQL lokal)

---

## Instalasi & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/pwdaloe/Database-Warga-GKJJ.git
cd Database-Warga-GKJJ
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Database

```bash
docker-compose up -d
```

Menjalankan **PostgreSQL** di `localhost:5432`.

### 4. Konfigurasi Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` — ganti `JWT_SECRET` dengan string acak minimal 32 karakter.

### 5. Push Schema & Seed Data

```bash
cd apps/api
npx prisma db push
npx tsx prisma/seed-master.ts   # Seed kelurahan Jakarta Timur + komisi config
```

Akun default setelah seed:

| Field | Value |
|---|---|
| Username | `superadmin` |
| Password | `Admin@GKJJ2025!` |

> **Ganti password segera setelah login pertama!**

### 6. Jalankan Development Server

```bash
npm run dev
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Health Check** | http://localhost:4000/health |

---

## Konfigurasi Environment

### `apps/api/.env`

```env
DATABASE_URL="postgresql://gkjj:gkjj_dev_password@localhost:5432/gkjj_db"
PORT=4000
NODE_ENV=development
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## Database

### Model Utama

| Model | Keterangan |
|---|---|
| `Warga` | Biodata individu jemaat (termasuk foto, alamat KTP/domisili, koordinat GPS) |
| `Keluarga` | Data kepala keluarga beserta alamat rumah tangga |
| `Kelompok` | Unit terkecil organisasi gereja |
| `Wilayah` | Kumpulan beberapa kelompok |
| `User` | Akun pengguna sistem |
| `AuditLog` | Log perubahan data (CREATE, UPDATE, DELETE, APPROVE, VALIDATE, IMPORT) |
| `ActivityLog` | Log seluruh request API mutasi beserta status & error |
| `ImportLog` | Riwayat import Excel |
| `MasterKelurahan` | Master data kelurahan (autocomplete alamat) |
| `KomisiConfig` | Konfigurasi rentang usia per komisi untuk chart |

### Perintah Database

```bash
npx prisma db push          # Sync schema ke database
npx prisma db studio        # Buka Prisma Studio GUI (port 5555)
npx prisma generate         # Regenerate Prisma Client
npx tsx prisma/seed-master.ts  # Seed data master
```

---

## API Endpoints

Base URL: `http://localhost:4000/api`

Semua endpoint (kecuali `/auth/login` dan `/public/*`) memerlukan header:
```
Authorization: Bearer <token>
```

### Autentikasi
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/auth/login` | Login, mendapatkan JWT |
| `GET` | `/auth/me` | Data user yang sedang login |
| `POST` | `/auth/change-password` | Ganti password |
| `POST` | `/auth/logout` | Logout |

### Warga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/warga` | Daftar warga (filter: search, kelompok, wilayah, status, jenis kelamin, dataStatus) |
| `GET` | `/warga/:id` | Detail warga beserta keluarga |
| `POST` | `/warga` | Tambah warga baru (opsional: buat KK baru via `newKeluarga`) |
| `PUT` | `/warga/:id` | Update data warga |
| `DELETE` | `/warga/:id` | Hapus warga |

### Keluarga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/keluarga` | Daftar keluarga |
| `GET` | `/keluarga/:id` | Detail keluarga + anggota |
| `POST` | `/keluarga` | Tambah keluarga |
| `PUT` | `/keluarga/:id` | Update keluarga |
| `DELETE` | `/keluarga/:id` | Hapus keluarga |
| `POST` | `/keluarga/:id/approve` | Approve keluarga |

### Master Data
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET/POST/PUT` | `/wilayah` | CRUD wilayah |
| `PATCH` | `/wilayah/:id/toggle` | Toggle aktif/nonaktif |
| `DELETE` | `/wilayah/:id` | Hapus (jika tidak ada KK) |
| `GET/POST/PUT` | `/kelompok` | CRUD kelompok |
| `PATCH` | `/kelompok/:id/toggle` | Toggle aktif/nonaktif |

### Dashboard
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/dashboard/stats` | Total warga, keluarga, draft |
| `GET` | `/dashboard/komisi-stats` | Distribusi anggota per komisi |
| `GET` | `/dashboard/map` | Koordinat warga (filter: `?kelurahan=`) |

### Pengaturan
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/pengaturan/kelurahan` | Daftar master kelurahan (`?search=`) |
| `POST/PUT/DELETE` | `/pengaturan/kelurahan/:id` | CRUD kelurahan |
| `GET` | `/pengaturan/komisi` | Daftar komisi config |
| `PUT` | `/pengaturan/komisi/:id` | Update rentang usia komisi |

### Sistem
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET/POST/PUT` | `/users` | CRUD pengguna |
| `PATCH` | `/users/:id/toggle` | Toggle aktif/nonaktif |
| `POST` | `/users/:id/reset-password` | Reset password pengguna |
| `GET` | `/logs` | Log aktivitas (filter: status, path, userId) |
| `DELETE` | `/logs` | Hapus log lama (`?days=90`) |
| `POST` | `/import/warga` | Import batch warga dari Excel (max 200 baris per call) |

### Publik (tanpa autentikasi)
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/public/member/:id` | Info anggota terbatas untuk kartu digital |

---

## Role & Hak Akses

| Role | Dashboard | Data Warga | Data Keluarga | Kartu Anggota | Wilayah | Import | Pengguna | Log | Pengaturan |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `SUPERADMIN` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `KEPALA_KANTOR` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `MAJELIS` | ✓ | ✓ | ✓ | ✓ | ✓ (baca) | — | — | — | — |
| `STAF_ADMIN` | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| `PENATUA_KELOMPOK` | ✓ | ✓ (kelompoknya) | ✓ (kelompoknya) | ✓ | — | — | — | — | — |
| `VIEWER` | ✓ | — | — | — | — | — | — | — | — |

---

## Halaman Publik

### Kartu Digital Anggota — `/m/[id]`

Halaman **tanpa login** yang menampilkan kartu keanggotaan digital saat QR code di-scan.

Menampilkan:
- Logo GKJ Jakarta
- Foto atau avatar inisial
- Nama lengkap, nama panggilan
- Nomor anggota (prioritas nomor induk)
- Kelompok, wilayah, penatua
- Status keanggotaan
- Badge Baptis & Sidi

> **Catatan privasi:** Halaman ini TIDAK menampilkan NIK, email, nomor telepon, atau data sensitif lainnya.

**Roadmap QR & Absensi:**
Fondasi URL QR (`{app}/m/{wargaId}`) dirancang untuk mendukung fitur absensi kehadiran ibadah di masa mendatang:
- Anggota scan QR acara → check-in mandiri
- Penatua scan kartu anggota → catat kehadiran
- Laporan kehadiran per acara dan per kelompok

---

## Kontak & Bantuan

Untuk pertanyaan teknis atau bantuan penggunaan sistem:

**Email Helpdesk:** [gkjjkeu@outlook.com](mailto:gkjjkeu@outlook.com)

---

## Lisensi

Proyek ini dikembangkan untuk keperluan internal **GKJJ (Gereja Kristen Jawa Jakarta)**.  
Hak cipta © 2026 GKJJ. Seluruh hak dilindungi.
