/*
  Warnings:

  - The primary key for the `Route` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Route` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/

-- First, drop any existing foreign key constraints that depend on Route_pkey
ALTER TABLE "RouteAircraft" DROP CONSTRAINT IF EXISTS "RouteAircraft_routeId_fkey";

-- Now we can safely drop and recreate the Route primary key
ALTER TABLE "Route" DROP CONSTRAINT IF EXISTS "Route_pkey";

-- Add the new columns only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Route' AND column_name = 'ident_iata') THEN
        ALTER TABLE "Route" ADD COLUMN "ident_iata" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Route' AND column_name = 'ident_icao') THEN
        ALTER TABLE "Route" ADD COLUMN "ident_icao" TEXT;
    END IF;
END $$;

-- Handle the id column change safely
DO $$ 
BEGIN
    -- Check if id column exists and is not integer type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Route' AND column_name = 'id' AND data_type != 'integer') THEN
        -- If it's a string type, we need to handle the conversion
        -- For now, we'll just drop and recreate as integer
        -- You may need to adjust this based on your data
        ALTER TABLE "Route" DROP COLUMN "id";
        ALTER TABLE "Route" ADD COLUMN "id" INTEGER NOT NULL;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Route' AND column_name = 'id') THEN
        -- If id column doesn't exist, create it
        ALTER TABLE "Route" ADD COLUMN "id" INTEGER NOT NULL;
    END IF;
END $$;

-- Add the primary key constraint
ALTER TABLE "Route" ADD CONSTRAINT "Route_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "RouteAircraft" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "aircraftType" TEXT NOT NULL,

    CONSTRAINT "RouteAircraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RouteAircraft_routeId_aircraftType_key" ON "RouteAircraft"("routeId", "aircraftType");

-- AddForeignKey
ALTER TABLE "RouteAircraft" ADD CONSTRAINT "RouteAircraft_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
