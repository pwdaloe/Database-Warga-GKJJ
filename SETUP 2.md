# Setup & Cara Menjalankan — Database Warga GKJJ

## Prasyarat
- Node.js >= 20
- Docker Desktop (untuk PostgreSQL lokal)
- npm >= 10

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Jalankan Database (Docker)

```bash
docker-compose up -d
```

PostgreSQL akan berjalan di `localhost:5432`  
Redis akan berjalan di `localhost:6379`

---

## 3. Konfigurasi Environment

```bash
# Sudah otomatis ter-copy dari .env.example
# Edit jika perlu:
nano apps/api/.env
```

Pastikan `JWT_SECRET` diganti dengan string acak yang kuat.

---

## 4. Migrasi & Seed Database

```bash
# Jalankan migrasi Prisma
npm run db:migrate

# Seed master data (wilayah, kelompok, superadmin)
npm run db:seed
```

Akun superadmin default:
- Username: `superadmin`
- Password: `Admin@GKJJ2025!`
- **Ganti password segera setelah login pertama!**

---

## 5. Jalankan Development Server

```bash
# Jalankan API + Web bersamaan
npm run dev

# API  → http://localhost:4000
# Web  → http://localhost:3000
# Health check → http://localhost:4000/health
```

---

## 6. Prisma Studio (GUI Database)

```bash
npm run db:studio
# Buka http://localhost:5555
```

---

## Struktur Proyek

```
gkjj-database/
├── apps/
│   ├── api/          # Backend Express + Prisma
│   │   ├── prisma/   # Schema & migrations
│   │   └── src/      # Source code
│   └── web/          # Frontend Next.js
│       └── src/      # Source code
├── packages/
│   └── types/        # Shared TypeScript types
├── database/
│   └── seeds/        # SQL reference files
├── docs/             # Dokumentasi
├── docker-compose.yml
└── turbo.json
```
