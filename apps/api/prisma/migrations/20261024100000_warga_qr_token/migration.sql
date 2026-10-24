-- Sprint 13: token QR acak per warga (pengganti id berurutan di URL publik kartu anggota).
--
-- AMAN dijalankan saat aplikasi lama masih berjalan: hanya MENAMBAH kolom berdefault dan indeks.
-- Aplikasi lama mengabaikan kolom ini dan INSERT-nya otomatis mendapat token dari default.
--
-- Kenapa manual: deploy memakai `prisma db push`, yang MENOLAK menambah constraint unik pada tabel
-- berisi tanpa --accept-data-loss ("A unique constraint ... will be added"). Jalankan SQL ini SEBELUM
-- `deploy/2-deploy.sh prod`; setelah itu `db push` melihat skema sudah sinkron dan tidak meminta apa pun.
--
-- Perlu PostgreSQL >= 13 (gen_random_uuid() bawaan, tanpa ekstensi). Cek: SHOW server_version;
-- PostgreSQL mengisi setiap baris lama dengan nilai default yang berbeda (fungsi volatil dievaluasi per baris)
-- dan menulis ulang tabel sebentar (±1.200 baris: hitungan detik).

BEGIN;

ALTER TABLE "warga"
  ADD COLUMN "qr_token" VARCHAR(32) NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text);

CREATE UNIQUE INDEX "warga_qr_token_key" ON "warga"("qr_token");

COMMIT;

-- Verifikasi (harus: total = unik, format_ok = t):
--   SELECT count(*) AS total, count(DISTINCT qr_token) AS unik, bool_and(qr_token ~ '^[0-9a-f]{32}$') AS format_ok FROM warga;
