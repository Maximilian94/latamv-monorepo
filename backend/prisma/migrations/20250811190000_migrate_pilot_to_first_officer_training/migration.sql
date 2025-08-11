-- Migration to migrate users with "Pilot" role to "First Officer in Training" role
-- This migration ensures that existing pilots are properly migrated to the new role structure

-- First, get the role IDs
DO $$
DECLARE
    pilot_role_id INTEGER;
    first_officer_training_role_id INTEGER;
BEGIN
    -- Get the "Pilot" role ID
    SELECT id INTO pilot_role_id FROM "Role" WHERE name = 'Pilot';
    
    -- Get the "First Officer in Training" role ID
    SELECT id INTO first_officer_training_role_id FROM "Role" WHERE name = 'First Officer in Training';
    
    -- If both roles exist, migrate users
    IF pilot_role_id IS NOT NULL AND first_officer_training_role_id IS NOT NULL THEN
        -- Update all users who have the "Pilot" role to have "First Officer in Training" role instead
        UPDATE "_UserRoles" 
        SET "B" = first_officer_training_role_id 
        WHERE "B" = pilot_role_id;
        
        RAISE NOTICE 'Migrated users from Pilot role to First Officer in Training role';
    ELSE
        RAISE NOTICE 'One or both roles not found. Pilot role ID: %, First Officer in Training role ID: %', pilot_role_id, first_officer_training_role_id;
    END IF;
END $$;
