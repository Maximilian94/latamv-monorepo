/*
  Warnings:

  - Added the required column `index` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "index" INTEGER NOT NULL;
