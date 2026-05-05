-- CreateEnum
CREATE TYPE "status_keluarga_enum" AS ENUM ('AKTIF', 'NON_AKTIF');

-- CreateEnum
CREATE TYPE "data_status_enum" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'VALIDATED');

-- CreateEnum
CREATE TYPE "jenis_kelamin_enum" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "golongan_darah_enum" AS ENUM ('A', 'B', 'AB', 'O');

-- CreateEnum
CREATE TYPE "status_dalam_keluarga_enum" AS ENUM ('KEPALA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'LAINNYA');

-- CreateEnum
CREATE TYPE "status_keanggotaan_enum" AS ENUM ('AKTIF', 'NON_AKTIF', 'KATEKUMEN', 'PINDAH_KELUAR', 'MENINGGAL');

-- CreateEnum
CREATE TYPE "jenis_perpindahan_enum" AS ENUM ('MASUK', 'KELUAR', 'MENINGGAL');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('SUPERADMIN', 'KEPALA_KANTOR', 'MAJELIS', 'STAF_ADMIN', 'PENATUA_KELOMPOK', 'VIEWER');

-- CreateEnum
CREATE TYPE "audit_action_enum" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'VALIDATE', 'IMPORT');

-- CreateEnum
CREATE TYPE "import_status_enum" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "wilayah" (
    "id" SERIAL NOT NULL,
    "kode" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "keterangan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelompok" (
    "id" SERIAL NOT NULL,
    "wilayah_id" INTEGER NOT NULL,
    "kode" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "penatua_id" INTEGER,
    "penatua_nama_temp" VARCHAR(150),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keluarga" (
    "id" SERIAL NOT NULL,
    "nomor_keluarga" VARCHAR(20),
    "kelompok_id" INTEGER,
    "alamat" TEXT,
    "rt" VARCHAR(5),
    "rw" VARCHAR(5),
    "kelurahan" VARCHAR(100),
    "kecamatan" VARCHAR(100),
    "kota" VARCHAR(100),
    "kode_pos" VARCHAR(10),
    "telepon_rumah" VARCHAR(20),
    "status" "status_keluarga_enum" NOT NULL DEFAULT 'AKTIF',
    "data_status" "data_status_enum" NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keluarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warga" (
    "id" SERIAL NOT NULL,
    "keluarga_id" INTEGER,
    "nomor_anggota" VARCHAR(20),
    "nama_lengkap" VARCHAR(150) NOT NULL,
    "nama_panggilan" VARCHAR(50),
    "jenis_kelamin" "jenis_kelamin_enum" NOT NULL,
    "tempat_lahir" VARCHAR(100),
    "tanggal_lahir" DATE,
    "nik" VARCHAR(20),
    "golongan_darah" "golongan_darah_enum",
    "foto_url" TEXT,
    "status_keluarga" "status_dalam_keluarga_enum" NOT NULL DEFAULT 'LAINNYA',
    "status_keanggotaan" "status_keanggotaan_enum" NOT NULL DEFAULT 'AKTIF',
    "sudah_baptis" BOOLEAN NOT NULL DEFAULT false,
    "tanggal_baptis" DATE,
    "tempat_baptis" VARCHAR(150),
    "sudah_sidi" BOOLEAN NOT NULL DEFAULT false,
    "nomor_sidi" VARCHAR(30),
    "tanggal_sidi" DATE,
    "telepon" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" VARCHAR(100),
    "pendidikan_terakhir" VARCHAR(50),
    "pekerjaan" VARCHAR(100),
    "data_status" "data_status_enum" NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perpindahan" (
    "id" SERIAL NOT NULL,
    "warga_id" INTEGER NOT NULL,
    "jenis" "jenis_perpindahan_enum" NOT NULL,
    "gereja_asal_tujuan" VARCHAR(200),
    "tanggal_perpindahan" DATE,
    "nomor_surat" VARCHAR(50),
    "approved_by" INTEGER,
    "validated_by" INTEGER,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perpindahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "warga_id" INTEGER,
    "nama" VARCHAR(150) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role_enum" NOT NULL,
    "kelompok_id" INTEGER,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" "audit_action_enum" NOT NULL,
    "tabel" VARCHAR(50) NOT NULL,
    "record_id" INTEGER NOT NULL,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "filename" VARCHAR(255) NOT NULL,
    "total_rows" INTEGER,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_detail" JSONB,
    "status" "import_status_enum" NOT NULL DEFAULT 'PROCESSING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wilayah_kode_key" ON "wilayah"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "kelompok_kode_key" ON "kelompok"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "keluarga_nomor_keluarga_key" ON "keluarga"("nomor_keluarga");

-- CreateIndex
CREATE INDEX "keluarga_kelompok_id_idx" ON "keluarga"("kelompok_id");

-- CreateIndex
CREATE UNIQUE INDEX "warga_nomor_anggota_key" ON "warga"("nomor_anggota");

-- CreateIndex
CREATE UNIQUE INDEX "warga_nik_key" ON "warga"("nik");

-- CreateIndex
CREATE INDEX "warga_keluarga_id_idx" ON "warga"("keluarga_id");

-- CreateIndex
CREATE INDEX "warga_nama_lengkap_idx" ON "warga"("nama_lengkap");

-- CreateIndex
CREATE INDEX "warga_status_keanggotaan_idx" ON "warga"("status_keanggotaan");

-- CreateIndex
CREATE INDEX "warga_data_status_idx" ON "warga"("data_status");

-- CreateIndex
CREATE UNIQUE INDEX "users_warga_id_key" ON "users"("warga_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_log_tabel_record_id_idx" ON "audit_log"("tabel", "record_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- AddForeignKey
ALTER TABLE "kelompok" ADD CONSTRAINT "kelompok_wilayah_id_fkey" FOREIGN KEY ("wilayah_id") REFERENCES "wilayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelompok" ADD CONSTRAINT "kelompok_penatua_id_fkey" FOREIGN KEY ("penatua_id") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_kelompok_id_fkey" FOREIGN KEY ("kelompok_id") REFERENCES "kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_keluarga_id_fkey" FOREIGN KEY ("keluarga_id") REFERENCES "keluarga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpindahan" ADD CONSTRAINT "perpindahan_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpindahan" ADD CONSTRAINT "perpindahan_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpindahan" ADD CONSTRAINT "perpindahan_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_kelompok_id_fkey" FOREIGN KEY ("kelompok_id") REFERENCES "kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_log" ADD CONSTRAINT "import_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
