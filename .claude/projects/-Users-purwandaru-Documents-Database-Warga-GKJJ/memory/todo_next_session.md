---
name: Todo Session Berikutnya
description: Daftar pekerjaan yang belum selesai, dilanjutkan sesi berikutnya
type: project
---

Sesi terakhir: 2026-05-04. Aplikasi sudah bisa dijalankan (API port 4000, Web port 3000).

## Status Aplikasi Saat Ini
- Auth (login/logout/JWT) ✅
- Master data wilayah & kelompok (22 kelompok, 3 wilayah) ✅
- CRUD Keluarga ✅
- CRUD Warga (termasuk field nomorInduk unik) ✅
- Database: PostgreSQL lokal port 5432, user gkjj ✅

## Todo Besok — Prioritas Tinggi

1. **Import Excel data existing**
   - Desain template Excel untuk 2000 warga
   - Upload & mapping kolom Excel → field database
   - Preview + validasi sebelum import
   - Laporan hasil (baris berhasil / gagal)
   - Backend: route POST /api/import, service parsing xlsx

2. **Halaman Detail Warga** (`/warga/[id]`)
   - Info lengkap warga dalam satu halaman
   - Daftar anggota keluarga lain
   - Riwayat perpindahan
   - Tombol edit langsung dari halaman detail

3. **Halaman Detail Keluarga** (`/keluarga/[id]`)
   - Info keluarga + peta alamat (opsional)
   - Daftar anggota dengan tombol tambah anggota baru
   - Tombol approve data (untuk Kepala Kantor)

4. **Dashboard Statistik** (lengkapi dari placeholder)
   - Total warga aktif, per wilayah, per kelompok
   - Breakdown baptis/sidi
   - Grafik sederhana

## Todo Besok — Prioritas Sedang

5. **Manajemen User** (`/pengaturan/users`)
   - List user, tambah user baru, assign role & kelompok
   - Reset password oleh admin

6. **Audit Log viewer** — siapa ubah apa dan kapan

## Todo Mendatang (Phase berikutnya)

7. Export Excel/PDF laporan
8. Surat keterangan keanggotaan (generate PDF)
9. Manajemen perpindahan (masuk/keluar/meninggal)
10. Mobile app (React Native)

## Cara Menjalankan Aplikasi
```bash
# Terminal 1 — API
cd "/Users/purwandaru/Documents/Database Warga GKJJ/apps/api"
npx tsx src/index.ts

# Terminal 2 — Web (jika belum jalan)
cd "/Users/purwandaru/Documents/Database Warga GKJJ/apps/web"
npm run dev
```
Login: username `superadmin`, password `Admin@GKJJ2025!`
