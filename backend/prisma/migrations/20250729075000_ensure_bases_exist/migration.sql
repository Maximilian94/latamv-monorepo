-- Ensure bases exist before making baseId required
-- This migration runs before make_base_id_required to guarantee bases are available

-- Create bases if they don't exist
INSERT INTO "Base" (id, name, description, city, state, country, "createdAt", "updatedAt") VALUES
(1, 'São Paulo', 'Main hub for São Paulo operations with multiple airports', 'São Paulo', 'São Paulo', 'BR', NOW(), NOW()),
(2, 'Rio de Janeiro', 'Hub for Rio de Janeiro operations', 'Rio de Janeiro', 'Rio de Janeiro', 'BR', NOW(), NOW()),
(3, 'Brasília', 'Capital hub for central operations', 'Brasília', 'Distrito Federal', 'BR', NOW(), NOW()),
(4, 'Porto Alegre', 'Southern hub for regional operations', 'Porto Alegre', 'Rio Grande do Sul', 'BR', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create base airports if they don't exist
INSERT INTO "BaseAirport" (id, "baseId", "airportCode", "createdAt") VALUES
(1, 1, 'SBGR', NOW()),
(2, 1, 'SBSP', NOW()),
(3, 2, 'SBGL', NOW()),
(4, 2, 'SBRJ', NOW()),
(5, 3, 'SBBR', NOW()),
(6, 4, 'SBPA', NOW())
ON CONFLICT (id) DO NOTHING; 