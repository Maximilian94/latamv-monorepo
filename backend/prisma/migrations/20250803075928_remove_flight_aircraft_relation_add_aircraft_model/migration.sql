/*
  Warnings:

  - Added the required column `aircraftModel` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_aircraftRegistration_fkey";

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "aircraftModel" TEXT NOT NULL;
