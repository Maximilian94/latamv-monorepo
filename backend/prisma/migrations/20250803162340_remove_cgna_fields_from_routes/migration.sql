/*
  Warnings:

  - You are about to drop the column `flight_level` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `flight_number` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `rmk` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `speed` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `weekday` on the `Route` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Route" DROP COLUMN "flight_level",
DROP COLUMN "flight_number",
DROP COLUMN "rmk",
DROP COLUMN "route",
DROP COLUMN "speed",
DROP COLUMN "weekday";
