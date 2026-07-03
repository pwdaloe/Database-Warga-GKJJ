-- AlterTable
ALTER TABLE "warga" ADD COLUMN "validated_by" INTEGER,
ADD COLUMN "validated_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "warga" ADD CONSTRAINT "warga_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
