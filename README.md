# Database Warga GKJJ

Aplikasi manajemen data jemaat **Gereja Kristen Jawa Jakarta (GKJJ)** berbasis web. Dibangun dengan arsitektur monorepo untuk mengelola data warga, keluarga, kelompok, dan wilayah gereja secara terpusat.

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
- [Import Data](#import-data)
- [Kontribusi](#kontribusi)

---

## Fitur

### Manajemen Data Jemaat
- **Data Warga** — biodata lengkap, status baptis & sidi, status keanggotaan
- **Data Keluarga** — pengelompokan warga per KK beserta alamat lengkap
- **Perpindahan Jemaat** — pencatatan masuk, keluar, dan meninggal

### Organisasi Gereja
- **Wilayah & Kelompok** — struktur organisasi gereja berjenjang
- **Penugasan Penatua** — setiap kelompok memiliki penatua yang terdaftar sebagai warga

### Sistem Pengguna
- Autentikasi JWT dengan role-based access control (RBAC)
- 6 level role: Superadmin, Kepala Kantor, Majelis, Staf Admin, Penatua Kelompok, Viewer
- Penatua Kelompok hanya dapat mengakses data kelompoknya sendiri

### Data & Audit
- Import data massal dari file Excel (.xlsx)
- Log audit lengkap untuk setiap perubahan data (CREATE, UPDATE, DELETE, APPROVE, VALIDATE, IMPORT)
- Alur persetujuan data: `DRAFT → PENDING → APPROVED → VALIDATED`
- Dashboard ringkasan statistik jemaat

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, TanStack Query, React Hook Form |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Build Tool** | Turborepo |
| **Validasi** | Zod |
| **Auth** | JWT (jsonwebtoken) |
| **Upload** | Multer, Cloudinary (opsional) |

---

## Struktur Proyek

```
Database-Warga-GKJJ/
├── apps/
│   ├── api/                  # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Skema database
│   │   │   ├── migrations/   # Riwayat migrasi
│   │   │   └── seed.ts       # Data awal
│   │   └── src/
│   │       ├── middleware/   # Auth, error handler
│   │       ├── routes/       # Endpoint API
│   │       ├── services/     # Business logic
│   │       └── utils/        # Helper & response formatter
│   └── web/                  # Frontend Next.js
│       └── src/
│           ├── app/          # App Router (halaman)
│           ├── components/   # Komponen UI reusable
│           ├── hooks/        # Custom React hooks
│           └── lib/          # API client & utilities
├── packages/
│   └── types/                # Shared TypeScript types
├── database/
│   └── seeds/                # SQL reference (wilayah & kelompok)
├── docs/                     # Dokumentasi tambahan
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Persyaratan

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker Desktop** (untuk PostgreSQL & Redis lokal)

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

Ini akan menjalankan:
- **PostgreSQL** di `localhost:5433`
- **Redis** di `localhost:6379`

### 4. Konfigurasi Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` dan ganti `JWT_SECRET` dengan string acak yang kuat (minimal 32 karakter).

### 5. Migrasi & Seed Database

```bash
npm run db:migrate   # Jalankan migrasi Prisma
npm run db:seed      # Isi master data & akun superadmin
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
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health Check | http://localhost:4000/health |
| Prisma Studio | http://localhost:5555 (via `npm run db:studio`) |

---

## Konfigurasi Environment

### `apps/api/.env`

```env
# Database
DATABASE_URL="postgresql://gkjj:gkjj_dev_password@localhost:5433/gkjj_db"

# Server
PORT=4000
NODE_ENV=development

# JWT — ganti dengan secret yang kuat di production!
JWT_SECRET="ganti-dengan-random-string-minimal-32-karakter"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# File Upload (Cloudinary) — opsional
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## Database

### Skema Utama

| Model | Keterangan |
|---|---|
| `Warga` | Data individu jemaat |
| `Keluarga` | Data kepala keluarga (KK) |
| `Kelompok` | Unit terkecil organisasi gereja |
| `Wilayah` | Kumpulan beberapa kelompok |
| `Perpindahan` | Riwayat masuk/keluar/meninggal |
| `User` | Akun pengguna sistem |
| `AuditLog` | Log seluruh perubahan data |
| `ImportLog` | Riwayat import Excel |

### Perintah Database

```bash
npm run db:migrate      # Jalankan migrasi (development)
npm run db:seed         # Seed data awal
npm run db:studio       # Buka Prisma Studio GUI
npm run db:generate     # Regenerate Prisma Client
```

---

## API Endpoints

Base URL: `http://localhost:4000/api`

### Autentikasi
| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/auth/login` | Login, mendapatkan JWT |
| `GET` | `/auth/me` | Data user yang sedang login |
| `POST` | `/auth/change-password` | Ganti password |
| `POST` | `/auth/logout` | Logout (hapus token di client) |

### Warga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/warga` | Daftar warga (dengan filter & pagination) |
| `GET` | `/warga/:id` | Detail warga |
| `POST` | `/warga` | Tambah warga baru |
| `PUT` | `/warga/:id` | Update data warga |
| `DELETE` | `/warga/:id` | Hapus warga |

### Keluarga
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/keluarga` | Daftar keluarga |
| `GET` | `/keluarga/:id` | Detail keluarga beserta anggota |
| `POST` | `/keluarga` | Tambah keluarga baru |
| `PUT` | `/keluarga/:id` | Update data keluarga |
| `DELETE` | `/keluarga/:id` | Hapus keluarga |

### Master Data
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/wilayah` | Daftar wilayah |
| `GET` | `/kelompok` | Daftar kelompok |

### Lainnya
| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/dashboard` | Statistik ringkasan |
| `POST` | `/import` | Import data dari Excel |

Semua endpoint (kecuali `/auth/login`) memerlukan header:
```
Authorization: Bearer <token>
```

---

## Role & Hak Akses

| Role | Keterangan |
|---|---|
| `SUPERADMIN` | Akses penuh ke seluruh sistem |
| `KEPALA_KANTOR` | Kelola seluruh data jemaat, validasi akhir |
| `MAJELIS` | Approve data, akses baca ke semua wilayah |
| `STAF_ADMIN` | Input & edit data harian |
| `PENATUA_KELOMPOK` | Akses hanya ke kelompoknya sendiri |
| `VIEWER` | Hanya baca, tanpa edit |

---

## Import Data

Mendukung import massal data warga dari file **Excel (.xlsx)**.

1. Login sebagai `STAF_ADMIN` atau di atasnya
2. Buka menu **Import** di sidebar
3. Upload file Excel sesuai format template
4. Sistem akan memproses baris per baris dan menampilkan log sukses/gagal

Hasil import tersimpan di tabel `ImportLog` untuk keperluan audit.

---

## Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi fitur"`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buat Pull Request ke branch `main`

---

## Lisensi

Proyek ini dikembangkan untuk keperluan internal **GKJJ (Gereja Kristen Jawa Jakarta)**.
