/*
  Warnings:

  - You are about to drop the column `eet` on the `Route` table. All the data in the column will be lost.
  - You are about to rename the column `eet_seconds` on the `Route` table to `eet`.

*/
-- AlterTable
ALTER TABLE "Route" DROP COLUMN "eet";

-- Rename column
ALTER TABLE "Route" RENAME COLUMN "eet_seconds" TO "eet";
