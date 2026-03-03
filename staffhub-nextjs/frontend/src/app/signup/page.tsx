"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, User, Shield as ShieldIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api";
import { mockAuthApi } from "@/lib/mock-auth";
import { setToken, setUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type UserRole = "STUDENT" | "STAFF" | "SECURITY";

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [formData, setFormData] = useState({
        organizationCode: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        department: "",
        rollNumber: "",
        phone: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRole) {
            toast({
                title: "Select a role",
                description: "Please select your role (Student, Staff, or Security)",
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

        if (selectedRole === "STUDENT" && !formData.rollNumber) {
            toast({
                title: "Roll number required",
                description: "Please enter your roll number",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            let response;
            try {
                // Try backend API first
                response = await authApi.signup({
                    organizationCode: formData.organizationCode.trim().toLowerCase(),
                    fullName: formData.fullName,
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    role: selectedRole,
                    department: formData.department || undefined,
                    rollNumber: formData.rollNumber || undefined,
                    phone: formData.phone || undefined,
                });
            } catch (apiError) {
                // Fallback to mock auth for testing
                console.log("Backend API unavailable, using mock authentication");
                const mockResponse = await mockAuthApi.signup({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    fullName: formData.fullName,
                    role: selectedRole,
                });
                response = { data: mockResponse };
            }

            const { token, user, organization } = response.data;

            const normalizedUser = {
                ...user,
                name: user?.name || user?.fullName || "User",
                organizationId: organization?.id || user?.organizationId,
                organizationCode: organization?.slug || formData.organizationCode,
            };

            setToken(token);
            setUser(normalizedUser);

            toast({
                title: "Welcome to StaffHub!",
                description: `Account created successfully as ${selectedRole.toLowerCase()}`,
            });

            // Redirect based on role
            const dashboardPaths = {
                STUDENT: "/dashboard/student",
                STAFF: "/dashboard/staff",
                SECURITY: "/dashboard/security/verify",
            };

            router.push(dashboardPaths[selectedRole]);
        } catch (error: any) {
            toast({
                title: "Signup failed",
                description: error.response?.data?.error || error.response?.data?.message || "Failed to create account",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-4">
                    <Link href="/" className="flex items-center gap-2 justify-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-2xl">StaffHub</span>
                    </Link>
                    <div>
                        <CardTitle className="text-center">Join Your Organization</CardTitle>
                        <CardDescription className="text-center">
                            Sign up with your organization code
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Role Selection */}
                        <div className="space-y-3">
                            <Label>Select Your Role</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole("STUDENT")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedRole === "STUDENT"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                    disabled={loading}
                                >
                                    <GraduationCap className="w-8 h-8" />
                                    <span className="font-medium">Student</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole("STAFF")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedRole === "STAFF"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                    disabled={loading}
                                >
                                    <Users className="w-8 h-8" />
                                    <span className="font-medium">Staff</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRole("SECURITY")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedRole === "SECURITY"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                    disabled={loading}
                                >
                                    <ShieldIcon className="w-8 h-8" />
                                    <span className="font-medium">Security</span>
                                </button>
                            </div>
                        </div>

                        {/* Organization Code */}
                        <div className="space-y-2">
                            <Label htmlFor="organizationCode">Organization Code</Label>
                            <Input
                                id="organizationCode"
                                type="text"
                                placeholder="e.g., nilgiri-college"
                                value={formData.organizationCode}
                                onChange={(e) => setFormData({ ...formData, organizationCode: e.target.value })}
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the code provided by your institution
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
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
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Conditional fields based on role */}
                        {selectedRole === "STUDENT" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rollNumber">Roll Number</Label>
                                    <Input
                                        id="rollNumber"
                                        type="text"
                                        placeholder="2024001"
                                        value={formData.rollNumber}
                                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        type="text"
                                        placeholder="Computer Science"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedRole === "STAFF" && (
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    type="text"
                                    placeholder="Computer Science"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1234567890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading || !selectedRole}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            Admin only: Need to create an organization?{" "}
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                Register here
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
