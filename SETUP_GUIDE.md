# 🚀 SmartStaff Nilgiri - Complete Setup Guide

This guide will walk you through setting up the SmartStaff Nilgiri platform from scratch.

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- [ ] **npm** (v9 or higher) - Comes with Node.js
- [ ] **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- [ ] **Git** - [Download](https://git-scm.com/downloads)
- [ ] **Code Editor** - VS Code recommended

**Optional:**
- [ ] **OpenAI API Key** - For AI Organization Builder ([Get here](https://platform.openai.com/api-keys))

---

## 📦 Step 1: Install Dependencies

Open PowerShell/Terminal in the project root:

```powershell
# Install all dependencies for both frontend and backend
npm run install:all
```

This will install:
- Root workspace dependencies
- Frontend dependencies (~800 packages)
- Backend dependencies (~300 packages)

**Expected time:** 2-3 minutes

---

## 🗄️ Step 2: Setup PostgreSQL Database

### Option A: Using pgAdmin (GUI)

1. Open **pgAdmin**
2. Right-click **Databases** → **Create** → **Database**
3. Name: `smartstaff`
4. Click **Save**

### Option B: Using Command Line

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE smartstaff;

# Verify
\l

# Exit
\q
```

### Get Your Database Connection String

Your `DATABASE_URL` will be in this format:
```
postgresql://username:password@localhost:5432/smartstaff
```

**Example:**
```
postgresql://postgres:mypassword@localhost:5432/smartstaff
```

---

## ⚙️ Step 3: Configure Environment Variables

### Backend Configuration

1. Navigate to backend folder:
```powershell
cd staffhub-nextjs/backend
```

2. Create `.env` file:
```powershell
# Copy from example
Copy-Item "..\..\..env.example" ".env"
```

3. Edit `.env` file and update:

```env
# YOUR PostgreSQL credentials
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartstaff"

# Generate a secure JWT secret (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="paste-generated-secret-here-minimum-32-characters"

# Optional: Add your OpenAI API key
OPENAI_API_KEY="sk-proj-your-key-here"

# Server config (keep as is)
PORT=5000
NODE_ENV="development"
```

### Frontend Configuration

1. Navigate to frontend folder:
```powershell
cd ../frontend
```

2. Create `.env.local` file:
```powershell
# Create new file
New-Item -Path ".env.local" -ItemType File
```

3. Add this content to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🗃️ Step 4: Setup Database Schema

Navigate back to project root:
```powershell
cd ../..
```

Run database migrations:
```powershell
npm run db:migrate
```

This will:
- Create all 13 database tables
- Set up relationships and constraints
- Create indexes for performance
- Apply any pending migrations

**Expected output:**
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

## 🌱 Step 5: Seed Sample Data (Optional)

To test the system with sample data:

```powershell
npm run db:seed
```

This creates:
- Sample organizations
- Test users (admin, staff, students, security)
- Sample departments
- Example outpass requests
- Meeting requests
- Feedback entries

**Default Test Users:**
```
Admin:
  Email: admin@test.com
  Password: password123

Staff:
  Email: staff@test.com
  Password: password123

Student:
  Email: student@test.com
  Password: password123

Security:
  Email: security@test.com
  Password: password123
```

---

## ✅ Step 6: Verify Setup

Run health checks:

```powershell
# Quick validation
npm run db:quick

# Comprehensive health check
npm run db:health
```

**Expected output:**
```
✅ Database connection successful
✅ All tables exist
✅ Indexes properly configured
✅ Multi-tenant isolation working
...
All checks passed! ✨
```

---

## 🚀 Step 7: Start Development Servers

Start both frontend and backend:

```powershell
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

**You should see:**
```
[UI]  ✓ Ready on http://localhost:3000
[API] Server running on http://localhost:5000
```

---

## 🎯 Step 8: Access the Application

Open your browser and visit:

### Landing Page
**http://localhost:3000**

### Login Page
**http://localhost:3000/login**

If you seeded data, use:
- **Email**: admin@test.com
- **Password**: password123

### API Documentation
**http://localhost:5000/api**

---

## 🧪 Step 9: Test Features (Optional)

### Test Database
```powershell
# Run comprehensive tests (45+ tests)
npm run db:test
```

### Test AI Organization Builder
```powershell
# Test AI feature (works without OpenAI API)
npm run db:test:ai "Create a computer science department"
```

### Performance Testing
```powershell
# Run performance benchmarks
npm run db:perf
```

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Test connection: `npm run db:health`

### Issue: "Port 3000 already in use"

**Solution:**
```powershell
# Kill process on port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Or change port in frontend package.json
# "dev": "next dev -p 3001"
```

### Issue: "Port 5000 already in use"

**Solution:**
```powershell
# Kill process on port 5000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force

# Or change PORT in backend .env
# PORT=5001
```

### Issue: Migration fails

**Solution:**
```powershell
# Reset database (WARNING: deletes all data)
npm run db:reset

# Run migrations again
npm run db:migrate
```

### Issue: Frontend can't reach backend

**Solution:**
1. Check backend is running on port 5000
2. Verify `.env.local` has correct API URL
3. Check browser console for CORS errors

---

## 📚 Next Steps

### For Developers
1. Review API documentation: [Backend README](staffhub-nextjs/backend/README.md)
2. Learn about database: [Database Testing Guide](staffhub-nextjs/backend/docs/DATABASE_TESTING_GUIDE.md)
3. Explore AI features: [AI Organization Builder](staffhub-nextjs/backend/docs/AI_ORGANIZATION_BUILDER.md)

### For Users
1. Create your organization
2. Add departments and users
3. Configure staff availability
4. Test outpass workflow
5. Try meeting scheduling

### Production Deployment
1. Read: [Deployment Guide](DEPLOYMENT.md)
2. Set up production database
3. Configure environment variables
4. Build and deploy

---

## 🆘 Getting Help

### Documentation
- [Main README](README.md) - Project overview
- [API Documentation](staffhub-nextjs/backend/README.md)
- [Database Guides](staffhub-nextjs/backend/docs/)

### Check Status
```powershell
# Database health
npm run db:health

# Run tests
npm run db:test

# Check logs
# Frontend: Check browser console
# Backend: Check terminal output
```

### Contact Support
For issues, contact the SmartStaff development team.

---

## ✅ Setup Verification Checklist

Before proceeding, verify:

- [ ] All dependencies installed (`npm run install:all`)
- [ ] PostgreSQL database created (`smartstaff`)
- [ ] Backend `.env` configured with DATABASE_URL and JWT_SECRET
- [ ] Frontend `.env.local` configured with API URL
- [ ] Migrations completed successfully (`npm run db:migrate`)
- [ ] Health checks pass (`npm run db:health`)
- [ ] Both servers start successfully (`npm run dev`)
- [ ] Can access frontend at http://localhost:3000
- [ ] Can access API at http://localhost:5000
- [ ] Can log in with test credentials (if seeded)

---

**🎉 Congratulations! Your SmartStaff Nilgiri platform is ready!**

**Next:** Start exploring the features or begin development. Happy coding! 🚀
