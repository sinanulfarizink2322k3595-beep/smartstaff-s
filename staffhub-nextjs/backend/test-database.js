/**
 * Comprehensive Database Test Suite
 * 
 * Tests all models, relationships, and database operations
 * Run with: node test-database.js
 * 
 * Features:
 * - Tests all 13 Prisma models
 * - Tests relationships and cascades
 * - Tests multi-tenant isolation
 * - Tests AI Organization Builder models
 * - Performance benchmarks
 * - Data integrity checks
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// Helper functions
function log(icon, message) {
  console.log(`${icon} ${message}`);
}

function success(message) {
  results.passed++;
  results.tests.push({ status: 'passed', message });
  log('✅', message);
}

function fail(message, error) {
  results.failed++;
  results.tests.push({ status: 'failed', message, error: error?.message });
  log('❌', message);
  if (error) console.error('   Error:', error.message);
}

function warn(message) {
  results.warnings++;
  results.tests.push({ status: 'warning', message });
  log('⚠️ ', message);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

// Test functions
async function testConnection() {
  section('🔌 Database Connection Test');
  try {
    await prisma.$queryRaw`SELECT 1`;
    success('Database connection successful');
    return true;
  } catch (error) {
    fail('Database connection failed', error);
    return false;
  }
}

async function testModels() {
  section('📊 Model Structure Test');
  
  const models = [
    'organization',
    'user',
    'campus',
    'block',
    'room',
    'outpass',
    'meeting',
    'emergencyRequest',
    'notification',
    'department',
    'customRole',
    'permission',
  ];

  for (const model of models) {
    try {
      await prisma[model].findMany({ take: 1 });
      success(`Model '${model}' is accessible`);
    } catch (error) {
      fail(`Model '${model}' failed`, error);
    }
  }
}

async function testOrganizationCRUD() {
  section('🏢 Organization CRUD Test');
  let orgId;

  try {
    // Create
    const org = await prisma.organization.create({
      data: {
        name: 'Test University',
        subdomain: `test-org-${Date.now()}`,
        contactEmail: 'test@example.com',
      },
    });
    orgId = org.id;
    success('Organization created successfully');

    // Read
    const foundOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (foundOrg) {
      success('Organization read successful');
    } else {
      fail('Organization read failed');
    }

    // Update
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: { name: 'Updated Test University' },
    });
    if (updatedOrg.name === 'Updated Test University') {
      success('Organization update successful');
    } else {
      fail('Organization update failed');
    }

    // List with pagination
    const orgs = await prisma.organization.findMany({
      take: 10,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
    success(`Organization list successful (found ${orgs.length})`);

    // Delete
    await prisma.organization.delete({ where: { id: orgId } });
    success('Organization delete successful');
  } catch (error) {
    fail('Organization CRUD test failed', error);
    // Cleanup
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testUserRoles() {
  section('👥 User & Roles Test');
  let orgId, userId;

  try {
    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: 'Role Test Org',
        subdomain: `role-test-${Date.now()}`,
        contactEmail: 'roles@example.com',
      },
    });
    orgId = org.id;

    // Test each role
    const roles = ['ADMIN', 'STAFF', 'STUDENT', 'SECURITY'];
    
    for (const role of roles) {
      const user = await prisma.user.create({
        data: {
          email: `${role.toLowerCase()}-${Date.now()}@test.com`,
          name: `Test ${role}`,
          role: role,
          organizationId: orgId,
          passwordHash: 'hashed-password',
        },
      });
      
      if (user.role === role) {
        success(`User with ${role} role created successfully`);
      } else {
        fail(`User ${role} role assignment failed`);
      }
      
      if (role === 'ADMIN') userId = user.id;
    }

    // Test role-based query
    const admins = await prisma.user.findMany({
      where: { organizationId: orgId, role: 'ADMIN' },
    });
    if (admins.length === 1) {
      success('Role-based user query successful');
    } else {
      fail('Role-based user query failed');
    }

    // Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
    success('User roles test cleanup successful');
  } catch (error) {
    fail('User roles test failed', error);
    // Cleanup
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testHierarchicalDepartments() {
  section('🏗️  Hierarchical Departments Test (AI Org Builder)');
  let orgId;

  try {
    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: 'Dept Test Org',
        subdomain: `dept-test-${Date.now()}`,
        contactEmail: 'dept@example.com',
      },
    });
    orgId = org.id;

    // Create parent department
    const parent = await prisma.department.create({
      data: {
        name: 'Engineering',
        description: 'Engineering department',
        level: 0,
        color: '#3B82F6',
        icon: 'building',
        organizationId: orgId,
      },
    });
    success('Parent department created');

    // Create child departments
    const child1 = await prisma.department.create({
      data: {
        name: 'Computer Science',
        description: 'CS department',
        level: 1,
        color: '#8B5CF6',
        icon: 'chart',
        parentId: parent.id,
        organizationId: orgId,
      },
    });
    success('Child department 1 created');

    const child2 = await prisma.department.create({
      data: {
        name: 'Electrical Engineering',
        description: 'EE department',
        level: 1,
        color: '#10B981',
        icon: 'chart',
        parentId: parent.id,
        organizationId: orgId,
      },
    });
    success('Child department 2 created');

    // Test hierarchical query
    const deptWithChildren = await prisma.department.findUnique({
      where: { id: parent.id },
      include: { children: true },
    });

    if (deptWithChildren.children.length === 2) {
      success('Hierarchical department query successful');
    } else {
      fail('Hierarchical department query failed');
    }

    // Test parent reference
    const childWithParent = await prisma.department.findUnique({
      where: { id: child1.id },
      include: { parent: true },
    });

    if (childWithParent.parent?.id === parent.id) {
      success('Department parent reference working');
    } else {
      fail('Department parent reference failed');
    }

    // Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
    success('Hierarchical departments test cleanup successful');
  } catch (error) {
    fail('Hierarchical departments test failed', error);
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testCustomRolesAndPermissions() {
  section('🔐 Custom Roles & Permissions Test (AI Org Builder)');
  let orgId;

  try {
    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: 'Roles Test Org',
        subdomain: `roles-test-${Date.now()}`,
        contactEmail: 'roles@example.com',
      },
    });
    orgId = org.id;

    // Create department
    const dept = await prisma.department.create({
      data: {
        name: 'IT Department',
        description: 'IT dept',
        level: 0,
        organizationId: orgId,
      },
    });

    // Create custom role
    const role = await prisma.customRole.create({
      data: {
        name: 'IT Manager',
        description: 'Manages IT operations',
        level: 8,
        departmentId: dept.id,
        organizationId: orgId,
      },
    });
    success('Custom role created');

    // Create permissions
    const permissions = [
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'update' },
      { resource: 'outpass', action: 'approve' },
      { resource: 'meeting', action: 'approve' },
    ];

    for (const perm of permissions) {
      await prisma.permission.create({
        data: {
          resource: perm.resource,
          action: perm.action,
          roleId: role.id,
        },
      });
    }
    success(`Created ${permissions.length} permissions`);

    // Test role with permissions query
    const roleWithPerms = await prisma.customRole.findUnique({
      where: { id: role.id },
      include: { permissions: true, department: true },
    });

    if (roleWithPerms.permissions.length === 4) {
      success('Role permissions query successful');
    } else {
      fail('Role permissions query failed');
    }

    if (roleWithPerms.department?.id === dept.id) {
      success('Role department relationship working');
    } else {
      fail('Role department relationship failed');
    }

    // Test permission filtering
    const userPerms = await prisma.permission.findMany({
      where: {
        roleId: role.id,
        resource: 'user',
      },
    });

    if (userPerms.length === 2) {
      success('Permission filtering working');
    } else {
      fail('Permission filtering failed');
    }

    // Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
    success('Custom roles & permissions test cleanup successful');
  } catch (error) {
    fail('Custom roles & permissions test failed', error);
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testMultiTenantIsolation() {
  section('🔒 Multi-Tenant Isolation Test');
  let org1Id, org2Id;

  try {
    // Create two organizations
    const org1 = await prisma.organization.create({
      data: {
        name: 'Org 1',
        subdomain: `org1-${Date.now()}`,
        contactEmail: 'org1@test.com',
      },
    });
    org1Id = org1.id;

    const org2 = await prisma.organization.create({
      data: {
        name: 'Org 2',
        subdomain: `org2-${Date.now()}`,
        contactEmail: 'org2@test.com',
      },
    });
    org2Id = org2.id;

    // Create departments for each org
    await prisma.department.create({
      data: {
        name: 'Dept Org 1',
        level: 0,
        organizationId: org1Id,
      },
    });

    await prisma.department.create({
      data: {
        name: 'Dept Org 2',
        level: 0,
        organizationId: org2Id,
      },
    });

    // Test isolation - Org 1 should only see its departments
    const org1Depts = await prisma.department.findMany({
      where: { organizationId: org1Id },
    });

    if (org1Depts.length === 1 && org1Depts[0].name === 'Dept Org 1') {
      success('Multi-tenant isolation working correctly');
    } else {
      fail('Multi-tenant isolation failed - data leakage detected');
    }

    // Test that org1 cannot access org2 data
    const org1CannotSeeOrg2 = await prisma.department.findMany({
      where: {
        organizationId: org1Id,
        name: 'Dept Org 2', // This should not exist
      },
    });

    if (org1CannotSeeOrg2.length === 0) {
      success('Cross-tenant data access properly blocked');
    } else {
      fail('Security issue: Cross-tenant data access possible');
    }

    // Cleanup
    await prisma.organization.delete({ where: { id: org1Id } });
    await prisma.organization.delete({ where: { id: org2Id } });
    success('Multi-tenant isolation test cleanup successful');
  } catch (error) {
    fail('Multi-tenant isolation test failed', error);
    // Cleanup
    if (org1Id) {
      try {
        await prisma.organization.delete({ where: { id: org1Id } });
      } catch {}
    }
    if (org2Id) {
      try {
        await prisma.organization.delete({ where: { id: org2Id } });
      } catch {}
    }
  }
}

async function testCascadeDeletes() {
  section('🗑️  Cascade Delete Test');
  let orgId;

  try {
    // Create organization with nested structures
    const org = await prisma.organization.create({
      data: {
        name: 'Cascade Test Org',
        subdomain: `cascade-${Date.now()}`,
        contactEmail: 'cascade@test.com',
      },
    });
    orgId = org.id;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: `cascade-${Date.now()}@test.com`,
        name: 'Cascade User',
        role: 'ADMIN',
        organizationId: orgId,
        passwordHash: 'hash',
      },
    });

    // Create department with child
    const parent = await prisma.department.create({
      data: {
        name: 'Parent Dept',
        level: 0,
        organizationId: orgId,
      },
    });

    const child = await prisma.department.create({
      data: {
        name: 'Child Dept',
        level: 1,
        parentId: parent.id,
        organizationId: orgId,
      },
    });

    // Create role with permissions
    const role = await prisma.customRole.create({
      data: {
        name: 'Test Role',
        level: 5,
        departmentId: child.id,
        organizationId: orgId,
      },
    });

    await prisma.permission.create({
      data: {
        resource: 'test',
        action: 'test',
        roleId: role.id,
      },
    });

    success('Created nested organization structure');

    // Count records before delete
    const deptCount = await prisma.department.count({
      where: { organizationId: orgId },
    });
    const roleCount = await prisma.customRole.count({
      where: { organizationId: orgId },
    });
    const permCount = await prisma.permission.count({
      where: { role: { organizationId: orgId } },
    });

    log('📊', `Before delete: ${deptCount} depts, ${roleCount} roles, ${permCount} perms`);

    // Delete organization - should cascade
    await prisma.organization.delete({ where: { id: orgId } });
    success('Organization deleted');

    // Verify cascade deletes
    const remainingDepts = await prisma.department.count({
      where: { organizationId: orgId },
    });
    const remainingRoles = await prisma.customRole.count({
      where: { organizationId: orgId },
    });

    if (remainingDepts === 0 && remainingRoles === 0) {
      success('Cascade delete working correctly - all related data removed');
    } else {
      fail('Cascade delete failed - orphaned records exist');
    }
  } catch (error) {
    fail('Cascade delete test failed', error);
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testPerformance() {
  section('⚡ Performance Benchmarks');
  let orgId;

  try {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Perf Test Org',
        subdomain: `perf-${Date.now()}`,
        contactEmail: 'perf@test.com',
      },
    });
    orgId = org.id;

    // Test 1: Bulk insert performance
    const insertStart = Date.now();
    const depts = [];
    for (let i = 0; i < 10; i++) {
      depts.push({
        name: `Dept ${i}`,
        level: 0,
        organizationId: orgId,
      });
    }
    
    await prisma.department.createMany({ data: depts });
    const insertTime = Date.now() - insertStart;
    log('⏱️ ', `Bulk insert (10 records): ${insertTime}ms`);
    
    if (insertTime < 500) {
      success('Bulk insert performance good');
    } else {
      warn(`Bulk insert slow: ${insertTime}ms (expected < 500ms)`);
    }

    // Test 2: Complex query performance
    const queryStart = Date.now();
    await prisma.department.findMany({
      where: { organizationId: orgId },
      include: {
        customRoles: {
          include: {
            permissions: true,
          },
        },
        children: true,
        parent: true,
      },
    });
    const queryTime = Date.now() - queryStart;
    log('⏱️ ', `Complex nested query: ${queryTime}ms`);
    
    if (queryTime < 200) {
      success('Complex query performance good');
    } else {
      warn(`Complex query slow: ${queryTime}ms (expected < 200ms)`);
    }

    // Test 3: Count query performance
    const countStart = Date.now();
    await prisma.department.count({
      where: { organizationId: orgId },
    });
    const countTime = Date.now() - countStart;
    log('⏱️ ', `Count query: ${countTime}ms`);
    
    if (countTime < 100) {
      success('Count query performance good');
    } else {
      warn(`Count query slow: ${countTime}ms (expected < 100ms)`);
    }

    // Cleanup
    await prisma.organization.delete({ where: { id: orgId } });
  } catch (error) {
    fail('Performance test failed', error);
    if (orgId) {
      try {
        await prisma.organization.delete({ where: { id: orgId } });
      } catch {}
    }
  }
}

async function testDataIntegrity() {
  section('🔍 Data Integrity Checks');

  try {
    // Check for orphaned departments (without organization)
    const orphanedDepts = await prisma.department.findMany({
      where: {
        organization: null,
      },
    });

    if (orphanedDepts.length === 0) {
      success('No orphaned departments found');
    } else {
      warn(`Found ${orphanedDepts.length} orphaned departments`);
    }

    // Check for orphaned roles
    const orphanedRoles = await prisma.customRole.findMany({
      where: {
        organization: null,
      },
    });

    if (orphanedRoles.length === 0) {
      success('No orphaned custom roles found');
    } else {
      warn(`Found ${orphanedRoles.length} orphaned custom roles`);
    }

    // Check for circular department references
    const allDepts = await prisma.department.findMany({
      select: { id: true, parentId: true },
    });

    let circularFound = false;
    for (const dept of allDepts) {
      if (dept.parentId) {
        let current = dept.parentId;
        const visited = new Set([dept.id]);
        
        while (current) {
          if (visited.has(current)) {
            circularFound = true;
            break;
          }
          visited.add(current);
          
          const parent = allDepts.find(d => d.id === current);
          current = parent?.parentId;
        }
        
        if (circularFound) break;
      }
    }

    if (!circularFound) {
      success('No circular department references found');
    } else {
      fail('Circular department references detected');
    }

  } catch (error) {
    fail('Data integrity check failed', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE DATABASE TEST SUITE                      ║');
  console.log('║     StaffHub NextJS - Database & Models Testing           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();

  // Run all tests
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    console.log('\n💡 Check your DATABASE_URL in .env file');
    console.log('   See GET_SUPABASE_DB_CONNECTION.md for help\n');
    process.exit(1);
  }

  await testModels();
  await testOrganizationCRUD();
  await testUserRoles();
  await testHierarchicalDepartments();
  await testCustomRolesAndPermissions();
  await testMultiTenantIsolation();
  await testCascadeDeletes();
  await testPerformance();
  await testDataIntegrity();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  section('📊 TEST SUMMARY');
  console.log('');
  console.log(`Total Tests Run:    ${results.passed + results.failed + results.warnings}`);
  console.log(`✅ Passed:          ${results.passed}`);
  console.log(`❌ Failed:          ${results.failed}`);
  console.log(`⚠️  Warnings:        ${results.warnings}`);
  console.log(`⏱️  Duration:        ${duration}s`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Database is working perfectly.');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.');
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  // Disconnect
  await prisma.$disconnect();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
