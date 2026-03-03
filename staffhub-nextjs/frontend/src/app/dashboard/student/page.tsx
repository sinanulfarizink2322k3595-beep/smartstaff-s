"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle, Clock, Plus } from "lucide-react";
import { getUser } from "@/lib/auth";
import { StaffAvailabilityChart } from "@/components/staff-availability-chart";

export default function StudentDashboard() {
  const user = getUser();

  // Real data - will be empty until backend is running
  const studentOutpasses: Array<{id: string; status: string; reason: string; fromDate: string; toDate: string}> = [];
  const studentMeetings: Array<{id: string; status: string; purpose: string; requestedDate: string}> = [];
  const staffMembers: Array<{id: string; name: string; department?: string; availability?: Array<{day: string; isAvailable: boolean; slots: Array<{startTime: string; endTime: string; duration: number}>}>}> = [];

  const pendingOutpasses = studentOutpasses.filter((o) => o.status === "PENDING");
  const approvedOutpasses = studentOutpasses.filter((o) => o.status === "APPROVED");
  const upcomingMeetings = studentMeetings.filter((m) => m.status === "SCHEDULED" || m.status === "PENDING");

  const stats = [
    {
      title: "Pending Outpasses",
      value: pendingOutpasses.length,
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: "Approved Outpasses",
      value: approvedOutpasses.length,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Total Requests",
      value: studentOutpasses.length,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Upcoming Meetings",
      value: upcomingMeetings.length,
      icon: Calendar,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/student/outpasses">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Outpass
            </Button>
          </Link>
          <Link href="/dashboard/student/meetings">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Book Meeting
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Recent Outpasses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentOutpasses.slice(0, 5).map((outpass) => (
                <div key={outpass.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{outpass.reason}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(outpass.fromDate).toLocaleDateString()} - {new Date(outpass.toDate).toLocaleDateString()}
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
              {studentOutpasses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No outpass requests yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentMeetings.slice(0, 5).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{meeting.purpose}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(meeting.requestedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    meeting.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {meeting.status}
                  </span>
                </div>
              ))}
              {studentMeetings.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No meeting requests yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Availability Summary */}
      <StaffAvailabilityChart 
        staffMembers={staffMembers} 
        isLoading={false}
      />
    </div>
  );
}
