-- CreateTable
CREATE TABLE "Route" (
    "id" UUID NOT NULL,
    "weekdays" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "aircraft_model_id" UUID NOT NULL,
    "departure_icao" TEXT NOT NULL,
    "eobt" TIMESTAMP(3) NOT NULL,
    "speed" INTEGER NOT NULL,
    "flight_level" INTEGER NOT NULL,
    "route" TEXT NOT NULL,
    "arrival_icao" TEXT NOT NULL,
    "eet" INTEGER NOT NULL,
    "rmk" TEXT NOT NULL,
    "route_status_id" INTEGER NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AircraftModel" (
    "id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,

    CONSTRAINT "AircraftModel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_aircraft_model_id_fkey" FOREIGN KEY ("aircraft_model_id") REFERENCES "AircraftModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
