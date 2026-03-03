/**
 * Quick Admin Setup - No Service Role Key Required
 * This script creates an admin user using the public Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickAdminSetup() {
    console.log('\n🚀 Quick Admin Setup\n');

    const email = 'farizisinanul@gmail.com';
    const password = 'sfnk123#';
    const fullName = 'Fariz Isinanul';

    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    try {
        // Step 1: Clear profiles table
        console.log('🗑️  Clearing existing profiles...');
        const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
            console.log('   ⚠️  Could not clear profiles:', deleteError.message);
        } else {
            console.log('   ✅ Profiles cleared\n');
        }

        // Step 2: Create new admin user
        console.log('👤 Creating admin user...');
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
            if (signUpError.message.includes('already registered') ||
                signUpError.message.includes('User already registered')) {
                console.log('   ℹ️  User already exists in auth system\n');

                // Try to sign in
                console.log('🔐 Signing in...');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (signInError) {
                    console.error('   ❌ Could not sign in:', signInError.message);
                    console.log('\n💡 Solutions:');
                    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
                    console.log('   2. Find and DELETE the user:', email);
                    console.log('   3. Run this script again\n');
                    process.exit(1);
                }

                const userId = signInData.user?.id;
                console.log('   ✅ Signed in successfully\n');

                // Create/update profile
                console.log('📝 Creating admin profile...');
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        user_id: userId,
                        email: email,
                        full_name: fullName,
                        role: 'admin',
                        department: 'Administration',
                    });

                if (profileError) {
                    console.error('   ❌ Profile error:', profileError.message);
                    throw profileError;
                }

                console.log('   ✅ Profile created\n');

                await supabase.auth.signOut();
            } else {
                throw signUpError;
            }
        } else {
            console.log('   ✅ User created in auth system');

            // Check if email confirmation is required
            if (!authData.user?.email_confirmed_at) {
                console.log('\n⚠️  EMAIL CONFIRMATION REQUIRED!');
                console.log('\n📧 Option 1: Check your email and click confirmation link\n');
                console.log('🔧 Option 2: Disable email confirmation:');
                console.log('   1. Go to: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_PROJECT_ID + '/auth/providers');
                console.log('   2. Click on Email provider');
                console.log('   3. Toggle OFF "Confirm email"');
                console.log('   4. Save and run this script again\n');
            } else {
                console.log('   ✅ Email confirmed\n');
            }

            // Create profile
            if (authData.user?.id) {
                console.log('📝 Creating admin profile...');
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
                    console.error('   ❌ Profile error:', profileError.message);
                } else {
                    console.log('   ✅ Profile created\n');
                }
            }
        }

        console.log('✨ Setup Complete!\n');
        console.log('🎯 Next Steps:');
        console.log('   1. Make sure email is confirmed (check above)');
        console.log('   2. Run: npm run dev');
        console.log('   3. Go to: http://localhost:5173/admin-login');
        console.log('   4. Login with:');
        console.log(`      Email: ${email}`);
        console.log(`      Password: ${password}\n`);
        console.log('📊 Admin Features:');
        console.log('   • Delete Students: Go to Users page');
        console.log('   • Delete Staff: Go to Staff Management page');
        console.log('   • Full user management with create, edit, delete\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 If you need help, check:');
        console.log('   • Supabase Dashboard → Authentication → Users');
        console.log('   • Make sure .env file has correct credentials\n');
        process.exit(1);
    }
}

quickAdminSetup();
