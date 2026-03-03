const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "farizisinanul@gmail.com";

if (!supabaseUrl || !anonKey) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const publicClient = createClient(supabaseUrl, anonKey);
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function keepAdminOnly() {
  console.log("🚀 Cleaning users: keep admin only\n");
  console.log(`👑 Admin email to keep: ${ADMIN_EMAIL}\n`);

  const { data: profiles, error: profilesErr } = await publicClient
    .from("profiles")
    .select("id, user_id, email, role");

  if (profilesErr) {
    console.error("❌ Failed to read profiles:", profilesErr.message);
    process.exit(1);
  }

  const profileList = profiles || [];
  const protectedProfile =
    profileList.find((p) => (p.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    profileList.find((p) => p.role === "admin") ||
    null;

  const profilesToDelete = protectedProfile
    ? profileList.filter((p) => p.id !== protectedProfile.id)
    : profileList;

  if (profilesToDelete.length > 0) {
    const ids = profilesToDelete.map((p) => p.id);
    const { error: deleteProfilesErr } = await publicClient
      .from("profiles")
      .delete()
      .in("id", ids);

    if (deleteProfilesErr) {
      console.error("❌ Failed deleting profiles:", deleteProfilesErr.message);
      process.exit(1);
    }
  }

  console.log(`✅ Deleted ${profilesToDelete.length} non-admin profile(s)`);

  if (!adminClient) {
    console.log("\n⚠️ No VITE_SUPABASE_SERVICE_ROLE_KEY found in .env");
    console.log("   Auth users cannot be deleted with anon key.");
    console.log("   This means some emails may still show 'already exists' on signup.");
    console.log("\n👉 Add service key and run again to fully remove auth users:");
    console.log("   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
    return;
  }

  const { data: usersPage, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error("❌ Failed to list auth users:", listErr.message);
    process.exit(1);
  }

  const authUsers = usersPage?.users || [];
  let deletedAuthCount = 0;

  for (const user of authUsers) {
    const email = (user.email || "").toLowerCase();
    if (email && email !== ADMIN_EMAIL.toLowerCase()) {
      const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteUserErr) {
        console.warn(`⚠️ Could not delete auth user ${user.email}: ${deleteUserErr.message}`);
      } else {
        deletedAuthCount += 1;
      }
    }
  }

  console.log(`✅ Deleted ${deletedAuthCount} non-admin auth user(s)`);

  const { data: refreshedProfiles } = await publicClient
    .from("profiles")
    .select("email, role");

  console.log("\n📌 Remaining profiles:");
  for (const profile of refreshedProfiles || []) {
    console.log(`   - ${profile.email} (${profile.role})`);
  }

  console.log("\n🎉 Cleanup complete. Only admin should remain.");
}

keepAdminOnly().catch((error) => {
  console.error("❌ Cleanup failed:", error);
  process.exit(1);
});
