/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Route` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Route_id_key" ON "Route"("id");
