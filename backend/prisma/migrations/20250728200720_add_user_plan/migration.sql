-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'GOLD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
