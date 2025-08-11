/*
  Warnings:

  - Made the column `eet` on table `Flight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `eet` on table `Route` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Flight" ALTER COLUMN "eet" SET NOT NULL;

-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "eet" SET NOT NULL;
