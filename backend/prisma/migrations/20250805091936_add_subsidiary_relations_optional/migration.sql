-- AlterTable
ALTER TABLE "Base" ADD COLUMN     "subsidiaryId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subsidiaryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "Subsidiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "Subsidiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
