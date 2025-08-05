/*
  Warnings:

  - Made the column `subsidiaryId` on table `Base` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subsidiaryId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/

-- Insert LATAM Brasil subsidiary if it doesn't exist
INSERT INTO "Subsidiary" ("id", "name", "code", "icaoCode", "description", "country", "createdAt", "updatedAt")
VALUES (1, 'LATAM Brasil', 'LATAM_BR', 'TAM', 'LATAM Airlines Brasil', 'BR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Update existing users with null subsidiaryId to LATAM Brasil (ID: 1)
UPDATE "User" SET "subsidiaryId" = 1 WHERE "subsidiaryId" IS NULL;

-- Update existing bases with null subsidiaryId to LATAM Brasil (ID: 1)
UPDATE "Base" SET "subsidiaryId" = 1 WHERE "subsidiaryId" IS NULL;

-- AlterTable
ALTER TABLE "Base" ALTER COLUMN "subsidiaryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "subsidiaryId" SET NOT NULL;
