"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { getUser } from "@/lib/auth";

export default function StaffDashboard() {
  const user = getUser();

  // Real data - will be empty until backend is running
  const outpasses: any[] = [];
  const meetings: any[] = [];
  
  // Check if staff has set availability
  const isAvailabilitySet = typeof window !== 'undefined' ? !!localStorage.getItem('staffAvailability') : false;

  const pendingOutpasses = outpasses.filter((o: any) => o.status === "PENDING");
  const pendingMeetings = meetings.filter((m: any) => m.status === "PENDING");
  const approvedOutpasses = outpasses.filter((o: any) => o.status === "APPROVED");

  const stats = [
    {
      title: "Pending Outpasses",
      value: pendingOutpasses.length,
      icon: FileText,
      color: "text-orange-500",
    },
    {
      title: "Pending Meetings",
      value: pendingMeetings.length,
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      title: "Approved Today",
      value: approvedOutpasses.length,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Availability Status",
      value: isAvailabilitySet ? "Set" : "Not Set",
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}
        </p>
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
            <CardTitle>Pending Outpass Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOutpasses.slice(0, 5).map((outpass: any) => (
                <div key={outpass.id} className="p-3 rounded-lg border">
                  <div className="font-medium">{outpass.reason}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(outpass.fromDate).toLocaleDateString()} - {new Date(outpass.toDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Requested by: {outpass.studentId}
                  </div>
                </div>
              ))}
              {pendingOutpasses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No pending outpass requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Meeting Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMeetings.slice(0, 5).map((meeting: any) => (
                <div key={meeting.id} className="p-3 rounded-lg border">
                  <div className="font-medium">{meeting.purpose}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(meeting.requestedDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Slot: {meeting.requestedSlot}
                  </div>
                </div>
              ))}
              {pendingMeetings.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No pending meeting requests</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
