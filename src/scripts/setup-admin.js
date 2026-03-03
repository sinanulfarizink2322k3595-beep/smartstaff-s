/**
 * Setup Admin User - Better Verification
 * This script helps you properly set up the admin user
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

async function setupAdmin() {
  console.log('\n🔧 SmartStaff Admin Setup\n');
  
  const email = 'farizisinanul@gmail.com';
  const password = 'sfnk123#';
  const fullName = 'Fariz Isinanul';

  console.log('📋 Admin Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);

  if (!serviceRoleKey) {
    console.log('⚠️  SERVICE_ROLE_KEY not found in .env');
    console.log('   Please follow these steps to fix email confirmation:\n');
    console.log('1️⃣  Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log(`2️⃣  Open your project: ${process.env.VITE_SUPABASE_PROJECT_ID}`);
    console.log('3️⃣  Navigate to: Authentication → Providers → Email');
    console.log('4️⃣  Toggle OFF "Confirm email" (or set the duration to 0)');
    console.log('5️⃣  Then run this script again:\n');
    console.log('   npm run setup-admin\n');
    
    console.log('OR: If you have a service role key:\n');
    console.log('1️⃣  Go to: Settings → API → Generate new token (or find existing)');
    console.log('2️⃣  Add to your .env file:');
    console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"\n');
    console.log('3️⃣  Run: npm run setup-admin\n');
    
    console.log('For now, to verify your email manually:\n');
    console.log('1️⃣  Go to: https://supabase.com/dashboard');
    console.log('2️⃣  Open your project');
    console.log('3️⃣  Go to: Authentication → Users');
    console.log(`4️⃣  Find user: ${email}`);
    console.log('5️⃣  Click the three dots (...) menu');
    console.log('6️⃣  Select "Confirm email (if not confirmed)"');
    console.log('7️⃣  Then you can login\n');
    
    process.exit(0);
  }

  // Use service role key for direct creation with email auto-confirmed
  console.log('✅ Service role key found! Creating user with confirmed email...\n');
  
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Delete existing user if exists
    console.log('🔍 Checking for existing user...');
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
    } else {
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        console.log(`   Found existing user with ID: ${existingUser.id}`);
        console.log('   Deleting old user...');
        
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          console.error('   Error deleting:', deleteError.message);
        } else {
          console.log('   ✅ Old user deleted');
        }
      }
    }

    // Create new user with email confirmed
    console.log('\n👤 Creating new admin user...');
    const { data, error } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'admin',
      },
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    console.log('✅ User created successfully!\n');

    // Create profile
    console.log('📝 Creating user profile...');
    const publicClient = createClient(supabaseUrl, supabaseKey);
    
    const { error: profileError } = await publicClient
      .from('profiles')
      .insert({
        id: data.user.id,
        user_id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'admin',
        department: 'Administration',
      });

    if (profileError) {
      console.error('⚠️  Error creating profile:', profileError.message);
    } else {
      console.log('✅ Profile created!\n');
    }

    console.log('═════════════════════════════════════════');
    console.log('🎉 Admin Setup Complete!');
    console.log('═════════════════════════════════════════');
    console.log(`\n📍 Access admin panel: http://localhost:8080/admin-login`);
    console.log(`\n📧 Email:    ${email}`);
    console.log(`🔐 Password: ${password}\n`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupAdmin().catch(console.error);
