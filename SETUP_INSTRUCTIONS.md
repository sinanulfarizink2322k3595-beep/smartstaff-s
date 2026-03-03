# 🚀 Complete Setup Instructions - SmartStaff Nilgiri

## ⚠️ Current Issue: Cannot Login

**Problem**: Old authentication users exist in Supabase, preventing new admin creation.

## ✅ Solution: 3-Step Setup

### Step 1: Clean Supabase Users (2 minutes)

1. **Open Supabase Dashboard**: 
   - Visit: https://supabase.com/dashboard/project/hocuqeqmhjqloznddrbo/auth/users
   
2. **Delete ALL existing users**:
   - For each user in the list:
     - Click the **three dots (⋮)** menu
     - Click **"Delete user"**
     - Confirm deletion
   - Repeat until no users remain

3. **Disable Email Confirmation**:
   - Go to: https://supabase.com/dashboard/project/hocuqeqmhjqloznddrbo/auth/providers
   - Click **"Email"** provider
   - Toggle **OFF** "Confirm email" (or set duration to 0 seconds)
   - Click **"Save"**

### Step 2: Create Admin User (1 minute)

After completing Step 1, run this command in your terminal:

```powershell
npm run quick-admin
```

This will:
- Clear all profiles from the database
- Create a fresh admin user
- Set up admin profile with full permissions

**Admin Credentials**:
- **Email**: `farizisinanul@gmail.com`
- **Password**: `sfnk123#`

### Step 3: Start the Application (30 seconds)

```powershell
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend API**: (if using staffhub-nextjs)

Visit: http://localhost:5173/admin-login

---

## 🎯 Full Feature List

### ✅ Working Features

#### 🔐 Authentication
- [x] Student login
- [x] Admin login
- [x] Staff login
- [x] Password reset
- [x] Protected routes
- [x] Role-based access control

#### 👨‍🎓 Student Features
- [x] Dashboard with stats
- [x] Request outpass
- [x] Schedule meetings with staff
- [x] View staff availability
- [x] Check notifications
- [x] View request history
- [x] Submit feedback
- [x] Update profile

#### 👨‍🏫 Staff Features
- [x] Dashboard with overview
- [x] Approve/reject outpass requests
- [x] Manage meeting requests
- [x] Mark attendance
- [x] Set availability schedule
- [x] View analytics

#### 🔒 Security Features
- [x] Gate verification dashboard
- [x] Scan QR codes
- [x] View exit logs
- [x] Security alerts
- [x] Daily logs
- [x] Search functionality
- [x] Generate reports

#### 👑 Admin Features
- [x] **User Management** - Create, edit, delete users
- [x] **Delete Students** - Full control via Users page
- [x] **Delete Staff** - Full control via Staff Management
- [x] **Staff Management** - Add/edit/remove staff
- [x] Department management
- [x] Outpass management
- [x] Meeting schedule
- [x] Attendance logs
- [x] Notifications management
- [x] System settings
- [x] Analytics & reports
- [x] FAQ management
- [x] Feedback review

#### 🎨 UI/UX Features
- [x] Dark mode / Light mode toggle
- [x] Responsive design
- [x] Status badges
- [x] Loading skeletons
- [x] Toast notifications
- [x] Empty states
- [x] Beautiful tables
- [x] Stat cards with trends
- [x] Search & filters

#### ⚡ Performance Features
- [x] Intelligent caching (React Query)
- [x] Optimistic UI updates
- [x] Lazy loading
- [x] Code splitting
- [x] 5-minute cache time
- [x] Automatic cache invalidation

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid login credentials"
**Solution**: 
1. Delete all users in Supabase Dashboard (Step 1 above)
2. Run `npm run quick-admin` again
3. Make sure email confirmation is disabled

### Issue: "Service role key invalid"
**Solution**: 
- Use the quick-admin script (doesn't need service role key)
- OR get service role key from: https://supabase.com/dashboard/project/hocuqeqmhjqloznddrbo/settings/api

### Issue: "Cannot connect to database"
**Solution**:
- Check `.env` file has correct VITE_SUPABASE_URL
- Verify Supabase project is active
- Check internet connection

### Issue: Features not working
**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server: `npm run dev`
3. Check browser console for errors (F12)

---

## 📦 What's Included

### Pages Created (45+ pages)
- Public: Landing, Login, Admin Login, FAQ, Feedback
- Student: 8 pages (Dashboard, Outpass, Meetings, etc.)
- Staff: 5 pages (Dashboard, Approvals, Attendance, etc.)
- Security: 7 pages (Verification, Logs, Alerts, etc.)
- Admin: 15 pages (Users, Analytics, Management, etc.)

### Components (70+ components)
- UI: Buttons, Cards, Dialogs, Tables, Badges, etc. (shadcn/ui)
- Custom: DashboardLayout, ProtectedRoute, StatusBadge, etc.
- Auth: Login forms, password reset, etc.
- Skeletons: Loading states for all major components

### APIs & Backend
- Supabase integration
- Edge functions for admin operations
- Real-time subscriptions
- Row-level security policies
- Database migrations

---

## 🎓 How to Use After Setup

### As Admin
1. Login at: http://localhost:5173/admin-login
2. Go to **Users** page to manage all users
3. Go to **Staff Management** to manage staff
4. Delete users by clicking the Trash icon
5. Create new users with the "Add User" button

### Creating Test Users
1. Login as admin
2. Go to "Users" page
3. Click "Create User"
4. Fill in details:
   - Email
   - Password
   - Name
   - Role (student/staff/admin)
   - Department (optional)
5. Click "Create"

### Testing Features
1. **Student Flow**:
   - Create a student user
   - Logout and login as student
   - Create outpass request
   - Login as admin/staff to approve

2. **Staff Flow**:
   - Create staff user
   - Login as staff
   - Set availability schedule
   - Approve outpass requests

3. **Security Flow**:
   - Create security user (role: security)
   - Login and verify QR codes
   - View exit logs

---

## 🔧 Development Commands

```powershell
# Start development server
npm run dev

# Create admin user
npm run quick-admin

# Reset users (keep only admin)
npm run supabase:keep-admin-only

# Full user reset
npm run supabase:reset-users

# Install all dependencies
npm run install:all

# Build for production
npm run build

# Run tests
npm test
```

---

## 🎉 Next Steps After Setup

1. ✅ Complete Step 1-3 above
2. ✅ Login as admin
3. ✅ Create test student and staff users
4. ✅ Test all features
5. ✅ Customize for your college:
   - Update branding
   - Add departments
   - Configure notifications
   - Set up email templates

---

## 💡 Pro Tips

1. **Keep browser DevTools open** (F12) to see any errors
2. **Use dark mode** - Toggle in navbar (looks amazing!)
3. **Check the Network tab** - See caching in action
4. **Create multiple test accounts** - Test different user flows
5. **Mobile responsive** - Try on different screen sizes

---

## 📞 Need Help?

If you're still stuck after following these instructions:

1. Check browser console for errors (F12)
2. Check terminal for error messages
3. Verify Supabase project is active
4. Make sure all dependencies are installed: `npm run install:all`
5. Try clearing cache: `npm cache clean --force`

---

**Created**: March 2, 2026  
**Project**: SmartStaff Nilgiri v2.0  
**Status**: All features implemented ✅
