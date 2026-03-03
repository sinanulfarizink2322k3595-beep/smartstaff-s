// Quick script to check if organizations exist in the database
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkOrganizations() {
  try {
    console.log('🔍 Checking database connection and organizations...\n');
    
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        _count: {
          select: { users: true }
        }
      }
    });

    if (organizations.length === 0) {
      console.log('❌ No organizations found in database!');
      console.log('\n📝 To create an organization:');
      console.log('1. Use the /register endpoint to create a new organization');
      console.log('2. Or run a database seed script');
      console.log('\n💡 For development, the backend will fallback to mock organizations:');
      console.log('   - smartstaff-demo');
      console.log('   - nilgiri-college');
    } else {
      console.log(`✅ Found ${organizations.length} organization(s):\n`);
      organizations.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name}`);
        console.log(`   Code: ${org.slug}`);
        console.log(`   Active: ${org.isActive}`);
        console.log(`   Users: ${org._count.users}`);
        console.log('');
      });
      
      console.log('\n💡 Use these organization codes for signup:');
      organizations.forEach(org => {
        console.log(`   - ${org.slug}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 The backend will use mock mode with these organization codes:');
    console.log('   - smartstaff-demo');
    console.log('   - nilgiri-college');
    await prisma.$disconnect();
  }
}

checkOrganizations();
