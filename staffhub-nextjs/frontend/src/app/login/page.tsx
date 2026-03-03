"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { mockAuthApi } from "@/lib/mock-auth";
import { setToken, setUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      try {
        // Try backend API first
        response = await authApi.login(formData);
      } catch (apiError) {
        // Fallback to mock auth for testing
        console.log("Backend API unavailable, using mock authentication");
        const mockResponse = await mockAuthApi.login(formData.email, formData.password);
        response = { data: mockResponse };
      }

      const { token, user, organization } = response.data;

      const normalizedUser = {
        ...user,
        name: user?.name || user?.fullName || "User",
        organizationId: organization?.id || user?.organizationId,
        organizationCode: organization?.slug,
      };

      setToken(token);
      setUser(normalizedUser);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${normalizedUser.name}`,
      });

      // Redirect based on role
      const dashboardMap = {
        ADMIN: "/dashboard/admin",
        STAFF: "/dashboard/staff",
        STUDENT: "/dashboard/student",
        SECURITY: "/dashboard/security",
      };

      router.push(dashboardMap[normalizedUser.role as keyof typeof dashboardMap] || "/dashboard/student");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || error.response?.data?.error || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">StaffHub</span>
          </Link>
          <div>
            <CardTitle className="text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Are you an admin and need a new organization?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create organization
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
