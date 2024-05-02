/*
  Warnings:

  - Added the required column `routeId` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/


-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "routeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
