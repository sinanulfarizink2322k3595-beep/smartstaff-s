# 🗄️ Database Testing & Optimization Guide

Complete guide for testing, optimizing, and maintaining the StaffHub database.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Scripts](#database-scripts)
3. [Testing Guide](#testing-guide)
4. [Performance Optimization](#performance-optimization)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

```powershell
cd staffhub-nextjs/backend

# Step 1: Get your Supabase connection string
# See GET_SUPABASE_DB_CONNECTION.md for detailed instructions

# Step 2: Update .env with your DATABASE_URL

# Step 3: Initialize database
node migrate-helper.js init

# Step 4: Test everything
node db-health-check.js
node test-database.js
```

That's it! Your database is ready to use. ✨

---

## 📦 Database Scripts

We've created 6 powerful scripts to manage your database effectively:

### 1. 🔧 Migration Helper (`migrate-helper.js`)

**The easiest way to manage database migrations.**

```powershell
# Initialize database (first time)
node migrate-helper.js init

# Check migration status
node migrate-helper.js check

# Generate new migration
node migrate-helper.js generate

# Apply pending migrations
node migrate-helper.js apply

# Reset database (DANGER!)
node migrate-helper.js reset

# Backup instructions
node migrate-helper.js backup

# Help
node migrate-helper.js help
```

**Features:**
- ✅ Interactive prompts with safety confirmations
- ✅ Clear step-by-step output
- ✅ Automatic Prisma Client updates
- ✅ Connection testing before operations
- ✅ Rollback protection

**Recommended Workflow:**
1. Make changes to `prisma/schema.prisma`
2. Run `node migrate-helper.js generate`
3. Review the generated migration file
4. Run `node migrate-helper.js apply`
5. Test with `node test-database.js`

---

### 2. 🧪 Database Tests (`test-database.js`)

**Comprehensive testing of all database models and operations.**

```powershell
node test-database.js
```

**What it tests:**
- ✅ Database connection and latency
- ✅ All 13 Prisma models accessibility
- ✅ CRUD operations on organizations
- ✅ User role management (ADMIN, STAFF, STUDENT, SECURITY)
- ✅ Hierarchical departments (parent/child relationships)
- ✅ Custom roles with permissions
- ✅ Multi-tenant data isolation (critical!)
- ✅ Cascade delete operations
- ✅ Query performance benchmarks
- ✅ Data integrity checks
- ✅ Circular reference detection

**Output Example:**
```
╔════════════════════════════════════════════════════════════╗
║     COMPREHENSIVE DATABASE TEST SUITE                      ║
║     StaffHub NextJS - Database & Models Testing           ║
╚════════════════════════════════════════════════════════════╝

🔌 Database Connection Test
✅ Database connection successful: 45ms (excellent)

📊 Model Structure Test
✅ Model 'organization' is accessible
✅ Model 'user' is accessible
...

📋 TEST SUMMARY
Total Tests Run:    45
✅ Passed:          43
❌ Failed:          0
⚠️  Warnings:        2
⏱️  Duration:        3.45s

🎉 ALL TESTS PASSED! Database is working perfectly.
```

**When to run:**
- After migrations
- Before deploying to production
- When troubleshooting issues
- As part of CI/CD pipeline

---

### 3. 🌱 Database Seed (`seed-database.js`)

**Populate database with realistic sample data for development and testing.**

```powershell
node seed-database.js
```

**Creates:**
- 🏢 2 Organizations
  - Nilgiri College of Science
  - Tech University
- 👥 7 Users per org
  - 1 Admin (Principal)
  - 2 Staff (Professors)
  - 3 Students
  - 1 Security
- 🏗️ 6 Departments
  - Hierarchical structure
  - Academic Affairs → CS, Math, Physics
  - Administration → HR
- 🔐 4 Custom Roles
  - Principal (Level 10 - full authority)
  - Department Head (Level 8)
  - Faculty (Level 5)
  - Student Representative (Level 3)
- 📋 3 Outpasses
  - Approved, Pending, Rejected
- 📅 3 Meetings
  - Various statuses
- 🔔 4 Notifications
- 🏫 Campus Structure
  - 1 Campus, 2 Blocks, 7 Rooms

**Test Login Credentials:** (password: `password123`)
```
Admin:    admin@nilgiri.edu
Staff:    staff1@nilgiri.edu
Student:  student1@nilgiri.edu
Security: security@nilgiri.edu
```

**Perfect for:**
- Frontend development
- Testing user flows
- Demo presentations
- UI screenshots
- Integration testing

**⚠️ Note:** Clears existing test data before seeding.

---

### 4. 💊 Health Check (`db-health-check.js`)

**Comprehensive database health monitoring with color-coded output.**

```powershell
node db-health-check.js
```

**Checks:**
- 🔌 **Connection**: Latency and status
- 📊 **Database Info**: PostgreSQL version
- 🗄️ **Table Integrity**: All 13 tables accessible
- 🔍 **Data Consistency**:
  - Orphaned records
  - Invalid references
  - Circular dependencies
- 📈 **Data Volume**: Record counts per table
- 📑 **Indexes**: Index status and coverage
- ⚡ **Performance**: Query speed benchmarks
- 💾 **Backups**: Recommendations
- 🔒 **Security**: User and org checks

**Output Example:**
```
╔════════════════════════════════════════════════════════════╗
║          DATABASE HEALTH CHECK                             ║
║          StaffHub NextJS - Comprehensive Diagnostics       ║
╚════════════════════════════════════════════════════════════╝

🔌 Database Connection
✅ Connection: PASS - 42ms (excellent)

📊 Database Information
   PostgreSQL Version: PostgreSQL 16.1 on x86_64-pc-linux-gnu
✅ PostgreSQL Version: PASS - Supported version

🗄️  Table Integrity
✅ Table: organization: PASS
✅ Table: user: PASS
... (all 13 tables)

📋 Health Check Summary
   Overall Status: HEALTHY
   Total Checks: 28
   ✅ Passed: 26
   ⚠️  Warnings: 2
   ❌ Failed: 0
   Duration: 2.14s

   🎉 Database is in good health!
```

**Exit Codes:**
- `0` - Healthy (green)
- `1` - Critical issues (red)

**When to run:**
- Daily in production
- After migrations
- When experiencing issues
- Before deployments
- Scheduled monitoring

---

### 5. ⚡ Performance Utils (`performance-utils.js`)

**Advanced performance optimization utilities.**

```powershell
# Run performance analysis
node performance-utils.js
```

**Features:**

#### Optimized Prisma Client
```javascript
const { createOptimizedPrismaClient } = require('./performance-utils');
const prisma = createOptimizedPrismaClient();

// Automatically logs slow queries (> 1000ms)
// Connection pooling configured
// Environment-aware logging
```

#### Batch Operations
```javascript
const { BatchOperations } = require('./performance-utils');
const batch = new BatchOperations(prisma);

// Bulk create (100 records per transaction)
await batch.bulkCreate('department', departments, 100);

// Bulk update
await batch.bulkUpdate('user', updates);

// Bulk delete
await batch.bulkDelete('outpass', ids);
```

#### Query Optimizer
```javascript
const { QueryOptimizer } = require('./performance-utils');

// Efficient organization query with counts
const org = await QueryOptimizer.getOrganizationWithData(prisma, orgId);

// Minimal user query (only necessary fields)
const user = await QueryOptimizer.getUserMinimal(prisma, userId);

// Department tree with depth limit
const tree = await QueryOptimizer.getDepartmentTree(prisma, orgId, 2);

// Cursor-based pagination (faster than offset)
const { items, nextCursor, hasMore } = await QueryOptimizer.paginateWithCursor(
  prisma, 'outpass', { cursor: lastId, take: 20 }
);
```

#### Simple Cache
```javascript
const { SimpleCache } = require('./performance-utils');
const cache = new SimpleCache(300); // 5 minutes TTL

// Cache query results
const data = await cache.getOrSet('org-data', async () => {
  return prisma.organization.findMany();
});
```

#### Performance Monitor
```javascript
const { PerformanceMonitor } = require('./performance-utils');

// Analyze database performance
await PerformanceMonitor.analyzeQueries(prisma);
// Shows: table sizes, index usage, missing indexes

await PerformanceMonitor.getSlowQueries(prisma);
// Requires pg_stat_statements extension
```

**Recommended Indexes:**
The script lists all recommended database indexes for optimal performance:
- User: `[organizationId, role]` - Role-based queries
- User: `[email]` - Authentication lookups
- Department: `[organizationId, parentId]` - Hierarchical queries
- CustomRole: `[organizationId, departmentId]` - Role lookups
- Permission: `[roleId, resource, action]` - Permission checks
- Outpass: `[organizationId, status, studentId]` - Status filtering
- Meeting: `[organizationId, status, staffId, studentId]` - User filtering
- Notification: `[userId, isRead]` - User notifications

---

### 6. 🤖 AI Org Builder Test (`test-ai-orgbuilder.js`)

**Standalone test for AI Organization Builder (no database required).**

```powershell
# Default prompt (university)
node test-ai-orgbuilder.js

# Custom prompts
node test-ai-orgbuilder.js "Create a hospital system"
node test-ai-orgbuilder.js "Create a tech startup"
node test-ai-orgbuilder.js "Build a manufacturing company"
```

**Features:**
- ✅ Works without database connection
- ✅ Works without OpenAI API key (smart fallbacks)
- ✅ 3 built-in templates: Educational, Healthcare, Tech
- ✅ Beautiful console output with colors
- ✅ Shows departments, roles, permissions, statistics

**Perfect for:**
- Testing AI generation logic
- Trying different prompts
- Demo without setup
- Development without database

---

## 🧪 Testing Guide

### Complete Testing Workflow

```powershell
cd staffhub-nextjs/backend

# 1. Check database health
node db-health-check.js

# 2. Run comprehensive tests
node test-database.js

# 3. Test AI Organization Builder (standalone)
node test-ai-orgbuilder.js

# 4. Analyze performance
node performance-utils.js

# 5. Check migration status
node migrate-helper.js check
```

### Testing Specific Features

#### Multi-Tenant Isolation
```powershell
# Create test data with seed script
node seed-database.js

# Run isolation tests
node test-database.js
# Look for: "Multi-tenant isolation working correctly"
```

#### AI Organization Builder
```powershell
# Test without database
node test-ai-orgbuilder.js "Create a university system"

# Test with database (requires connection)
# 1. Start backend: npm run dev
# 2. Open frontend and navigate to /dashboard/admin/orgbuilder
# 3. Generate and apply structures
```

#### Performance Benchmarks
```powershell
# Run performance analysis
node performance-utils.js

# Check results for:
# - Table sizes
# - Index usage
# - Slow queries
# - Missing indexes
```

---

## ⚡ Performance Optimization

### Query Optimization Tips

1. **Use Select for Specific Fields**
   ```javascript
   // ❌ Bad - Fetches all fields
   const users = await prisma.user.findMany({ where: { organizationId } });
   
   // ✅ Good - Only necessary fields
   const users = await prisma.user.findMany({
     where: { organizationId },
     select: { id: true, name: true, email: true, role: true },
   });
   ```

2. **Use Cursor Pagination**
   ```javascript
   // ❌ Slow for large datasets
   const page = await prisma.outpass.findMany({
     skip: page * 20,
     take: 20,
   });
   
   // ✅ Faster cursor-based
   const { items, nextCursor } = await QueryOptimizer.paginateWithCursor(
     prisma, 'outpass', { cursor: lastId, take: 20 }
   );
   ```

3. **Limit Include Depth**
   ```javascript
   // ❌ Deep nesting is expensive
   const org = await prisma.organization.findUnique({
     where: { id },
     include: {
       users: { include: { department: { include: { parent: true } } } },
     },
   });
   
   // ✅ Use counts when appropriate
   const org = await prisma.organization.findUnique({
     where: { id },
     include: { _count: { select: { users: true } } },
   });
   ```

4. **Batch Operations**
   ```javascript
   // ❌ Multiple sequential queries
   for (const dept of departments) {
     await prisma.department.create({ data: dept });
   }
   
   // ✅ Single batch operation
   await prisma.department.createMany({ data: departments });
   ```

5. **Use Transactions**
   ```javascript
   // ✅ Atomic operations
   await prisma.$transaction([
     prisma.department.create({ data: dept }),
     prisma.customRole.create({ data: role }),
     prisma.permission.createMany({ data: permissions }),
   ]);
   ```

### Caching Strategy

```javascript
const { SimpleCache } = require('./performance-utils');
const cache = new SimpleCache(300); // 5-minute TTL

// Cache frequently accessed data
app.get('/api/organizations/:id', async (req, res) => {
  const org = await cache.getOrSet(`org-${req.params.id}`, async () => {
    return QueryOptimizer.getOrganizationWithData(prisma, req.params.id);
  });
  
  res.json(org);
});

// Invalidate cache on updates
app.put('/api/organizations/:id', async (req, res) => {
  await prisma.organization.update(/* ... */);
  cache.delete(`org-${req.params.id}`); // Clear cache
  res.json(updated);
});
```

### Database Indexes

Add these to your `schema.prisma` for optimal performance:

```prisma
model User {
  // ... fields
  
  @@index([organizationId, role])
  @@index([email])
}

model Department {
  // ... fields
  
  @@index([organizationId, parentId])
}

model CustomRole {
  // ... fields
  
  @@index([organizationId, departmentId])
}

model Permission {
  // ... fields
  
  @@index([roleId, resource, action])
}

model Outpass {
  // ... fields
  
  @@index([organizationId, status, studentId])
}

model Meeting {
  // ... fields
  
  @@index([organizationId, status, staffId])
  @@index([organizationId, status, studentId])
}

model Notification {
  // ... fields
  
  @@index([userId, isRead])
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot reach database server"

**Problem:** Database connection fails
**Solutions:**
```powershell
# Check .env file
cat .env | Select-String "DATABASE_URL"

# Test connection
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Verify Supabase connection string format:
# postgresql://postgres.PROJECT:[PASSWORD]@HOST:6543/postgres?pgbouncer=true

# For migrations, use direct connection (port 5432):
# postgresql://postgres.PROJECT:[PASSWORD]@HOST:5432/postgres
```

#### 2. "Slow query detected"

**Problem:** Queries taking >1000ms
**Solutions:**
```powershell
# Run performance analysis
node performance-utils.js

# Check for missing indexes
# Add indexes to schema.prisma
# Generate and apply migration
node migrate-helper.js generate
```

#### 3. "Migration failed"

**Problem:** Migration errors
**Solutions:**
```powershell
# Check migration status
node migrate-helper.js check

# Reset and reinitialize (CAUTION!)
node migrate-helper.js reset
node migrate-helper.js init
```

#### 4. "Test failures"

**Problem:** Database tests failing
**Solutions:**
```powershell
# Run health check first
node db-health-check.js

# Check specific test output
node test-database.js

# If data consistency issues, clean and reseed
node migrate-helper.js reset
node seed-database.js
```

#### 5. "Orphaned records"

**Problem:** Data integrity issues
**Solutions:**
```powershell
# Run health check to identify
node db-health-check.js

# Clean up manually in Prisma Studio
npx prisma studio

# Or reset and reseed
node seed-database.js
```

---

## 📈 Monitoring in Production

### Daily Health Checks

Set up a cron job or scheduled task:

```powershell
# Windows Task Scheduler
# Run: node db-health-check.js
# Schedule: Daily at 2 AM
```

### Performance Monitoring

```powershell
# Weekly performance analysis
node performance-utils.js > performance-report-$(Get-Date -Format "yyyy-MM-dd").txt
```

### Backup Strategy

```powershell
# Automated backups via Supabase dashboard
# Or manual backup:
# pg_dump DATABASE_URL > backup-$(Get-Date -Format "yyyy-MM-dd").sql
```

---

## 🎯 Best Practices

1. **Always test locally first**
   ```powershell
   node test-database.js
   ```

2. **Review migrations before applying**
   ```powershell
   node migrate-helper.js generate
   # Review the generated SQL file
   node migrate-helper.js apply
   ```

3. **Use seed data in development**
   ```powershell
   node seed-database.js
   ```

4. **Monitor health regularly**
   ```powershell
   node db-health-check.js
   ```

5. **Optimize queries with performance utils**
   ```javascript
   const { QueryOptimizer } = require('./performance-utils');
   ```

6. **Keep production data backed up**
   - Enable automated backups in Supabase
   - Test restoration periodically

7. **Use transactions for related operations**
   ```javascript
   await prisma.$transaction([/* operations */]);
   ```

---

## 🚀 Next Steps

1. **Set up your database**
   - Follow [GET_SUPABASE_DB_CONNECTION.md](GET_SUPABASE_DB_CONNECTION.md)

2. **Initialize**
   ```powershell
   node migrate-helper.js init
   ```

3. **Test everything**
   ```powershell
   node test-database.js
   node db-health-check.js
   ```

4. **Load sample data**
   ```powershell
   node seed-database.js
   ```

5. **Start development**
   ```powershell
   npm run dev
   ```

6. **Test AI Organization Builder**
   ```powershell
   node test-ai-orgbuilder.js "Create an organization"
   ```

---

## 📞 Need Help?

- Check [GET_SUPABASE_DB_CONNECTION.md](GET_SUPABASE_DB_CONNECTION.md) for connection setup
- Run `node migrate-helper.js help` for migration help
- Review test output for specific error messages
- Check Supabase dashboard for database status

---

**Made with ❤️ for StaffHub**  
*Database excellence through comprehensive testing and optimization*
