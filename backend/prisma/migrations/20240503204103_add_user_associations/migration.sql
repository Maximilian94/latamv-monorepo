/*
  Warnings:

  - Added the required column `userId` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `FlightDuty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "FlightDuty" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "FlightDuty" ADD CONSTRAINT "FlightDuty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
