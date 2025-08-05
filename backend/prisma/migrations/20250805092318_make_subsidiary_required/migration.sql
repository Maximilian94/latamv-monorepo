/*
  Warnings:

  - Made the column `subsidiaryId` on table `Base` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subsidiaryId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Base" ALTER COLUMN "subsidiaryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "subsidiaryId" SET NOT NULL;
