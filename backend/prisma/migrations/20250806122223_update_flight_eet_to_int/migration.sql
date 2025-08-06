/*
  Warnings:

  - You are about to drop the column `eet` on the `Flight` table. All the data in the column will be lost.
  - You are about to rename the column `eet_seconds` on the `Flight` table to `eet`.

*/
-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "eet";

-- Rename column
ALTER TABLE "Flight" RENAME COLUMN "eet_seconds" TO "eet";
