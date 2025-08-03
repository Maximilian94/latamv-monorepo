/*
  Warnings:

  - The primary key for the `Route` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Route` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Route" DROP CONSTRAINT "Route_pkey",
ADD COLUMN     "ident_iata" TEXT,
ADD COLUMN     "ident_icao" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "Route_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "RouteAircraft" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "aircraftType" TEXT NOT NULL,

    CONSTRAINT "RouteAircraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteAircraft_routeId_aircraftType_key" ON "RouteAircraft"("routeId", "aircraftType");

-- AddForeignKey
ALTER TABLE "RouteAircraft" ADD CONSTRAINT "RouteAircraft_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
