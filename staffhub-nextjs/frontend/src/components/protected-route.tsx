"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, type User } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User["role"][];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const dashboardMap = {
        ADMIN: "/dashboard/admin",
        STAFF: "/dashboard/staff",
        STUDENT: "/dashboard/student",
        SECURITY: "/dashboard/security",
      };
      router.push(dashboardMap[user.role]);
    }
  }, [router, allowedRoles]);

  return <>{children}</>;
}
