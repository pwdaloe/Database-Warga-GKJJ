-- Status keanggotaan baru: Pindah Gereja (pindah ke gereja lain dengan surat atestasi).
-- PINDAH_KELUAR dipertahankan sebagai kode DB, kini berlabel "Pindah Agama".
-- Hanya menambah nilai enum (aman; tidak mengubah baris yang ada).
ALTER TYPE "status_keanggotaan_enum" ADD VALUE IF NOT EXISTS 'PINDAH_GEREJA' BEFORE 'PINDAH_KELUAR';
