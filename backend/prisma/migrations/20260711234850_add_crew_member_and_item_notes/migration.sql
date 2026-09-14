-- CreateEnum
CREATE TYPE "CrewMember" AS ENUM ('CM1', 'CM2', 'PF', 'PM');

-- CreateEnum
CREATE TYPE "NoteKind" AS ENUM ('FCOM', 'FCTM');

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "crewMember" "CrewMember" NOT NULL DEFAULT 'CM1';

-- CreateTable
CREATE TABLE "ProcedureItemNote" (
    "id" SERIAL NOT NULL,
    "checklistItemId" INTEGER NOT NULL,
    "kind" "NoteKind" NOT NULL,
    "body" TEXT NOT NULL,
    "reference" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedureItemNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProcedureItemNote" ADD CONSTRAINT "ProcedureItemNote_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
