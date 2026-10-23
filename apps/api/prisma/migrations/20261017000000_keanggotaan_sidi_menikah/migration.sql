-- AlterTable
ALTER TABLE "warga" ADD COLUMN     "tempat_sidi" VARCHAR(150),
ADD COLUMN     "sudah_menikah" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tanggal_menikah" DATE,
ADD COLUMN     "tempat_menikah" VARCHAR(150);

-- Tanggal & tempat pemberkatan nikah hanya boleh terisi bila sudah_menikah = true
ALTER TABLE "warga" ADD CONSTRAINT "warga_menikah_konsisten_chk"
  CHECK ("sudah_menikah" OR ("tanggal_menikah" IS NULL AND "tempat_menikah" IS NULL));
