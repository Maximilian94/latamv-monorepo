/*
  Warnings:

  - The primary key for the `AircraftModel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AircraftModel` table. All the data in the column will be lost.
  - You are about to drop the column `aircraft_model_id` on the `Route` table. All the data in the column will be lost.
  - Added the required column `aircraft_model_code` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_aircraft_model_id_fkey";

-- AlterTable
ALTER TABLE "AircraftModel" DROP CONSTRAINT "AircraftModel_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "AircraftModel_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "aircraft_model_id",
ADD COLUMN     "aircraft_model_code" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_aircraft_model_code_fkey" FOREIGN KEY ("aircraft_model_code") REFERENCES "AircraftModel"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
