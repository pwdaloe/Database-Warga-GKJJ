-- Kolom nomor_sidi tidak dipakai lagi (Sprint 12). Di produksi sudah di-DROP manual (skrip deploy memakai db push).
ALTER TABLE "warga" DROP COLUMN IF EXISTS "nomor_sidi";
