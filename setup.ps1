#!/usr/bin/env pwsh
# SmartStaff Nilgiri - Quick Start Script for Windows PowerShell
# This script helps you set up the entire application quickly

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "  SmartStaff Nilgiri - Quick Start Setup" -ForegroundColor Cyan
Write-Host "  Version 2.0 - Unified Platform" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Step 1: Check Prerequisites
Write-Host "`n[1/8] Checking prerequisites..." -ForegroundColor Yellow

$allGood = $true

if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    $allGood = $false
}

if (Test-Command npm) {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ npm not found." -ForegroundColor Red
    $allGood = $false
}

if (Test-Command psql) {
    Write-Host "  ✓ PostgreSQL: installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ PostgreSQL not found in PATH" -ForegroundColor Yellow
    Write-Host "    Make sure PostgreSQL is installed and running" -ForegroundColor Yellow
}

if (-not $allGood) {
    Write-Host "`n✗ Prerequisites check failed. Please install missing software." -ForegroundColor Red
    exit 1
}

# Step 2: Install Dependencies
Write-Host "`n[2/8] Installing dependencies..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..."

try {
    npm run install:all 2>&1 | Out-Null
    Write-Host "  ✓ All dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "  Run 'npm run install:all' manually to see errors" -ForegroundColor Yellow
    exit 1
}

# Step 3: Check Environment Files
Write-Host "`n[3/8] Checking environment configuration..." -ForegroundColor Yellow

$backendEnv = "staffhub-nextjs\backend\.env"
$frontendEnv = "staffhub-nextjs\frontend\.env.local"

if (-not (Test-Path $backendEnv)) {
    Write-Host "  ⚠ Backend .env not found" -ForegroundColor Yellow
    Write-Host "    Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" $backendEnv
    Write-Host "  ✓ Created $backendEnv" -ForegroundColor Green
    Write-Host "    ⚠ IMPORTANT: Edit $backendEnv and set DATABASE_URL" -ForegroundColor Yellow
    $needsConfig = $true
} else {
    Write-Host "  ✓ Backend .env exists" -ForegroundColor Green
}

if (-not (Test-Path $frontendEnv)) {
    Write-Host "  ⚠ Frontend .env.local not found" -ForegroundColor Yellow
    Write-Host "    Creating..." -ForegroundColor Yellow
    Set-Content $frontendEnv "NEXT_PUBLIC_API_URL=http://localhost:5000/api"
    Write-Host "  ✓ Created $frontendEnv" -ForegroundColor Green
} else {
    Write-Host "  ✓ Frontend .env.local exists" -ForegroundColor Green
}

# Step 4: Database Setup Prompt
Write-Host "`n[4/8] Database setup" -ForegroundColor Yellow

$dbSetup = Read-Host "  Have you created the PostgreSQL database 'smartstaff'? (y/n)"

if ($dbSetup -ne 'y') {
    Write-Host "`n  To create the database, run:" -ForegroundColor Yellow
    Write-Host "    psql -U postgres -c 'CREATE DATABASE smartstaff;'" -ForegroundColor Cyan
    Write-Host "`n  Or use pgAdmin to create a database named 'smartstaff'" -ForegroundColor Yellow
    $continue = Read-Host "`n  Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "`n  Setup paused. Run this script again after creating the database." -ForegroundColor Yellow
        exit 0
    }
}

# Step 5: Run Migrations
Write-Host "`n[5/8] Running database migrations..." -ForegroundColor Yellow

try {
    $output = npm run db:migrate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Migration failed" -ForegroundColor Red
        Write-Host "  Check your DATABASE_URL in $backendEnv" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ✗ Migration failed" -ForegroundColor Red
    Write-Host "  Check your DATABASE_URL in $backendEnv" -ForegroundColor Yellow
    exit 1
}

# Step 6: Seed Data
Write-Host "`n[6/8] Seeding sample data..." -ForegroundColor Yellow
$seedChoice = Read-Host "  Do you want to seed sample data? (y/n)"

if ($seedChoice -eq 'y') {
    try {
        npm run db:seed 2>&1 | Out-Null
        Write-Host "  ✓ Sample data seeded" -ForegroundColor Green
        Write-Host "`n  Test credentials:" -ForegroundColor Cyan
        Write-Host "    Email: admin@test.com" -ForegroundColor White
        Write-Host "    Password: password123" -ForegroundColor White
    } catch {
        Write-Host "  ⚠ Seeding failed (optional step)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⊘ Skipped seeding" -ForegroundColor Gray
}

# Step 7: Health Check
Write-Host "`n[7/8] Running health checks..." -ForegroundColor Yellow

try {
    $healthOutput = npm run db:health 2>&1
    Write-Host "  ✓ Database health check passed" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Health check had warnings (may be okay)" -ForegroundColor Yellow
}

# Step 8: Summary
Write-Host "`n[8/8] Setup complete!" -ForegroundColor Yellow

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  🎉 SmartStaff Nilgiri is ready!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Start development: npm run dev" -ForegroundColor White
Write-Host "  2. Open frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "  3. API endpoint:      http://localhost:5000" -ForegroundColor White

if ($needsConfig) {
    Write-Host "`n⚠ IMPORTANT: Edit $backendEnv and set your DATABASE_URL" -ForegroundColor Yellow
}

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  npm run dev         - Start both frontend & backend" -ForegroundColor White
Write-Host "  npm run db:test     - Run database tests" -ForegroundColor White
Write-Host "  npm run db:health   - Check database health" -ForegroundColor White

Write-Host "`nDocumentation:" -ForegroundColor Cyan
Write-Host "  README.md          - Project overview" -ForegroundColor White
Write-Host "  SETUP_GUIDE.md     - Detailed setup guide" -ForegroundColor White

Write-Host "`n✨ Happy coding! ✨`n" -ForegroundColor Green

# Ask to start servers
$startNow = Read-Host "Start development servers now? (y/n)"
if ($startNow -eq 'y') {
    Write-Host "`nStarting servers...`n" -ForegroundColor Yellow
    npm run dev
}
