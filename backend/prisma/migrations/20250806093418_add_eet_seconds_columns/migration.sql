-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "eet_seconds" INTEGER;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "eet_seconds" INTEGER;

UPDATE "Route"
SET "eet_seconds" = CAST(split_part("eet", ':', 1) AS INTEGER) * 60;

UPDATE "Flight"
SET "eet_seconds" = CAST(split_part("eet", ':', 1) AS INTEGER) * 60;