-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FlightDuty" ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false;
