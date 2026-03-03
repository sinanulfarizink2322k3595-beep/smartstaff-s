/**
 * Database Seed Script
 * 
 * Populates the database with sample data for testing and development
 * Run with: node seed-database.js
 * 
 * Creates:
 * - 2 Organizations
 * - 8 Users (varied roles)
 * - Hierarchical departments
 * - Custom roles with permissions
 * - Sample outpasses and meetings
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Clearing existing test data...\n');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.permission.deleteMany({});
  await prisma.customRole.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.outpass.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.campus.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  console.log('✅ Database cleared\n');
}

async function seedOrganizations() {
  console.log('🏢 Creating organizations...\n');
  
  const orgs = await Promise.all([
    prisma.organization.create({
      data: {
        name: 'Nilgiri College of Science',
        subdomain: 'nilgiri-college',
        contactEmail: 'admin@nilgiri.edu',
        contactPhone: '+91-1234567890',
        address: '123 College Road, Nilgiri Hills',
        subscriptionPlan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
      },
    }),
    prisma.organization.create({
      data: {
        name: 'Tech University',
        subdomain: 'tech-university',
        contactEmail: 'admin@techuniv.edu',
        contactPhone: '+91-9876543210',
        address: '456 University Avenue, Tech City',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
      },
    }),
  ]);
  
  console.log(`✅ Created ${orgs.length} organizations\n`);
  return orgs;
}

async function seedUsers(orgId) {
  console.log('👥 Creating users...\n');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@nilgiri.edu',
        name: 'Dr. Rajesh Kumar',
        role: 'ADMIN',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543210',
        isActive: true,
      },
    }),
    // Staff members
    prisma.user.create({
      data: {
        email: 'staff1@nilgiri.edu',
        name: 'Prof. Priya Sharma',
        role: 'STAFF',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543211',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff2@nilgiri.edu',
        name: 'Dr. Amit Patel',
        role: 'STAFF',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543212',
        isActive: true,
      },
    }),
    // Students
    prisma.user.create({
      data: {
        email: 'student1@nilgiri.edu',
        name: 'Rahul Singh',
        role: 'STUDENT',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543213',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student2@nilgiri.edu',
        name: 'Ananya Reddy',
        role: 'STUDENT',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543214',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'student3@nilgiri.edu',
        name: 'Karthik Menon',
        role: 'STUDENT',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543215',
        isActive: true,
      },
    }),
    // Security
    prisma.user.create({
      data: {
        email: 'security@nilgiri.edu',
        name: 'Ravi Varma',
        role: 'SECURITY',
        organizationId: orgId,
        passwordHash: hashedPassword,
        phoneNumber: '+91-9876543216',
        isActive: true,
      },
    }),
  ]);
  
  console.log(`✅ Created ${users.length} users\n`);
  return users;
}

async function seedDepartments(orgId) {
  console.log('🏗️  Creating hierarchical departments...\n');
  
  // Parent departments
  const academic = await prisma.department.create({
    data: {
      name: 'Academic Affairs',
      description: 'Handles all academic programs and curriculum development',
      level: 0,
      color: '#3B82F6',
      icon: 'building',
      organizationId: orgId,
    },
  });
  
  const admin = await prisma.department.create({
    data: {
      name: 'Administration',
      description: 'Administrative and operational management',
      level: 0,
      color: '#F59E0B',
      icon: 'briefcase',
      organizationId: orgId,
    },
  });
  
  // Child departments under Academic Affairs
  const cs = await prisma.department.create({
    data: {
      name: 'Computer Science',
      description: 'CS and IT programs',
      level: 1,
      color: '#8B5CF6',
      icon: 'chart',
      parentId: academic.id,
      organizationId: orgId,
    },
  });
  
  const math = await prisma.department.create({
    data: {
      name: 'Mathematics',
      description: 'Mathematics and Statistics',
      level: 1,
      color: '#10B981',
      icon: 'chart',
      parentId: academic.id,
      organizationId: orgId,
    },
  });
  
  const physics = await prisma.department.create({
    data: {
      name: 'Physics',
      description: 'Physics and Applied Sciences',
      level: 1,
      color: '#EF4444',
      icon: 'chart',
      parentId: academic.id,
      organizationId: orgId,
    },
  });
  
  // Child departments under Administration
  const hr = await prisma.department.create({
    data: {
      name: 'Human Resources',
      description: 'HR and Staff Management',
      level: 1,
      color: '#EC4899',
      icon: 'users',
      parentId: admin.id,
      organizationId: orgId,
    },
  });
  
  console.log('✅ Created 6 departments (2 parent, 4 child)\n');
  return { academic, admin, cs, math, physics, hr };
}

async function seedCustomRolesAndPermissions(orgId, departments) {
  console.log('🔐 Creating custom roles and permissions...\n');
  
  // Principal role
  const principal = await prisma.customRole.create({
    data: {
      name: 'Principal',
      description: 'Head of institution with full authority',
      level: 10,
      organizationId: orgId,
    },
  });
  
  await prisma.permission.createMany({
    data: [
      { resource: 'user', action: 'create', roleId: principal.id },
      { resource: 'user', action: 'update', roleId: principal.id },
      { resource: 'user', action: 'delete', roleId: principal.id },
      { resource: 'department', action: 'create', roleId: principal.id },
      { resource: 'outpass', action: 'approve', roleId: principal.id },
      { resource: 'meeting', action: 'approve', roleId: principal.id },
    ],
  });
  
  // Department Head role
  const deptHead = await prisma.customRole.create({
    data: {
      name: 'Department Head',
      description: 'Head of academic department',
      level: 8,
      departmentId: departments.cs.id,
      organizationId: orgId,
    },
  });
  
  await prisma.permission.createMany({
    data: [
      { resource: 'outpass', action: 'approve', roleId: deptHead.id },
      { resource: 'meeting', action: 'approve', roleId: deptHead.id },
      { resource: 'user', action: 'update', roleId: deptHead.id },
    ],
  });
  
  // Faculty role
  const faculty = await prisma.customRole.create({
    data: {
      name: 'Faculty',
      description: 'Teaching staff member',
      level: 5,
      departmentId: departments.cs.id,
      organizationId: orgId,
    },
  });
  
  await prisma.permission.createMany({
    data: [
      { resource: 'outpass', action: 'approve', roleId: faculty.id },
      { resource: 'meeting', action: 'approve', roleId: faculty.id },
      { resource: 'outpass', action: 'view', roleId: faculty.id },
    ],
  });
  
  // Student Representative role
  const studentRep = await prisma.customRole.create({
    data: {
      name: 'Student Representative',
      description: 'Student council member',
      level: 3,
      organizationId: orgId,
    },
  });
  
  await prisma.permission.createMany({
    data: [
      { resource: 'outpass', action: 'create', roleId: studentRep.id },
      { resource: 'meeting', action: 'create', roleId: studentRep.id },
      { resource: 'outpass', action: 'view', roleId: studentRep.id },
    ],
  });
  
  console.log('✅ Created 4 custom roles with permissions\n');
  return { principal, deptHead, faculty, studentRep };
}

async function seedCampusStructure(orgId) {
  console.log('🏫 Creating campus structure...\n');
  
  const campus = await prisma.campus.create({
    data: {
      name: 'Main Campus',
      address: '123 College Road, Nilgiri Hills',
      organizationId: orgId,
    },
  });
  
  const blocks = await Promise.all([
    prisma.block.create({
      data: {
        name: 'Science Block',
        code: 'SB',
        campusId: campus.id,
      },
    }),
    prisma.block.create({
      data: {
        name: 'Administrative Block',
        code: 'AB',
        campusId: campus.id,
      },
    }),
  ]);
  
  // Create rooms in Science Block
  await prisma.room.createMany({
    data: [
      { name: 'Lab 101', number: '101', blockId: blocks[0].id },
      { name: 'Lab 102', number: '102', blockId: blocks[0].id },
      { name: 'Lecture Hall 1', number: '201', blockId: blocks[0].id },
      { name: 'Faculty Room', number: '301', blockId: blocks[0].id },
    ],
  });
  
  // Create rooms in Admin Block
  await prisma.room.createMany({
    data: [
      { name: 'Principal Office', number: 'A01', blockId: blocks[1].id },
      { name: 'HR Office', number: 'A02', blockId: blocks[1].id },
      { name: 'Meeting Room', number: 'A03', blockId: blocks[1].id },
    ],
  });
  
  console.log('✅ Created 1 campus, 2 blocks, 7 rooms\n');
  return { campus, blocks };
}

async function seedOutpasses(orgId, students, staff) {
  console.log('📋 Creating sample outpasses...\n');
  
  const outpasses = await Promise.all([
    prisma.outpass.create({
      data: {
        studentId: students[0].id,
        reason: 'Medical appointment',
        destination: 'City Hospital',
        outTime: new Date('2026-03-01T10:00:00'),
        expectedReturnTime: new Date('2026-03-01T14:00:00'),
        status: 'APPROVED',
        approvedById: staff[0].id,
        organizationId: orgId,
      },
    }),
    prisma.outpass.create({
      data: {
        studentId: students[1].id,
        reason: 'Family function',
        destination: 'Home',
        outTime: new Date('2026-03-02T15:00:00'),
        expectedReturnTime: new Date('2026-03-03T10:00:00'),
        status: 'PENDING',
        organizationId: orgId,
      },
    }),
    prisma.outpass.create({
      data: {
        studentId: students[2].id,
        reason: 'Project work',
        destination: 'Tech Park',
        outTime: new Date('2026-03-01T09:00:00'),
        expectedReturnTime: new Date('2026-03-01T17:00:00'),
        status: 'REJECTED',
        approvedById: staff[1].id,
        rejectionReason: 'Insufficient reason provided',
        organizationId: orgId,
      },
    }),
  ]);
  
  console.log(`✅ Created ${outpasses.length} outpasses\n`);
  return outpasses;
}

async function seedMeetings(orgId, students, staff) {
  console.log('📅 Creating sample meetings...\n');
  
  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        studentId: students[0].id,
        staffId: staff[0].id,
        purpose: 'Project guidance discussion',
        scheduledTime: new Date('2026-03-03T14:00:00'),
        duration: 30,
        status: 'APPROVED',
        organizationId: orgId,
      },
    }),
    prisma.meeting.create({
      data: {
        studentId: students[1].id,
        staffId: staff[1].id,
        purpose: 'Academic counseling',
        scheduledTime: new Date('2026-03-04T11:00:00'),
        duration: 45,
        status: 'PENDING',
        organizationId: orgId,
      },
    }),
    prisma.meeting.create({
      data: {
        studentId: students[2].id,
        staffId: staff[0].id,
        purpose: 'Course selection help',
        scheduledTime: new Date('2026-03-05T10:00:00'),
        duration: 30,
        status: 'COMPLETED',
        organizationId: orgId,
      },
    }),
  ]);
  
  console.log(`✅ Created ${meetings.length} meetings\n`);
  return meetings;
}

async function seedNotifications(orgId, users) {
  console.log('🔔 Creating sample notifications...\n');
  
  await prisma.notification.createMany({
    data: [
      {
        userId: users[3].id,
        type: 'OUTPASS',
        title: 'Outpass Approved',
        message: 'Your outpass request for medical appointment has been approved',
        organizationId: orgId,
      },
      {
        userId: users[4].id,
        type: 'MEETING',
        title: 'Meeting Request Received',
        message: 'Your meeting request is pending approval',
        organizationId: orgId,
      },
      {
        userId: users[5].id,
        type: 'OUTPASS',
        title: 'Outpass Rejected',
        message: 'Your outpass request has been rejected. Reason: Insufficient reason provided',
        isRead: false,
        organizationId: orgId,
      },
      {
        userId: users[1].id,
        type: 'MEETING',
        title: 'New Meeting Request',
        message: 'You have a new meeting request from Ananya Reddy',
        isRead: false,
        organizationId: orgId,
      },
    ],
  });
  
  console.log('✅ Created 4 notifications\n');
}

// Main seed function
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE SEED SCRIPT                              ║');
  console.log('║          StaffHub NextJS - Sample Data                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Clear existing data
    await clearDatabase();
    
    // Seed organizations
    const orgs = await seedOrganizations();
    const mainOrg = orgs[0];
    
    // Seed users
    const users = await seedUsers(mainOrg.id);
    const admin = users[0];
    const staff = users.slice(1, 3);
    const students = users.slice(3, 6);
    const security = users[6];
    
    // Seed departments
    const departments = await seedDepartments(mainOrg.id);
    
    // Seed custom roles and permissions
    await seedCustomRolesAndPermissions(mainOrg.id, departments);
    
    // Seed campus structure
    await seedCampusStructure(mainOrg.id);
    
    // Seed outpasses
    await seedOutpasses(mainOrg.id, students, staff);
    
    // Seed meetings
    await seedMeetings(mainOrg.id, students, staff);
    
    // Seed notifications
    await seedNotifications(mainOrg.id, users);
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log('   - 2 Organizations');
    console.log('   - 7 Users (1 Admin, 2 Staff, 3 Students, 1 Security)');
    console.log('   - 6 Departments (hierarchical structure)');
    console.log('   - 4 Custom Roles with permissions');
    console.log('   - 1 Campus, 2 Blocks, 7 Rooms');
    console.log('   - 3 Outpasses (various statuses)');
    console.log('   - 3 Meetings (various statuses)');
    console.log('   - 4 Notifications\n');
    console.log('🔑 Test Login Credentials (password: password123):');
    console.log('   Admin:    admin@nilgiri.edu');
    console.log('   Staff:    staff1@nilgiri.edu');
    console.log('   Student:  student1@nilgiri.edu');
    console.log('   Security: security@nilgiri.edu\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
