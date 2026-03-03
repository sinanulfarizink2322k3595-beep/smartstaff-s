"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { getUser, setToken, setUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Helper function to generate slug from organization name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Password strength checker
const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  if (password.length === 0) return { strength: 0, label: '', color: '' };

  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const levels = [
    { strength: 1, label: 'Weak', color: 'bg-red-500' },
    { strength: 2, label: 'Fair', color: 'bg-orange-500' },
    { strength: 3, label: 'Good', color: 'bg-yellow-500' },
    { strength: 4, label: 'Strong', color: 'bg-green-500' },
    { strength: 5, label: 'Very Strong', color: 'bg-green-600' },
  ];

  return levels.find(l => l.strength === strength) || levels[0];
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationSlug: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Auto-generate slug from organization name
  useEffect(() => {
    if (autoSlug && formData.organizationName) {
      setFormData(prev => ({
        ...prev,
        organizationSlug: generateSlug(formData.organizationName)
      }));
    }
  }, [formData.organizationName, autoSlug]);

  // Block non-admin logged-in users from accessing this page
  useEffect(() => {
    const user = getUser();

    if (!user) {
      setCanRender(true);
      return;
    }

    if (user.role !== "ADMIN") {
      const dashboardMap = {
        STAFF: "/dashboard/staff",
        STUDENT: "/dashboard/student",
        SECURITY: "/dashboard/security",
      };

      router.replace(dashboardMap[user.role as keyof typeof dashboardMap] || "/dashboard/student");
      return;
    }

    setCanRender(true);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.organizationSlug.trim()) {
      toast({
        title: "Organization code required",
        description: "Please provide a unique organization code",
        variant: "destructive",
      });
      return;
    }

    if (formData.organizationSlug.length < 3) {
      toast({
        title: "Code too short",
        description: "Organization code must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        organizationName: formData.organizationName,
        organizationSlug: formData.organizationSlug,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      const { token, user, organization } = response.data;

      const normalizedUser = {
        ...user,
        name: user?.name || user?.fullName || "Admin",
        organizationId: organization?.id || user?.organizationId,
        organizationCode: organization?.slug || formData.organizationSlug,
      };

      setToken(token);
      setUser(normalizedUser);

      toast({
        title: "Welcome to StaffHub!",
        description: `Organization "${formData.organizationName}" created successfully. Your organization code is: ${formData.organizationSlug}`,
      });

      router.push("/dashboard/admin");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.error || error.response?.data?.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (!canRender) {
    return null;
  }

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
            <CardTitle className="text-center">Create Organization (Admin)</CardTitle>
            <CardDescription className="text-center">
              Register your institution to get started. For users, please use the signup page.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Organization Details */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold text-sm text-muted-foreground">Organization Details</h3>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="e.g., Nilgiri College of Engineering"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="organizationSlug">Organization Code (Slug) *</Label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-xs text-primary hover:underline"
                    disabled={loading}
                  >
                    {autoSlug ? "Edit manually" : "Auto-generate"}
                  </button>
                </div>
                <Input
                  id="organizationSlug"
                  type="text"
                  placeholder="e.g., nilgiri-college"
                  value={formData.organizationSlug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setFormData({ ...formData, organizationSlug: e.target.value.toLowerCase() });
                  }}
                  required
                  disabled={loading || autoSlug}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used by students/staff to join: <span className="font-mono font-semibold">{formData.organizationSlug || "your-code"}</span>
                </p>
              </div>
            </div>

            {/* Admin Account Details */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold text-sm text-muted-foreground">Admin Account</h3>

              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nilgiri.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{passwordStrength.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
                {formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-red-600">Passwords don't match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating organization..." : "Create Organization"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Are you a student, staff, or security?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up here
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
