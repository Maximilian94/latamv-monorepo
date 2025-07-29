-- Create bases first (before creating BaseAirport table)
INSERT INTO "Base" (id, name, description, city, state, country, "createdAt", "updatedAt") VALUES
(1, 'São Paulo', 'Main hub for São Paulo operations with multiple airports', 'São Paulo', 'São Paulo', 'BR', NOW(), NOW()),
(2, 'Rio de Janeiro', 'Hub for Rio de Janeiro operations', 'Rio de Janeiro', 'Rio de Janeiro', 'BR', NOW(), NOW()),
(3, 'Brasília', 'Capital hub for central operations', 'Brasília', 'Distrito Federal', 'BR', NOW(), NOW()),
(4, 'Porto Alegre', 'Southern hub for regional operations', 'Porto Alegre', 'Rio Grande do Sul', 'BR', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

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

-- Create base airports
INSERT INTO "BaseAirport" (id, "baseId", "airportCode", "createdAt") VALUES
(1, 1, 'SBGR', NOW()),
(2, 1, 'SBSP', NOW()),
(3, 2, 'SBGL', NOW()),
(4, 2, 'SBRJ', NOW()),
(5, 3, 'SBBR', NOW()),
(6, 4, 'SBPA', NOW())
ON CONFLICT (id) DO NOTHING;
