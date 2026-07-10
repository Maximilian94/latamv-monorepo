-- CreateEnum
CREATE TYPE "ProcedureStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Verifiability" AS ENUM ('AUTO', 'MANUAL', 'NOT_SIMULATED');

-- CreateEnum
CREATE TYPE "ProcedureItemSource" AS ENUM ('FCOM', 'OPERATOR_POLICY');

-- CreateEnum
CREATE TYPE "ValidationRuleType" AS ENUM ('SNAPSHOT', 'CONTINUOUS', 'PRECONDITION', 'SEQUENCE');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "checklistItemId" INTEGER;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "procedureVersionId" INTEGER;

-- CreateTable
CREATE TABLE "AircraftPackage" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatarefCatalog" (
    "id" SERIAL NOT NULL,
    "packageId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "datarefName" TEXT NOT NULL,
    "unit" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'float',
    "arrayIndex" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatarefCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureVersion" (
    "id" SERIAL NOT NULL,
    "aircraftModelCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ProcedureStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "baseScore" INTEGER NOT NULL DEFAULT 100,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "weightStd" INTEGER NOT NULL DEFAULT 0,
    "weightExc" INTEGER NOT NULL DEFAULT 1,
    "weightDev" INTEGER NOT NULL DEFAULT -5,
    "weightCmp" INTEGER NOT NULL DEFAULT -15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" SERIAL NOT NULL,
    "procedureVersionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubPhase" (
    "id" SERIAL NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" SERIAL NOT NULL,
    "subPhaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "verifiability" "Verifiability" NOT NULL DEFAULT 'AUTO',
    "source" "ProcedureItemSource" NOT NULL DEFAULT 'FCOM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationRule" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "ValidationRuleType" NOT NULL,
    "phase" TEXT NOT NULL,
    "aliases" JSONB NOT NULL,
    "expr" TEXT NOT NULL,
    "params" JSONB,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AircraftPackage_code_key" ON "AircraftPackage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DatarefCatalog_packageId_alias_key" ON "DatarefCatalog"("packageId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedureVersion_aircraftModelCode_version_key" ON "ProcedureVersion"("aircraftModelCode", "version");

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_procedureVersionId_fkey" FOREIGN KEY ("procedureVersionId") REFERENCES "ProcedureVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatarefCatalog" ADD CONSTRAINT "DatarefCatalog_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "AircraftPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureVersion" ADD CONSTRAINT "ProcedureVersion_aircraftModelCode_fkey" FOREIGN KEY ("aircraftModelCode") REFERENCES "AircraftModel"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_procedureVersionId_fkey" FOREIGN KEY ("procedureVersionId") REFERENCES "ProcedureVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubPhase" ADD CONSTRAINT "SubPhase_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_subPhaseId_fkey" FOREIGN KEY ("subPhaseId") REFERENCES "SubPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationRule" ADD CONSTRAINT "ValidationRule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
