/*
  Warnings:

  - You are about to drop the column `eet_seconds` on the `Flight` table. All the data in the column will be lost.
  - Changed the type of `eet` on the `Flight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "eet_seconds",
DROP COLUMN "eet",
ADD COLUMN     "eet" INTEGER NOT NULL;
