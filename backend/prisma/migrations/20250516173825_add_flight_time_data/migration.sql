/*
  Warnings:

  - You are about to drop the `FlightData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FlightData" DROP CONSTRAINT "FlightData_flightId_fkey";

-- DropForeignKey
ALTER TABLE "FlightData" DROP CONSTRAINT "FlightData_userId_fkey";

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "IN" TIMESTAMP(3),
ADD COLUMN     "OFF" TIMESTAMP(3),
ADD COLUMN     "ON" TIMESTAMP(3),
ADD COLUMN     "OUT" TIMESTAMP(3),
ADD COLUMN     "endAcarsTime" TIMESTAMP(3),
ADD COLUMN     "startAcarsTime" TIMESTAMP(3);

-- DropTable
DROP TABLE "FlightData";
