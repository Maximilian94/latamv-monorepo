/*
  Warnings:

  - The primary key for the `Route` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "Route_id_key";

-- AlterTable
ALTER TABLE "Route" DROP CONSTRAINT "Route_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Route_pkey" PRIMARY KEY ("id");
