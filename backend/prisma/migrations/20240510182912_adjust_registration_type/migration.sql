/*
  Warnings:

  - The primary key for the `Aircraft` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Aircraft" DROP CONSTRAINT "Aircraft_pkey",
ALTER COLUMN "registration" DROP DEFAULT,
ALTER COLUMN "registration" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("registration");
DROP SEQUENCE "Aircraft_registration_seq";
