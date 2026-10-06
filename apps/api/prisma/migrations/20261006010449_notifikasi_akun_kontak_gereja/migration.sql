-- CreateEnum
CREATE TYPE "jenis_kontak_gereja_enum" AS ENUM ('WA_CENTER', 'KEPALA_KANTOR', 'PENDETA', 'PENDETA_EMERITUS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "whatsapp" VARCHAR(20);

-- AlterTable
ALTER TABLE "warga" ADD COLUMN     "whatsapp_boleh_ditampilkan" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "template_pesan" (
    "id" SERIAL NOT NULL,
    "kode" VARCHAR(40) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "isi" TEXT NOT NULL,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pesan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "template_kode" VARCHAR(40) NOT NULL,
    "nomor_masker" VARCHAR(30) NOT NULL,
    "pesan_masker" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kontak_gereja" (
    "id" SERIAL NOT NULL,
    "jenis" "jenis_kontak_gereja_enum" NOT NULL,
    "nama" VARCHAR(150) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "keterangan" VARCHAR(150),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kontak_gereja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_pesan_kode_key" ON "template_pesan"("kode");

-- CreateIndex
CREATE INDEX "notifikasi_log_user_id_idx" ON "notifikasi_log"("user_id");
