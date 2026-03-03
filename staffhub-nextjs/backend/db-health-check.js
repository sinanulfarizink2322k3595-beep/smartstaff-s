/**
 * Database Health Checker
 * 
 * Comprehensive health monitoring for the database
 * Run with: node db-health-check.js
 * 
 * Checks:
 * - Connection status
 * - Table integrity
 * - Data consistency
 * - Performance metrics
 * - Backup recommendations
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Health check results
const health = {
  overall: 'HEALTHY',
  checks: [],
  warnings: [],
  errors: [],
  metrics: {},
};

function addCheck(name, status, details = '') {
  const check = { name, status, details };
  health.checks.push(check);
  
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️ ' : '❌';
  const color = status === 'PASS' ? 'green' : status === 'WARN' ? 'yellow' : 'red';
  const statusText = colorize(status, color);
  
  console.log(`${icon} ${name}: ${statusText}${details ? ' - ' + details : ''}`);
  
  if (status === 'WARN') {
    health.warnings.push(check);
    if (health.overall === 'HEALTHY') health.overall = 'WARNING';
  } else if (status === 'FAIL') {
    health.errors.push(check);
    health.overall = 'CRITICAL';
  }
}

function section(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(title, 'cyan'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

async function checkDatabaseConnection() {
  section('🔌 Database Connection');
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    health.metrics.connectionLatency = latency;
    
    if (latency < 50) {
      addCheck('Connection', 'PASS', `${latency}ms (excellent)`);
    } else if (latency < 200) {
      addCheck('Connection', 'PASS', `${latency}ms (good)`);
    } else if (latency < 500) {
      addCheck('Connection', 'WARN', `${latency}ms (slow)`);
    } else {
      addCheck('Connection', 'FAIL', `${latency}ms (very slow)`);
    }
    
    return true;
  } catch (error) {
    addCheck('Connection', 'FAIL', error.message);
    return false;
  }
}

async function checkDatabaseVersion() {
  section('📊 Database Information');
  
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    const version = result[0].version;
    
    console.log(`   PostgreSQL Version: ${version}\n`);
    
    if (version.includes('PostgreSQL 14') || version.includes('PostgreSQL 15') || version.includes('PostgreSQL 16')) {
      addCheck('PostgreSQL Version', 'PASS', 'Supported version');
    } else {
      addCheck('PostgreSQL Version', 'WARN', 'Consider upgrading');
    }
  } catch (error) {
    addCheck('PostgreSQL Version', 'FAIL', error.message);
  }
}

async function checkTableIntegrity() {
  section('🗄️  Table Integrity');
  
  const models = [
    'organization', 'user', 'campus', 'block', 'room',
    'outpass', 'meeting', 'emergencyRequest', 'notification',
    'department', 'customRole', 'permission',
  ];
  
  let allTablesOk = true;
  
  for (const model of models) {
    try {
      await prisma[model].count();
      addCheck(`Table: ${model}`, 'PASS');
    } catch (error) {
      addCheck(`Table: ${model}`, 'FAIL', error.message);
      allTablesOk = false;
    }
  }
  
  if (allTablesOk) {
    health.metrics.tableIntegrity = 'ALL_OK';
  }
}

async function checkDataConsistency() {
  section('🔍 Data Consistency');
  
  try {
    // Check for orphaned users (no organization)
    const orphanedUsers = await prisma.user.count({
      where: { organizationId: null },
    });
    
    if (orphanedUsers === 0) {
      addCheck('Orphaned Users', 'PASS', 'None found');
    } else {
      addCheck('Orphaned Users', 'WARN', `${orphanedUsers} user(s) without organization`);
    }
    
    // Check for orphaned departments
    const orphanedDepts = await prisma.department.count({
      where: { organizationId: null },
    });
    
    if (orphanedDepts === 0) {
      addCheck('Orphaned Departments', 'PASS', 'None found');
    } else {
      addCheck('Orphaned Departments', 'WARN', `${orphanedDepts} department(s) without organization`);
    }
    
    // Check for invalid parent references in departments
    const depts = await prisma.department.findMany({
      where: { parentId: { not: null } },
      select: { id: true, parentId: true },
    });
    
    let invalidRefs = 0;
    const deptIds = new Set(depts.map(d => d.id));
    
    for (const dept of depts) {
      if (!deptIds.has(dept.parentId)) {
        invalidRefs++;
      }
    }
    
    if (invalidRefs === 0) {
      addCheck('Department References', 'PASS', 'All valid');
    } else {
      addCheck('Department References', 'FAIL', `${invalidRefs} invalid parent reference(s)`);
    }
    
    // Check for circular references
    let circularRefs = false;
    for (const dept of depts) {
      const visited = new Set([dept.id]);
      let current = dept.parentId;
      
      while (current) {
        if (visited.has(current)) {
          circularRefs = true;
          break;
        }
        visited.add(current);
        
        const parent = depts.find(d => d.id === current);
        current = parent?.parentId;
      }
      
      if (circularRefs) break;
    }
    
    if (!circularRefs) {
      addCheck('Circular References', 'PASS', 'None found');
    } else {
      addCheck('Circular References', 'FAIL', 'Circular department hierarchy detected');
    }
    
  } catch (error) {
    addCheck('Data Consistency', 'FAIL', error.message);
  }
}

async function checkDataVolume() {
  section('📈 Data Volume');
  
  try {
    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      customRoles: await prisma.customRole.count(),
      outpasses: await prisma.outpass.count(),
      meetings: await prisma.meeting.count(),
      notifications: await prisma.notification.count(),
    };
    
    health.metrics.dataCounts = counts;
    
    console.log('   Current Data:');
    Object.entries(counts).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value.toLocaleString()}`);
    });
    console.log('');
    
    // Check if any table is getting large
    let hasLargeTables = false;
    if (counts.notifications > 10000) {
      addCheck('Notification Volume', 'WARN', 'Consider archiving old notifications');
      hasLargeTables = true;
    }
    if (counts.outpasses > 50000) {
      addCheck('Outpass Volume', 'WARN', 'Consider archiving old outpasses');
      hasLargeTables = true;
    }
    
    if (!hasLargeTables) {
      addCheck('Data Volume', 'PASS', 'Within normal limits');
    }
    
  } catch (error) {
    addCheck('Data Volume', 'FAIL', error.message);
  }
}

async function checkIndexes() {
  section('📑 Index Status');
  
  try {
    const indexes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    health.metrics.indexCount = indexes.length;
    
    console.log(`   Total indexes: ${indexes.length}\n`);
    
    // Check for key indexes
    const keyTables = ['user', 'organization', 'department', 'outpass', 'meeting'];
    const missingIndexes = [];
    
    for (const table of keyTables) {
      const tableIndexes = indexes.filter(idx => 
        idx.tablename.toLowerCase() === table.toLowerCase()
      );
      
      if (tableIndexes.length === 0) {
        missingIndexes.push(table);
      }
    }
    
    if (missingIndexes.length === 0) {
      addCheck('Key Table Indexes', 'PASS', 'All key tables have indexes');
    } else {
      addCheck('Key Table Indexes', 'WARN', `Tables without indexes: ${missingIndexes.join(', ')}`);
    }
    
  } catch (error) {
    addCheck('Index Status', 'WARN', 'Could not check indexes');
  }
}

async function checkPerformance() {
  section('⚡ Performance Metrics');
  
  try {
    // Test query performance
    const queries = [
      { name: 'Simple Count', fn: () => prisma.organization.count() },
      { name: 'Simple Find', fn: () => prisma.organization.findMany({ take: 10 }) },
      { name: 'Nested Query', fn: () => prisma.organization.findFirst({ include: { users: { take: 5 } } }) },
    ];
    
    const results = [];
    
    for (const query of queries) {
      const start = Date.now();
      try {
        await query.fn();
        const duration = Date.now() - start;
        results.push({ name: query.name, duration });
        
        if (duration < 100) {
          addCheck(query.name, 'PASS', `${duration}ms`);
        } else if (duration < 500) {
          addCheck(query.name, 'WARN', `${duration}ms (could be faster)`);
        } else {
          addCheck(query.name, 'FAIL', `${duration}ms (too slow)`);
        }
      } catch (error) {
        addCheck(query.name, 'FAIL', error.message);
      }
    }
    
    health.metrics.queryPerformance = results;
    
  } catch (error) {
    addCheck('Performance', 'FAIL', error.message);
  }
}

async function checkBackups() {
  section('💾 Backup Status');
  
  // This is informational only
  console.log('   ℹ️  Backup recommendations:');
  console.log('   - Enable automated daily backups on your database host');
  console.log('   - Test backup restoration periodically');
  console.log('   - Consider point-in-time recovery for production');
  console.log('');
  
  addCheck('Backup Configuration', 'WARN', 'Manual verification required');
}

async function checkSecurity() {
  section('🔒 Security Checks');
  
  try {
    // Check for users with default/weak passwords (heuristic)
    const users = await prisma.user.findMany({
      select: { id: true, passwordHash: true },
    });
    
    // This is a basic check - in real scenario you'd check against known weak hash patterns
    if (users.length > 0) {
      addCheck('User Count', 'PASS', `${users.length} user(s) in database`);
    }
    
    // Check for active organizations
    const activeOrgs = await prisma.organization.count({
      where: { subscriptionStatus: 'ACTIVE' },
    });
    
    const totalOrgs = await prisma.organization.count();
    
    addCheck('Active Organizations', 'PASS', `${activeOrgs} of ${totalOrgs} active`);
    
    // Check for admin users
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    
    if (adminCount > 0) {
      addCheck('Admin Users', 'PASS', `${adminCount} admin(s) configured`);
    } else {
      addCheck('Admin Users', 'WARN', 'No admin users found');
    }
    
  } catch (error) {
    addCheck('Security', 'FAIL', error.message);
  }
}

function printSummary() {
  section('📋 Health Check Summary');
  
  console.log('');
  console.log(`   Overall Status: ${colorize(health.overall, 
    health.overall === 'HEALTHY' ? 'green' : 
    health.overall === 'WARNING' ? 'yellow' : 'red'
  )}`);
  console.log(`   Total Checks: ${health.checks.length}`);
  console.log(`   ${colorize('✅', 'green')} Passed: ${health.checks.filter(c => c.status === 'PASS').length}`);
  console.log(`   ${colorize('⚠️ ', 'yellow')} Warnings: ${health.warnings.length}`);
  console.log(`   ${colorize('❌', 'red')} Failed: ${health.errors.length}`);
  console.log('');
  
  if (health.warnings.length > 0) {
    console.log(colorize('   ⚠️  Warnings:', 'yellow'));
    health.warnings.forEach(w => {
      console.log(`      - ${w.name}: ${w.details}`);
    });
    console.log('');
  }
  
  if (health.errors.length > 0) {
    console.log(colorize('   ❌ Critical Issues:', 'red'));
    health.errors.forEach(e => {
      console.log(`      - ${e.name}: ${e.details}`);
    });
    console.log('');
  }
  
  if (health.overall === 'HEALTHY') {
    console.log(colorize('   🎉 Database is in good health!', 'green'));
  } else if (health.overall === 'WARNING') {
    console.log(colorize('   ⚠️  Database is functional but has warnings', 'yellow'));
  } else {
    console.log(colorize('   ❌ Database has critical issues that need attention', 'red'));
  }
  
  console.log('');
}

// Main function
async function main() {
  console.log('\n' + colorize('╔════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║          DATABASE HEALTH CHECK                             ║', 'cyan'));
  console.log(colorize('║          StaffHub NextJS - Comprehensive Diagnostics       ║', 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'cyan'));
  
  const start = Date.now();
  
  const connected = await checkDatabaseConnection();
  
  if (!connected) {
    console.log('\n' + colorize('❌ Cannot proceed without database connection', 'red'));
    console.log(colorize('💡 Check your DATABASE_URL in .env file', 'yellow'));
    console.log(colorize('   See GET_SUPABASE_DB_CONNECTION.md for help\n', 'yellow'));
    process.exit(1);
  }
  
  await checkDatabaseVersion();
  await checkTableIntegrity();
  await checkDataConsistency();
  await checkDataVolume();
  await checkIndexes();
  await checkPerformance();
  await checkBackups();
  await checkSecurity();
  
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  health.metrics.checkDuration = duration;
  
  printSummary();
  
  console.log(colorize(`   Duration: ${duration}s`, 'cyan'));
  console.log(colorize('═'.repeat(60) + '\n', 'cyan'));
  
  await prisma.$disconnect();
  
  process.exit(health.errors.length > 0 ? 1 : 0);
}

// Run health check
main().catch((error) => {
  console.error(colorize('\n❌ Health check failed:', 'red'), error);
  prisma.$disconnect();
  process.exit(1);
});
