-- AlterEnum
ALTER TYPE "audit_action_enum" ADD VALUE 'ACCESS';

-- AlterEnum
BEGIN;
CREATE TYPE "data_status_enum_new" AS ENUM ('DRAFT', 'VALIDASI', 'AKTIF', 'TIDAK_AKTIF');
ALTER TABLE "public"."keluarga" ALTER COLUMN "data_status" DROP DEFAULT;
ALTER TABLE "public"."warga" ALTER COLUMN "data_status" DROP DEFAULT;
ALTER TABLE "keluarga" ALTER COLUMN "data_status" TYPE "data_status_enum_new" USING ("data_status"::text::"data_status_enum_new");
ALTER TABLE "warga" ALTER COLUMN "data_status" TYPE "data_status_enum_new" USING ("data_status"::text::"data_status_enum_new");
ALTER TYPE "data_status_enum" RENAME TO "data_status_enum_old";
ALTER TYPE "data_status_enum_new" RENAME TO "data_status_enum";
DROP TYPE "public"."data_status_enum_old";
ALTER TABLE "keluarga" ALTER COLUMN "data_status" SET DEFAULT 'DRAFT';
ALTER TABLE "warga" ALTER COLUMN "data_status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "keluarga" ADD COLUMN     "kepala_keluarga_id" INTEGER;

-- AlterTable
ALTER TABLE "warga" ADD COLUMN     "alamat_domisili" TEXT,
ADD COLUMN     "alamat_ktp" TEXT,
ADD COLUMN     "konsen_pdp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "nomor_induk" VARCHAR(30),
ADD COLUMN     "retensi_hingga" TIMESTAMP(3),
ADD COLUMN     "tanggal_konsen" TIMESTAMP(3),
ALTER COLUMN "nik" SET DATA TYPE VARCHAR(64);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "user_nama" VARCHAR(150),
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "error_message" TEXT,
    "body_snapshot" JSONB,
    "ip_address" VARCHAR(45),
    "durasi_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_kelurahan" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kecamatan" VARCHAR(100) NOT NULL,
    "kota" VARCHAR(100) NOT NULL,
    "kode_pos" VARCHAR(10),

    CONSTRAINT "master_kelurahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "komisi_config" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "min_usia" INTEGER NOT NULL,
    "max_usia" INTEGER,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "warna" VARCHAR(20) NOT NULL DEFAULT '#6366f1',

    CONSTRAINT "komisi_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_log_user_id_idx" ON "activity_log"("user_id");

-- CreateIndex
CREATE INDEX "activity_log_status_code_idx" ON "activity_log"("status_code");

-- CreateIndex
CREATE INDEX "master_kelurahan_nama_idx" ON "master_kelurahan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "warga_nomor_induk_key" ON "warga"("nomor_induk");

-- CreateIndex
CREATE INDEX "warga_nomor_induk_idx" ON "warga"("nomor_induk");

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_kepala_keluarga_id_fkey" FOREIGN KEY ("kepala_keluarga_id") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
