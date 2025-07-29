

-- CreateTable
CREATE TABLE "BaseAirport" (
    "id" SERIAL NOT NULL,
    "baseId" INTEGER NOT NULL,
    "airportCode" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaseAirport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaseAirport_baseId_airportCode_key" ON "BaseAirport"("baseId", "airportCode");

-- AddForeignKey
ALTER TABLE "BaseAirport" ADD CONSTRAINT "BaseAirport_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;


