/*
  Warnings:

  - Made the column `aircraftModel` on table `Flight` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Flight" ALTER COLUMN "aircraftModel" SET NOT NULL;

-- Atualiza os dados existentes
UPDATE "Flight" SET "aircraftModel" = 'Unknown' WHERE "aircraftModel" IS NULL;

-- Torna a coluna obrigatória
ALTER TABLE "Flight" ALTER COLUMN "aircraftModel" SET NOT NULL;