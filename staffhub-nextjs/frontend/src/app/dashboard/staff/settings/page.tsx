'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Check, X, User, Lock, Bell } from 'lucide-react';

interface StaffProfile {
  name: string;
  email: string;
  department: string;
  phone: string;
  designation: string;
  bio: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  meetingReminders: boolean;
  outpassAlerts: boolean;
  emergencyAlerts: boolean;
  weeklyReports: boolean;
}

const mockProfile: StaffProfile = {
  name: 'Dr. Rajesh Kumar',
  email: 'rajesh.kumar@college.edu',
  department: 'Computer Science',
  phone: '+91-98765-43210',
  designation: 'Assistant Professor',
  bio: 'Dedicated educator with 8 years of experience in computer science.',
};

const mockNotifications: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: true,
  meetingReminders: true,
  outpassAlerts: true,
  emergencyAlerts: true,
  weeklyReports: false,
};

export default function StaffSettingsPage() {
  const [profile, setProfile] = useState(mockProfile);
  const [editProfile, setEditProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(mockProfile);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleEditProfile = () => {
    setTempProfile(profile);
    setEditOpen(true);
  };

  const saveProfile = () => {
    if (!tempProfile.name || !tempProfile.email || !tempProfile.phone) {
      alert('Please fill in all required fields');
      return;
    }
    setProfile(tempProfile);
    setEditOpen(false);
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordChangeOpen(false), 2000);
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleEditProfile}>
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name *</label>
                    <Input
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email *</label>
                    <Input
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone *</label>
                    <Input
                      value={tempProfile.phone}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Department</label>
                    <Input
                      value={tempProfile.department}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Designation</label>
                    <Input
                      value={tempProfile.designation}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bio</label>
                    <Textarea
                      value={tempProfile.bio}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={saveProfile}>Save Changes</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Name</label>
              <p className="text-lg font-medium mt-1">{profile.name}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Email</label>
              <p className="text-lg font-medium mt-1">{profile.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Phone</label>
              <p className="text-lg font-medium mt-1">{profile.phone}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Department</label>
              <p className="text-lg font-medium mt-1">{profile.department}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Designation</label>
              <p className="text-lg font-medium mt-1">{profile.designation}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase">Status</label>
              <p className="mt-1">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-700">Active</span>
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <label className="text-xs text-muted-foreground font-semibold uppercase">Bio</label>
            <p className="mt-2">{profile.bio}</p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <Dialog open={passwordChangeOpen} onOpenChange={setPasswordChangeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2 text-green-700 text-sm">
                      <Check className="w-4 h-4" />
                      Password changed successfully!
                    </div>
                  )}
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2 text-red-700 text-sm">
                      <X className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Current Password</label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Confirm Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setPasswordChangeOpen(false)}>Cancel</Button>
                    <Button onClick={handlePasswordChange}>Update Password</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Password Last Changed</span>
              <span className="text-muted-foreground">2 months ago</span>
            </div>
            <p className="text-xs text-muted-foreground">Keep your password strong and unique to protect your account.</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">Receive important updates via email</p>
              </div>
              <button
                onClick={() => toggleNotification('emailNotifications')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">Receive alerts via SMS</p>
              </div>
              <button
                onClick={() => toggleNotification('smsNotifications')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.smsNotifications ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.smsNotifications ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">Meeting Reminders</p>
                <p className="text-xs text-muted-foreground mt-1">Get reminded about upcoming meetings</p>
              </div>
              <button
                onClick={() => toggleNotification('meetingReminders')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.meetingReminders ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.meetingReminders ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">Outpass Alerts</p>
                <p className="text-xs text-muted-foreground mt-1">Notifications for new outpass requests</p>
              </div>
              <button
                onClick={() => toggleNotification('outpassAlerts')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.outpassAlerts ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.outpassAlerts ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">Emergency Alerts</p>
                <p className="text-xs text-muted-foreground mt-1">Critical emergency notifications</p>
              </div>
              <button
                onClick={() => toggleNotification('emergencyAlerts')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.emergencyAlerts ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.emergencyAlerts ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-xs text-muted-foreground mt-1">Receive weekly summary reports</p>
              </div>
              <button
                onClick={() => toggleNotification('weeklyReports')}
                className={`w-11 h-6 rounded-full transition-colors ${notifications.weeklyReports ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${notifications.weeklyReports ? 'translate-x-5' : 'translate-x-0'} ml-0.5`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Privacy Notice</p>
              <p className="text-sm text-blue-800 mt-1">Your personal information is secure and encrypted. We never share your data with third parties. Changes to notification settings take effect immediately.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
