import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();
  const [email, setEmail] = useState("farizisinanul@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (profile) {
    if (profile.role === "admin") {
      navigate("/admin");
      return null;
    } else {
      toast.error("This panel is for administrators only");
      navigate("/");
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Admin Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Access control and system management</p>
          </div>

          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Administrator Sign In</CardTitle>
              <CardDescription>Enter your admin credentials to access the control panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={async () => {
                      if (!email) {
                        toast.error("Please enter your email first");
                        return;
                      }
                      try {
                        const { error } = await (
                          await import("@/integrations/supabase/client")
                        ).supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast.success("Password reset link sent to your email!");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to send reset link");
                      }
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Default Credentials:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Email: farizisinanul@gmail.com</p>
                  <p>Password: sfnk123#</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to User Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Not an administrator?</p>
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline text-sm font-medium flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Go to User Login
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;
