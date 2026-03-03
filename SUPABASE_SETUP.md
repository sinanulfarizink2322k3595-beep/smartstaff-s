# SUPABASE SETUP GUIDE

## Quick Start

### 1. Environment Variables

Create `.env.local` in `staffhub-nextjs/frontend/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ywuvuzplwkfqfkdhplkx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dXZ1enBsd2tmcWZrZGhwbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk4OTMxNzgsImV4cCI6MTk5NjQ2OTE3OH0.EXAMPLE_KEY
```

### 2. Database Setup

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy-paste content from: `supabase/migrations/001_init_schema.sql`
4. Execute the SQL

### 3. Create Test Users

In Supabase Auth tab, invite users with these emails:

- admin@example.com
- staff@example.com
- student@example.com
- security@example.com

### 4. Add User Records

Use real Auth user IDs from `auth.users` and insert both `id` and `auth_id` with that same UUID:

```sql
-- 1) Verify Auth users exist
SELECT id, email FROM auth.users
WHERE email IN ('admin@example.com', 'staff@example.com', 'student@example.com', 'security@example.com');

-- 2) Insert app-level user profiles mapped to Auth IDs
INSERT INTO users (id, auth_id, email, full_name, role, department, organization_code)
SELECT id, id, email,
  CASE
    WHEN email = 'admin@example.com' THEN 'Admin User'
    WHEN email = 'staff@example.com' THEN 'Staff Member'
    WHEN email = 'student@example.com' THEN 'Student User'
    WHEN email = 'security@example.com' THEN 'Security Staff'
  END AS full_name,
  CASE
    WHEN email = 'admin@example.com' THEN 'admin'
    WHEN email = 'staff@example.com' THEN 'staff'
    WHEN email = 'student@example.com' THEN 'student'
    WHEN email = 'security@example.com' THEN 'security'
  END AS role,
  CASE
    WHEN email = 'admin@example.com' THEN 'Administration'
    WHEN email = 'staff@example.com' THEN 'Computer Science'
    WHEN email = 'student@example.com' THEN 'Computer Science'
    WHEN email = 'security@example.com' THEN 'Security'
  END AS department,
  'ORG001' AS organization_code
FROM auth.users
WHERE email IN ('admin@example.com', 'staff@example.com', 'student@example.com', 'security@example.com')
ON CONFLICT (email) DO UPDATE
SET
  id = EXCLUDED.id,
  auth_id = EXCLUDED.auth_id,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  organization_code = EXCLUDED.organization_code,
  updated_at = CURRENT_TIMESTAMP;
```

### 5. Access Application

```
Frontend: http://localhost:3000
Login with any test email from above
```

---

## Database Tables Overview

### users

- Stores user profiles and roles
- Linked to Supabase Auth via auth_id
- Includes department, phone, avatar URL

### user_logins

- Tracks every login with timestamp and IP
- Useful for audit trails and security analysis
- Auto-updated when user logs in

### outpasses

- Student outpass requests
- Status: PENDING, APPROVED, REJECTED, COMPLETED
- Approval tracking and remarks

### meetings

- Meeting requests between students and staff
- Status: REQUESTED, SCHEDULED, COMPLETED, CANCELLED
- Room assignment and time scheduling

### staff_availability

- Weekly availability schedule (24.5 hours/week default)
- Day-based with start/end times
- Staff can self-manage

### feedback

- Student feedback with ratings (1-5 stars)
- Category tracking
- Optional staff reference

### security_logs

- Gate entry/exit logs
- Linked to outpass for verification
- Location and timestamp tracking

### notifications

- User notifications system
- Read/unread tracking
- Related entity linking (outpass, meeting, etc)

---

## Row Level Security Policies

### Users Table

- Users can read/update their own profile
- Admins can read all users

### Outpasses

- Students see their own
- Staff see all (for processing)
- Admins see all

### Meetings

- Students see their own
- Staff see their own
- Admins see all

### Staff Availability

- Staff see and edit their own

---

## Testing Checklist

- [ ] Create account → Check users table
- [ ] Login → Check user_logins table
- [ ] Request outpass → Check outpasses table
- [ ] Request meeting → Check meetings table
- [ ] Set availability → Check staff_availability table
- [ ] Submit feedback → Check feedback table
- [ ] Admin approve outpass → Check status update

---

## Troubleshooting

### Issue: "SUPABASE_URL not set"

**Solution:** Add NEXT_PUBLIC_SUPABASE_URL to .env.local

### Issue: "Connection refused"

**Solution:** Check Supabase project is active, not paused

### Issue: "RLS policy error"

**Solution:** Ensure auth.uid() is in JWT claims (automatic with Supabase Auth)

### Issue: Tables not found

**Solution:** Run the migrations SQL file (001_init_schema.sql)

### Issue: Login not working

**Solution:**

1. Ensure user exists in Auth tab
2. Ensure matching record in users table
3. Check browser console for detailed error

---

## Production Deployment

### Before Going Live:

1. ✅ All users created in Supabase Auth
2. ✅ User records inserted in database
3. ✅ RLS policies verified
4. ✅ Backups configured
5. ✅ SSL enabled (Supabase default)
6. ✅ CORS configured for your domain
7. ✅ Environment variables secured
8. ✅ Email verification configured
9. ✅ Password reset configured
10. ✅ 2FA optional enabled

---

## API Usage Examples

### Sign In

```typescript
import { loginWithSupabase } from "@/lib/auth";

const { user, error } = await loginWithSupabase(
  "email@example.com",
  "password",
);
if (user) {
  // User logged in and data synced to localStorage
}
```

### Get User Record

```typescript
import { getUserRecord } from "@/lib/supabase";

const { data: user } = await getUserRecord(userId);
```

### Update User

```typescript
import { updateUserRecord } from "@/lib/supabase";

await updateUserRecord(userId, { full_name: "New Name" });
```

### Query Data

```typescript
import { supabase } from "@/lib/supabase";

const { data: outpasses } = await supabase
  .from("outpasses")
  .select("*")
  .eq("student_id", studentId);
```

---

## Support

For issues, check:

1. Supabase Dashboard logs
2. Browser console for JS errors
3. Network tab for API responses
4. Email notifications from Supabase

---

**Status:** Ready for Production Use | Updated: March 3, 2026
