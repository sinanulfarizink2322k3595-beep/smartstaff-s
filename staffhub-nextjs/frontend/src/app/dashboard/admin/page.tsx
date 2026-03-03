"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { Users, FileText, Calendar, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const currentUser = getUser();

  // Real data - will be empty until backend is running
  const usersList: any[] = [];
  const outpassList: any[] = [];
  const meetingList: any[] = [];
  const staffList: any[] = [];


  const stats = [
    {
      title: "Total Users",
      value: usersList.length,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Outpasses",
      value: outpassList.filter((o: any) => o.status === "APPROVED").length,
      icon: FileText,
      color: "text-green-500",
    },
    {
      title: "Pending Meetings",
      value: meetingList.filter((m: any) => m.status === "PENDING").length,
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      title: "Staff Members",
      value: staffList.length,
      icon: CheckCircle,
      color: "text-purple-500",
    },
  ];

  // Count by role
  const studentCount = usersList.filter((u: any) => u.role === "STUDENT").length;
  const securityCount = usersList.filter((u: any) => u.role === "SECURITY").length;
  const adminCount = usersList.filter((u: any) => u.role === "ADMIN").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser?.name || "Admin"}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.title === "Total Users" && `${studentCount} students, ${staffList.length} staff, ${securityCount} security, ${adminCount} admin`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Breakdown by Role */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{studentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{staffList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{securityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Outpass Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outpassList.slice(0, 5).map((outpass: any) => (
                <div key={outpass.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{outpass.reason}</div>
                    <div className="text-sm text-muted-foreground">
                      {outpass.studentName}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    outpass.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    outpass.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {outpass.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetingList.slice(0, 5).map((meeting: any) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{meeting.topic}</div>
                    <div className="text-sm text-muted-foreground">
                      {meeting.studentName}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === "SCHEDULED" ? "bg-green-100 text-green-700" :
                    meeting.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {meeting.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersList.slice(0, 10).map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                    user.role === "STAFF" ? "bg-blue-100 text-blue-700" :
                    user.role === "STUDENT" ? "bg-green-100 text-green-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {user.role}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-gray-400"}`}></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
