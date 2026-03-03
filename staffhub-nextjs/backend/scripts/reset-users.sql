-- Reset Users and Create Admin User
-- This SQL script can be run directly in PostgreSQL
-- 
-- Instructions:
-- 1. Connect to your database: psql -U postgres -d staffhub
-- 2. Run this script: \i reset-users.sql
-- Or copy-paste the commands below

-- ========================================
-- Step 1: Delete all existing users
-- ========================================
DELETE FROM users;

-- ========================================
-- Step 2: Ensure default organization exists
-- ========================================
INSERT INTO organizations (id, name, slug, domain, "isActive", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nilgiri Campus',
  'nilgiri-campus',
  'nilgiri.edu',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  "updatedAt" = NOW();

-- ========================================
-- Step 3: Create admin user
-- Password: sfnk123#
-- Hashed with bcrypt (10 rounds)
-- ========================================
INSERT INTO users (
  id,
  email,
  password,
  "fullName",
  role,
  department,
  "isActive",
  "organizationId",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'farizisinanul@gmail.com',
  '$2a$10$AfkKckBMHcnpiYewDsAeHuZbuw1rWGPXORL5SVA9YIGbc5x.9tLYi',
  'Fariz Isinanul',
  'ADMIN',
  'Administration',
  true,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
) ON CONFLICT (email, "organizationId") DO UPDATE SET
  password = EXCLUDED.password,
  "fullName" = EXCLUDED."fullName",
  role = EXCLUDED.role,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- ========================================
-- Verify the user was created
-- ========================================
SELECT 
  id,
  email,
  "fullName",
  role,
  "isActive",
  "createdAt"
FROM users
WHERE email = 'farizisinanul@gmail.com';

-- ========================================
-- Done!
-- ========================================
-- You can now login with:
-- Email: farizisinanul@gmail.com
-- Password: sfnk123#
