-- CreateTable
CREATE TABLE "FlightDuty" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightDuty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" SERIAL NOT NULL,
    "flightDutyId" INTEGER NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_flightDutyId_fkey" FOREIGN KEY ("flightDutyId") REFERENCES "FlightDuty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
