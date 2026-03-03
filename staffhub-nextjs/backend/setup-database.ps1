# Database Setup Script for StaffHub
# This script helps set up PostgreSQL database for StaffHub

Write-Host "StaffHub Database Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Add PostgreSQL to PATH
$env:Path = "C:\Program Files\PostgreSQL\15\bin;" + $env:Path

Write-Host "Step 1: Testing PostgreSQL Connection" -ForegroundColor Yellow
Write-Host "Please enter your PostgreSQL password when prompted." -ForegroundColor Gray
Write-Host "(If you don't know it, press Ctrl+C and see instructions below)`n" -ForegroundColor Gray

# Prompt for password
$password = Read-Host -Prompt "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "`nStep 2: Creating 'staffhub' database..." -ForegroundColor Yellow

# Set password environment variable
$env:PGPASSWORD = $plainPassword

# Check if database exists
$dbExists = & psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='staffhub';" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Connection failed. Please check your password." -ForegroundColor Red
    Write-Host "`nTo reset your PostgreSQL password:" -ForegroundColor Yellow
    Write-Host "1. Stop PostgreSQL service: " -NoNewline
    Write-Host "Stop-Service postgresql-x64-15" -ForegroundColor Green
    Write-Host "2. Edit pg_hba.conf to trust local connections temporarily"
    Write-Host "3. Start service and reset password with ALTER USER"
    Write-Host "4. Or reinstall PostgreSQL and remember the password`n"
    exit 1
}

if ($dbExists -match "1") {
    Write-Host "[OK] Database 'staffhub' already exists" -ForegroundColor Green
}
else {
    Write-Host "Creating new database 'staffhub'..." -ForegroundColor Gray
    & psql -U postgres -c "CREATE DATABASE staffhub;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database 'staffhub' created successfully" -ForegroundColor Green
    }
    else {
        Write-Host "[X] Failed to create database" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nStep 3: Updating .env file..." -ForegroundColor Yellow

# Update .env file
$envPath = ".env"
$envContent = Get-Content $envPath -Raw

# Update DATABASE_URL
$newDatabaseUrl = "DATABASE_URL=`"postgresql://postgres:$plainPassword@localhost:5432/staffhub?schema=public`""
$envContent = $envContent -replace "DATABASE_URL=`"[^`"]*`"", $newDatabaseUrl

Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "[OK] .env file updated with correct credentials" -ForegroundColor Green

Write-Host "`nStep 4: Running Prisma migrations..." -ForegroundColor Yellow

# Run Prisma migrations
npm run prisma:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Prisma client generated" -ForegroundColor Green
}
else {
    Write-Host "[!] Warning: Prisma generate failed" -ForegroundColor Yellow
}

npm run prisma:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database migrations completed" -ForegroundColor Green
}
else {
    Write-Host "[!] Warning: Migrations may have failed" -ForegroundColor Yellow
}

Write-Host "`nStep 5: Verifying setup..." -ForegroundColor Yellow
node check-organizations.js

Write-Host "`n[SUCCESS] Database setup complete!" -ForegroundColor Green
Write-Host "You can now restart your backend server and test the signup." -ForegroundColor Gray
Write-Host "`nTo register your organization, use the /register endpoint first," -ForegroundColor Gray
Write-Host "or test with mock codes: smartstaff-demo, nilgiri-college`n" -ForegroundColor Gray

# Clear password from memory
$env:PGPASSWORD = ""
