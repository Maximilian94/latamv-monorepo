/*
  Warnings:

  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EventDescription` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "EventDescription" DROP CONSTRAINT "EventDescription_eventID_fkey";

-- DropForeignKey
ALTER TABLE "FlightEvent" DROP CONSTRAINT "FlightEvent_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP CONSTRAINT "Event_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Event_id_seq";

-- AlterTable
ALTER TABLE "EventDescription" DROP CONSTRAINT "EventDescription_pkey",
ALTER COLUMN "eventID" SET DATA TYPE TEXT,
ADD CONSTRAINT "EventDescription_pkey" PRIMARY KEY ("eventID");

-- AlterTable
ALTER TABLE "FlightEvent" ALTER COLUMN "eventId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "EventDescription" ADD CONSTRAINT "EventDescription_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightEvent" ADD CONSTRAINT "FlightEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
