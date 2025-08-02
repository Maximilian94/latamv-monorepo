/*
  Warnings:

  - You are about to drop the column `routeId` on the `Flight` table. All the data in the column will be lost.
  - Added the required column `arrivalIcao` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureIcao` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `flightNumber` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_routeId_fkey";

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "routeId",
ADD COLUMN     "arrivalIcao" TEXT NOT NULL,
ADD COLUMN     "departureIcao" TEXT NOT NULL,
ADD COLUMN     "flightNumber" TEXT NOT NULL;
