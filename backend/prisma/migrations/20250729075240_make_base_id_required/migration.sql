/*
  Warnings:

  - You are about to drop the column `isPrimary` on the `BaseAirport` table. All the data in the column will be lost.
  - Made the column `baseId` on table `User` required. This step will now succeed because we update existing NULL values first.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_baseId_fkey";

-- AlterTable
ALTER TABLE "BaseAirport" DROP COLUMN "isPrimary";

-- Update existing users to have baseId = 1 (São Paulo base) before making it required
UPDATE "User" SET "baseId" = 1 WHERE "baseId" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "baseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 