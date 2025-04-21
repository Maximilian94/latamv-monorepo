-- CreateTable
CREATE TABLE "FlightData" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "flightId" INTEGER NOT NULL,
    "startAcarsTime" TIMESTAMP(3) NOT NULL,
    "endAcarsTime" TIMESTAMP(3) NOT NULL,
    "OUT" TIMESTAMP(3) NOT NULL,
    "OFF" TIMESTAMP(3) NOT NULL,
    "ON" TIMESTAMP(3) NOT NULL,
    "IN" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightData_flightId_key" ON "FlightData"("flightId");

-- AddForeignKey
ALTER TABLE "FlightData" ADD CONSTRAINT "FlightData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightData" ADD CONSTRAINT "FlightData_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
