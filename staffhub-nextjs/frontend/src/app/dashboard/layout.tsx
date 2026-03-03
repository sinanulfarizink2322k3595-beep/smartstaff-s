"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, removeToken, type User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Shield, 
  Settings, 
  LogOut,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setMounted(true);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted) return null;
  
  if (!user) return null;

  const navigation = {
    ADMIN: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Users", href: "/dashboard/admin/users", icon: Users },
      { name: "Outpasses", href: "/dashboard/admin/outpasses", icon: FileText },
      { name: "Meetings", href: "/dashboard/admin/meetings", icon: Calendar },
      { name: "Staff", href: "/dashboard/admin/staff", icon: Users },
      { name: "Feedback", href: "/dashboard/admin/feedback", icon: MessageSquare },
      { name: "AI Org Builder", href: "/dashboard/admin/orgbuilder", icon: BarChart3 },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
    STAFF: [
      { name: "Dashboard", href: "/dashboard/staff", icon: LayoutDashboard },
      { name: "Outpass Requests", href: "/dashboard/staff/outpasses", icon: FileText },
      { name: "Meetings", href: "/dashboard/staff/meetings", icon: Calendar },
      { name: "Availability", href: "/dashboard/staff/availability", icon: Calendar },
      { name: "Settings", href: "/dashboard/staff/settings", icon: Settings },
    ],
    STUDENT: [
      { name: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
      { name: "My Outpasses", href: "/dashboard/student/outpasses", icon: FileText },
      { name: "Book Meeting", href: "/dashboard/student/meetings", icon: Calendar },
      { name: "Staff Availability", href: "/dashboard/student/staff", icon: Users },
      { name: "Feedback", href: "/dashboard/student/feedback", icon: MessageSquare },
    ],
    SECURITY: [
      { name: "Dashboard", href: "/dashboard/security", icon: Shield },
      { name: "Verify Outpass", href: "/dashboard/security/verify", icon: FileText },
      { name: "Emergency Requests", href: "/dashboard/security/emergency", icon: Shield },
      { name: "Gate Logs", href: "/dashboard/security/logs", icon: BarChart3 },
    ],
  };

  const links = navigation[user.role as keyof typeof navigation] || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r flex flex-col">
          <div className="p-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg">StaffHub</div>
                <div className="text-xs text-muted-foreground">{user.role}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="mb-4 p-3 rounded-lg bg-muted">
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
