import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/providers/theme-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryConfig } from "@/lib/query-config";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import FAQ from "./pages/FAQ";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentOutpass from "./pages/student/StudentOutpass";
import StudentMeetings from "./pages/student/StudentMeetings";
import StudentAvailability from "./pages/student/StudentAvailability";
import StudentProfile from "./pages/student/StudentProfile";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentRequestHistory from "./pages/student/StudentRequestHistory";
import StudentFeedback from "./pages/student/StudentFeedback";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOutpass from "./pages/staff/StaffOutpass";
import StaffMeetings from "./pages/staff/StaffMeetings";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffAvailabilityManage from "./pages/staff/StaffAvailabilityManage";

// Security pages
import SecurityDashboard from "./pages/security/SecurityDashboard";
import SecurityGateVerification from "./pages/security/SecurityGateVerification";
import SecurityExitLogs from "./pages/security/SecurityExitLogs";
import SecurityAlerts from "./pages/security/SecurityAlerts";
import SecurityDailyLogs from "./pages/security/SecurityDailyLogs";
import SecuritySearch from "./pages/security/SecuritySearch";
import SecurityReports from "./pages/security/SecurityReports";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminStaffManagement from "./pages/admin/AdminStaffManagement";
import AdminAvailabilityDashboard from "./pages/admin/AdminAvailabilityDashboard";
import AdminOutpassManagement from "./pages/admin/AdminOutpassManagement";
import AdminAttendanceLogs from "./pages/admin/AdminAttendanceLogs";
import AdminMeetingSchedule from "./pages/admin/AdminMeetingSchedule";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminDepartmentManagement from "./pages/admin/AdminDepartmentManagement";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminSecurityManagement from "./pages/admin/AdminSecurityManagement";

const queryClient = new QueryClient({ defaultOptions: queryConfig });

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/feedback" element={<Feedback />} />

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/outpass"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentOutpass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/meetings"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/availability"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentRequestHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/feedback"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentFeedback />
                </ProtectedRoute>
              }
            />

            {/* Staff routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/outpass"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffOutpass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/meetings"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffMeetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/attendance"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/availability"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffAvailabilityManage />
                </ProtectedRoute>
              }
            />

            {/* Security routes */}
            <Route
              path="/security"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/verify"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityGateVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/logs"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityExitLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/alerts"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/daily"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityDailyLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/search"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecuritySearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/reports"
              element={
                <ProtectedRoute allowedRoles={["security"]}>
                  <SecurityReports />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/outpass"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOutpassManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminMeetingSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminStaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/availability"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAvailabilityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAttendanceLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminFeedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faq"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminFAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSecurityManagement />
                </ProtectedRoute>
              }
            />

            {/* Change password (all roles) */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
