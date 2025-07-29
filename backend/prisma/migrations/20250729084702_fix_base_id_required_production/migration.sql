/*
  Warnings:

  - You are about to drop the column `isPrimary` on the `BaseAirport` table. All the data in the column will be lost.
  - Made the column `baseId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_baseId_fkey";

-- AlterTable
ALTER TABLE "BaseAirport" DROP COLUMN "isPrimary";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "baseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
