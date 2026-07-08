-- DropForeignKey
ALTER TABLE "perpindahan" DROP CONSTRAINT "perpindahan_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "perpindahan" DROP CONSTRAINT "perpindahan_validated_by_fkey";

-- AlterTable
ALTER TABLE "perpindahan" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "validated_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "perpindahan" ADD CONSTRAINT "perpindahan_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perpindahan" ADD CONSTRAINT "perpindahan_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
