/*
  Warnings:

  - Added the required column `aircraftRegistration` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aircraftRegistration` to the `FlightDuty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aircraft" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "aircraftRegistration" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FlightDuty" ADD COLUMN     "aircraftRegistration" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "FlightDuty" ADD CONSTRAINT "FlightDuty_aircraftRegistration_fkey" FOREIGN KEY ("aircraftRegistration") REFERENCES "Aircraft"("registration") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_aircraftRegistration_fkey" FOREIGN KEY ("aircraftRegistration") REFERENCES "Aircraft"("registration") ON DELETE RESTRICT ON UPDATE CASCADE;
