/**
 * Reset Users and Create Admin
 * This script will:
 * 1. Delete all existing users
 * 2. Create a default organization (if needed)
 * 3. Create a new admin user with specified credentials
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUsersAndCreateAdmin() {
  try {
    console.log('🚀 Starting user reset process...\n');

    // Step 1: Delete all existing users
    console.log('🗑️  Deleting all existing users...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users\n`);

    // Step 2: Ensure we have an organization
    console.log('🏢 Checking for organization...');
    let organization = await prisma.organization.findFirst();

    if (!organization) {
      console.log('   Creating default organization...');
      organization = await prisma.organization.create({
        data: {
          name: 'Nilgiri Campus',
          slug: 'nilgiri-campus',
          domain: 'nilgiri.edu',
          isActive: true,
        },
      });
      console.log(`   ✅ Created organization: ${organization.name}`);
    } else {
      console.log(`   ✅ Using existing organization: ${organization.name}`);
    }
    console.log('');

    // Step 3: Create new admin user
    console.log('👤 Creating new admin user...');
    
    const email = 'farizisinanul@gmail.com';
    const password = 'sfnk123#';
    const fullName = 'Fariz Isinanul';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'ADMIN',
        phone: null,
        department: 'Administration',
        isActive: true,
        organizationId: organization.id,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('═════════════════════════════════════════════');
    console.log('📋 Admin User Details:');
    console.log('═════════════════════════════════════════════');
    console.log(`   Email:        ${adminUser.email}`);
    console.log(`   Password:     ${password}`);
    console.log(`   Full Name:    ${adminUser.fullName}`);
    console.log(`   Role:         ${adminUser.role}`);
    console.log(`   Organization: ${organization.name}`);
    console.log(`   User ID:      ${adminUser.id}`);
    console.log('═════════════════════════════════════════════\n');

    console.log('🎉 User reset completed successfully!');
    console.log('\n💡 You can now login with:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}\n`);

  } catch (error) {
    console.error('❌ Error during user reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetUsersAndCreateAdmin()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
