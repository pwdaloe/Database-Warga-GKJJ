-- CreateEnum
CREATE TYPE "jenis_catatan_jemaat_enum" AS ENUM ('CATATAN', 'KEBUTUHAN', 'SURVEI');

-- AlterEnum
ALTER TYPE "user_role_enum" ADD VALUE 'JEMAAT';

-- CreateTable
CREATE TABLE "catatan_jemaat" (
    "id" SERIAL NOT NULL,
    "warga_id" INTEGER NOT NULL,
    "jenis" "jenis_catatan_jemaat_enum" NOT NULL DEFAULT 'CATATAN',
    "isi" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catatan_jemaat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catatan_jemaat_warga_id_jenis_idx" ON "catatan_jemaat"("warga_id", "jenis");

-- AddForeignKey
ALTER TABLE "catatan_jemaat" ADD CONSTRAINT "catatan_jemaat_warga_id_fkey" FOREIGN KEY ("warga_id") REFERENCES "warga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
