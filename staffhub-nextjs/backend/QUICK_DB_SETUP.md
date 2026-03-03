# Quick Database Setup Guide

## Option 1: Automated Setup (Recommended)

Run the setup script:

```powershell
cd C:\Users\USER\Desktop\smartstaffnilgiri-main\staffhub-nextjs\backend
.\setup-database.ps1
```

Enter your PostgreSQL password when prompted.

## Option 2: Manual Setup

### Find Your PostgreSQL Password

**If you forgot your password:**

1. **Check during installation** - The password was set when you installed PostgreSQL
2. **Look for saved passwords** - Check your password manager
3. **Reset the password**:

   ```powershell
   # Stop PostgreSQL service
   Stop-Service postgresql-x64-15

   # Edit pg_hba.conf (usually in C:\Program Files\PostgreSQL\15\data\pg_hba.conf)
   # Change METHOD from 'scram-sha-256' to 'trust' for local connections

   # Start service
   Start-Service postgresql-x64-15

   # Connect without password and reset it
   psql -U postgres
   # In psql:
   ALTER USER postgres PASSWORD 'your-new-password';
   \q

   # Change pg_hba.conf back to 'scram-sha-256'
   # Restart service
   Restart-Service postgresql-x64-15
   ```

### Manual Database Creation

```powershell
# Add PostgreSQL to PATH
$env:Path = "C:\Program Files\PostgreSQL\15\bin;" + $env:Path

# Create database (enter password when prompted)
psql -U postgres -c "CREATE DATABASE staffhub;"

# Verify
psql -U postgres -c "\l" | findstr staffhub
```

### Update .env File

Edit `.env` and update the DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/staffhub?schema=public"
```

### Run Migrations

```powershell
npm run prisma:generate
npm run prisma:migrate
```

### Verify Setup

```powershell
node check-organizations.js
```

## Option 3: Use Mock Mode (No Database)

If you don't want to set up PostgreSQL right now, the backend will automatically use mock mode.

**Mock Organization Codes:**

- `smartstaff-demo`
- `nilgiri-college`

## Troubleshooting

### "Authentication failed" Error

- Wrong password in .env
- PostgreSQL user doesn't exist
- PostgreSQL service not running

**Check service:**

```powershell
Get-Service postgresql-x64-15
```

**Start service if stopped:**

```powershell
Start-Service postgresql-x64-15
```

### "database does not exist" Error

Create it manually:

```powershell
$env:PGPASSWORD = "your-password"
psql -U postgres -c "CREATE DATABASE staffhub;"
```

### Port 5432 Already in Use

Another PostgreSQL instance might be running:

```powershell
netstat -ano | findstr ":5432"
```

## Next Steps

After successful database setup:

1. **Restart backend server** (if not using nodemon)
2. **Register your organization**: Visit `/register` page
3. **Note your organization slug** - This is your signup code
4. **Users can signup** using your organization code

## Support

If you encounter issues:

1. Check backend console logs for detailed errors
2. Run `node check-organizations.js` to verify database state
3. Ensure PostgreSQL service is running
4. Verify credentials in .env file
