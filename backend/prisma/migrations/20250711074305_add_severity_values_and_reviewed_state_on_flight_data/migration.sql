-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "amountOfProactiveExcellence" INTEGER,
ADD COLUMN     "amountOfProceduralDeviation" INTEGER,
ADD COLUMN     "amountOfSafetyCompromise" INTEGER,
ADD COLUMN     "amountOfStandardCompliance" INTEGER,
ADD COLUMN     "isReviewed" BOOLEAN NOT NULL DEFAULT false;
