# 📋 NPM Scripts Guide

Quick reference for all available npm scripts in the backend.

## 🚀 Development

```powershell
# Start backend development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🗄️ Database Management

### Migration Scripts

```powershell
# Initialize database from scratch (recommended for first time)
npm run db:init

# Check migration status
npm run db:check

# Apply pending migrations
npm run db:migrate

# Reset database (DANGER - deletes all data!)
npm run db:reset
```

### Data Management

```powershell
# Load sample data (creates test organizations, users, etc.)
npm run db:seed

# Open Prisma Studio (visual database editor)
npm run prisma:studio
```

---

## 🧪 Testing

### Database Tests

```powershell
# Quick test - runs all tests at once (RECOMMENDED)
npm run db:test:quick

# Comprehensive database tests (45+ tests)
npm run db:test

# Health check (fastest, good for quick status)
npm run db:health

# AI Organization Builder test (works without database)
npm run db:test:ai

# Custom AI prompt
npm run db:test:ai "Create a hospital system"
```

### Performance

```powershell
# Run performance analysis
npm run db:performance
```

---

## 🔧 Prisma Commands

```powershell
# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 📊 Common Workflows

### First Time Setup

```powershell
# 1. Update .env with DATABASE_URL
# 2. Initialize database
npm run db:init

# 3. Load sample data
npm run db:seed

# 4. Test everything
npm run db:test:quick

# 5. Start development
npm run dev
```

### Daily Development

```powershell
# Check database health
npm run db:health

# Start backend
npm run dev
```

### After Schema Changes

```powershell
# 1. Edit prisma/schema.prisma
# 2. Check current status
npm run db:check

# 3. Apply changes
npm run db:migrate

# 4. Test
npm run db:test
```

### Before Deployment

```powershell
# 1. Health check
npm run db:health

# 2. Full test suite
npm run db:test

# 3. Performance check
npm run db:performance

# 4. Build
npm run build
```

### Troubleshooting

```powershell
# Check health
npm run db:health

# Check migration status
npm run db:check

# Run full tests
npm run db:test

# If all else fails (CAUTION!)
npm run db:reset
npm run db:init
npm run db:seed
```

---

## 🎯 Quick Reference

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run dev` | Start development server | - |
| `npm run db:init` | Initialize database | ~5s |
| `npm run db:check` | Check migration status | <1s |
| `npm run db:migrate` | Apply migrations | ~2s |
| `npm run db:seed` | Load sample data | ~3s |
| `npm run db:health` | Health check | ~2s |
| `npm run db:test` | Full database tests | ~4s |
| `npm run db:test:quick` | All tests at once | ~7s |
| `npm run db:test:ai` | AI builder test | <1s |
| `npm run db:performance` | Performance analysis | ~3s |
| `npm run prisma:studio` | Open database GUI | - |

---

## 💡 Pro Tips

1. **Use `db:test:quick` regularly** - It runs all tests in sequence
2. **Run `db:health` before starting work** - Quick health check
3. **Use `prisma:studio` to visually inspect data** - Great for debugging
4. **Run `db:seed` after reset** - Instantly get test data
5. **Use `db:test:ai` without database** - Test AI features anytime

---

## 🔍 What Each Test Does

### `npm run db:health`
- ✅ Connection test
- ✅ PostgreSQL version check
- ✅ Table integrity (13 models)
- ✅ Data consistency
- ✅ Orphaned records detection
- ✅ Performance benchmarks
- ✅ Security checks

### `npm run db:test`
- ✅ All models accessible
- ✅ CRUD operations
- ✅ User roles (ADMIN, STAFF, STUDENT, SECURITY)
- ✅ Hierarchical departments
- ✅ Custom roles & permissions
- ✅ Multi-tenant isolation
- ✅ Cascade deletes
- ✅ Performance benchmarks
- ✅ Data integrity

### `npm run db:test:quick`
Runs all tests:
1. Health Check
2. Database Tests
3. AI Org Builder Test
4. Migration Status

### `npm run db:test:ai`
- ✅ AI structure generation
- ✅ Fallback templates
- ✅ Department hierarchy
- ✅ Roles & permissions
- ✅ No database required!

---

## 🚨 Emergency Commands

```powershell
# Database is corrupted
npm run db:reset
npm run db:init

# Need fresh test data
npm run db:seed

# Check what's wrong
npm run db:health
npm run db:test
```

---

## 📚 More Information

- Full guide: `DATABASE_TESTING_GUIDE.md`
- Connection setup: `GET_SUPABASE_DB_CONNECTION.md`
- Summary: `DATABASE_TESTING_COMPLETE.md`

---

**Made with ❤️ for StaffHub**  
*Simple, powerful, comprehensive database management*
