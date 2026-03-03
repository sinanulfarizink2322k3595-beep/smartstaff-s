import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileImageUploader } from "@/components/profile-image-uploader";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Save,
  Edit2,
  Lock,
} from "lucide-react";

const StudentProfile = () => {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    roll_number: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        department: profile.department || "",
        roll_number: profile.roll_number || "",
      });
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", profile?.id);

      if (error) throw error;

      window.location.reload();
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordDialogOpen(false);
      toast.success("Password changed successfully!");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to change password";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your profile information
            </p>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                className="gradient-primary text-primary-foreground gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
            <Button
              onClick={() => setPasswordDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-card overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
              {/* Photo Section */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center">
                <ProfileImageUploader
                  userId={profile?.id || ""}
                  onImageUploaded={(url) => {
                    // Optionally refresh profile data here
                  }}
                  disabled={editing}
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {profile?.roll_number}
                </p>
              </div>

              {/* Profile Info Section */}
              <div className="lg:col-span-3 space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Full Name
                        </Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Phone
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => setEditing(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="gradient-primary text-primary-foreground gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            FULL NAME
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {profile?.full_name || "N/A"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            EMAIL
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {profile?.email || "N/A"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            DEPARTMENT
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {profile?.department || "N/A"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            ROLL NUMBER
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {profile?.roll_number || "N/A"}
                        </p>
                      </div>
                    </div>

                    {profile?.phone && (
                      <div className="p-4 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-semibold">
                            PHONE
                          </p>
                        </div>
                        <p className="text-lg font-semibold">{profile.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  ACCOUNT TYPE
                </p>
                <p className="text-lg font-semibold capitalize">
                  {profile?.role || "Student"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  MEMBER SINCE
                </p>
                <p className="text-lg font-semibold">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Current Password
              </Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                New Password
              </Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Confirm New Password
              </Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setPasswordDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="gradient-primary text-primary-foreground"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentProfile;
