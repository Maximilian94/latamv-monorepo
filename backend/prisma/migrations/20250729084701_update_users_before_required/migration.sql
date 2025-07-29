-- Migration to update existing users before making baseId required
-- This should be applied BEFORE the fix_base_id_required_production migration

-- Update existing users to have baseId = 1 (São Paulo base)
UPDATE "User" SET "baseId" = 1 WHERE "baseId" IS NULL; 