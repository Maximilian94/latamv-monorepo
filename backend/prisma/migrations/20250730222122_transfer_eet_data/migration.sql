-- Transfer data from eet_minutes to eet_seconds
UPDATE "Route" SET eet_seconds = eet_minutes WHERE eet_minutes IS NOT NULL;

-- Verify data transfer
-- SELECT COUNT(*) as total_routes, 
--        COUNT(eet_minutes) as routes_with_minutes, 
--        COUNT(eet_seconds) as routes_with_seconds 
-- FROM "Route";

-- Remove the old column
ALTER TABLE "Route" DROP COLUMN "eet_minutes"; 