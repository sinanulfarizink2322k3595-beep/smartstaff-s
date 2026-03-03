# Reset Users and Create Admin - Quick Guide

## Prerequisites
- PostgreSQL must be running
- Database 'staffhub' must exist

## Steps

### 1. Start PostgreSQL
Check if PostgreSQL is running in Windows Services or start it:
```powershell
# Check if PostgreSQL is running
Get-Service -Name "*postgresql*"

# If not running, start it
Start-Service -Name "postgresql-x64-*"
```

### 2. Create Database (if it doesn't exist)
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE staffhub;

# Exit
\q
```

### 3. Run Migrations (if not done yet)
```powershell
cd staffhub-nextjs/backend
npm run db:migrate
```

### 4. Reset Users and Create Admin
```powershell
npm run users:reset
```

## Your New Admin Credentials
```
Email:    farizisinanul@gmail.com
Password: sfnk123#
```

## Alternative: Direct SQL Method

If you can't run the script, use this SQL directly in PostgreSQL:

```sql
-- Delete all existing users
DELETE FROM users;

-- Create default organization (if doesn't exist)
INSERT INTO organizations (id, name, slug, domain, "isActive", "createdAt", "updatedAt")
VALUES (
  'default-org-id-123',
  'Nilgiri Campus',
  'nilgiri-campus',
  'nilgiri.edu',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create admin user (password is hashed for: sfnk123#)
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
  '$2a$10$YourHashedPasswordWillBeHere',  -- Will be replaced by script
  'Fariz Isinanul',
  'ADMIN',
  'Administration',
  true,
  (SELECT id FROM organizations LIMIT 1),
  NOW(),
  NOW()
);
```

Note: The SQL method requires manual password hashing. The script method is recommended.
