/*
  Warnings:

  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "EventDescription" (
    "eventID" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "EventDescription_pkey" PRIMARY KEY ("eventID")
);

-- AddForeignKey
ALTER TABLE "EventDescription" ADD CONSTRAINT "EventDescription_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
