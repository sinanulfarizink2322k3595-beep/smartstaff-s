/**
 * Delete and Recreate Admin User in Supabase
 * Run this if the previous script couldn't update the password
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateAdmin() {
  const email = 'farizisinanul@gmail.com';
  const password = 'sfnk123#';

  console.log('\n🔄 Recreating admin user...\n');
  console.log('⚠️  IMPORTANT: You need to delete the existing user first:');
  console.log('   1. Go to: https://supabase.com/dashboard');
  console.log('   2. Navigate to: Authentication → Users');
  console.log(`   3. Find: ${email}`);
  console.log('   4. Click three dots → Delete User');
  console.log('   5. Then run this script again\n');

  const answer = await new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('Have you deleted the user? (yes/no): ', (ans) => {
      readline.close();
      resolve(ans.toLowerCase());
    });
  });

  if (answer !== 'yes' && answer !== 'y') {
    console.log('\n❌ Please delete the user first, then run: npm run supabase:reset-users\n');
    process.exit(0);
  }

  console.log('\n👤 Creating fresh admin user...\n');

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: 'Fariz Isinanul',
        role: 'admin',
      },
    },
  });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (data.user) {
    console.log('✅ User created successfully!\n');
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        user_id: data.user.id,
        email: email,
        full_name: 'Fariz Isinanul',
        role: 'admin',
        department: 'Administration',
      });

    if (profileError) {
      console.error('⚠️  Profile error:', profileError.message);
    } else {
      console.log('✅ Profile created!\n');
    }

    console.log('═══════════════════════════════');
    console.log('   Email:    ', email);
    console.log('   Password: ', password);
    console.log('═══════════════════════════════\n');
    console.log('🎉 Done! You can now login.\n');
  }
}

recreateAdmin().catch(console.error);
