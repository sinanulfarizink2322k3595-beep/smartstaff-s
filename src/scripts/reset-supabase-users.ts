/**
 * Reset Supabase Users and Create Admin
 * This script will:
 * 1. Delete all profiles (user data)
 * 2. Create a new admin user with authentication
 * 
 * NOTE: This uses Supabase client. You need to run migrations first if not done.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetSupabaseUsers() {
  try {
    console.log('🚀 Starting Supabase user reset...\n');

    // Step 1: Delete all profiles
    console.log('🗑️  Deleting all existing profiles...');
    const { error: deleteError, count } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('   Error deleting profiles:', deleteError.message);
    } else {
      console.log(`   ✅ Deleted profiles from database\n`);
    }

    // Step 2: Create new admin user
    console.log('👤 Creating new admin user...');
    
    const email = 'farizisinanul@gmail.com';
    const password = 'sfnk123#';
    const fullName = 'Fariz Isinanul';

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin',
        },
      },
    });

    if (signUpError) {
      // If user already exists, try to update
      if (signUpError.message.includes('already registered')) {
        console.log('   ℹ️  User already exists in auth, updating profile...');
        
        // Sign in as admin to get user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.error('   ⚠️  Could not sign in:', signInError.message);
          console.log('   💡 You may need to reset the password in Supabase dashboard\n');
        } else {
          const userId = signInData.user?.id;
          
          // Update profile
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              user_id: userId,
              email: email,
              full_name: fullName,
              role: 'admin',
              department: 'Administration',
            });

          if (updateError) {
            console.error('   Error updating profile:', updateError.message);
          } else {
            console.log('   ✅ Profile updated successfully');
          }
        }
      } else {
        console.error('   Error creating user:', signUpError.message);
        throw signUpError;
      }
    } else {
      console.log('   ✅ User created in Supabase Auth');
      
      // Create profile for the new user
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            email: email,
            full_name: fullName,
            role: 'admin',
            department: 'Administration',
          });

        if (profileError) {
          console.error('   Error creating profile:', profileError.message);
        } else {
          console.log('   ✅ Profile created successfully');
        }
      }
    }

    console.log('\n═════════════════════════════════════════════');
    console.log('📋 Admin User Details:');
    console.log('═════════════════════════════════════════════');
    console.log(`   Email:        ${email}`);
    console.log(`   Password:     ${password}`);
    console.log(`   Full Name:    ${fullName}`);
    console.log(`   Role:         admin`);
    console.log(`   Platform:     Supabase`);
    console.log('═════════════════════════════════════════════\n');

    console.log('🎉 User reset completed successfully!');
    console.log('\n💡 You can now login at: http://localhost:3000/login');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}\n`);

    console.log('📝 Note: If you get "Email not confirmed" error:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Find your user and click "Confirm email"\n');

  } catch (error) {
    console.error('❌ Error during user reset:', error);
    throw error;
  }
}

// Run the script
resetSupabaseUsers()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
