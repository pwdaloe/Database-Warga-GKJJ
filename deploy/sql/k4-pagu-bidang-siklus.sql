-- K4 (v0.4.0) aplikasi Kegiatan: pagu bidang, proyeksi Kas Jemaat, tahap siklus, potret versi program.
-- ADITIF (tidak menghapus apa pun). Jalankan MANUAL di VPS SEBELUM deploy v0.4.0, di database gkjj_kegiatan:
--   sudo -u postgres psql gkjj_kegiatan -f k4-pagu-bidang-siklus.sql
-- Alasan: `prisma db push` tidak menambah nilai enum di database berisi dengan aman (pelajaran Sprint 13).
-- Setelah itu `prisma db push` menjadi no-op. Cadangkan database lebih dulu dan deploy hanya di jadwal sepi.
-- Setiap ALTER TYPE ... ADD VALUE dijalankan sebagai pernyataan terpisah (bukan dalam satu transaksi).
-- CreateEnum
CREATE TYPE "tahap_versi_enum" AS ENUM ('USULAN', 'RUMUSAN', 'DISETUJUI');
-- AlterEnum
ALTER TYPE "status_pengajuan_enum" ADD VALUE 'PRA_MUKER';
ALTER TYPE "status_pengajuan_enum" ADD VALUE 'MUKER';
ALTER TYPE "status_pengajuan_enum" ADD VALUE 'DITETAPKAN';
-- AlterTable
ALTER TABLE "tahun_anggaran" ADD COLUMN     "proyeksi_kas_jemaat" BIGINT NOT NULL DEFAULT 0;
-- CreateTable
CREATE TABLE "pagu_bidang" (
    "id" SERIAL NOT NULL,
    "tahun_id" INTEGER NOT NULL,
    "bidang_id" INTEGER NOT NULL,
    "nilai" BIGINT NOT NULL DEFAULT 0,
    "catatan" VARCHAR(255),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pagu_bidang_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "program_versi" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "tahap" "tahap_versi_enum" NOT NULL,
    "data" JSONB NOT NULL,
    "total_rab" BIGINT NOT NULL,
    "dana_gereja" BIGINT NOT NULL,
    "dibuat_oleh" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "program_versi_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "pagu_bidang_tahun_id_bidang_id_key" ON "pagu_bidang"("tahun_id", "bidang_id");
-- CreateIndex
CREATE UNIQUE INDEX "program_versi_program_id_tahap_key" ON "program_versi"("program_id", "tahap");
-- AddForeignKey
ALTER TABLE "pagu_bidang" ADD CONSTRAINT "pagu_bidang_tahun_id_fkey" FOREIGN KEY ("tahun_id") REFERENCES "tahun_anggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "pagu_bidang" ADD CONSTRAINT "pagu_bidang_bidang_id_fkey" FOREIGN KEY ("bidang_id") REFERENCES "bidang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "program_versi" ADD CONSTRAINT "program_versi_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program_kerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Kepemilikan: dijalankan sebagai postgres, objek baru jadi milik postgres sehingga pengguna aplikasi (dan pg_dump di
-- skrip deploy) ditolak ("permission denied for table pagu_bidang"). Samakan pemilik dengan tabel lama.
DO $$
DECLARE o text;
BEGIN
  SELECT tableowner INTO o FROM pg_tables WHERE tablename = 'pengguna';
  EXECUTE format('ALTER TABLE pagu_bidang OWNER TO %I', o);
  EXECUTE format('ALTER TABLE program_versi OWNER TO %I', o);
  EXECUTE format('ALTER SEQUENCE pagu_bidang_id_seq OWNER TO %I', o);
  EXECUTE format('ALTER SEQUENCE program_versi_id_seq OWNER TO %I', o);
  EXECUTE format('ALTER TYPE tahap_versi_enum OWNER TO %I', o);
END $$;
