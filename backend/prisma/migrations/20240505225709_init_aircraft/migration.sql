-- CreateTable
CREATE TABLE "Aircraft" (
    "registration" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "aircraftModelCode" TEXT NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("registration")
);

-- AddForeignKey
ALTER TABLE "Aircraft" ADD CONSTRAINT "Aircraft_aircraftModelCode_fkey" FOREIGN KEY ("aircraftModelCode") REFERENCES "AircraftModel"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
