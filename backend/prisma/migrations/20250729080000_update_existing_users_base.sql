-- Update existing users to have baseId = 1 (São Paulo base)
UPDATE "User" SET "baseId" = 1 WHERE "baseId" IS NULL; 