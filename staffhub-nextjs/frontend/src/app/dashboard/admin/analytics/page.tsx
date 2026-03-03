"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userApi, outpassApi, meetingApi, staffApi, feedbackApi } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const usersQuery = useQuery({
    queryKey: ["admin-analytics-users"],
    queryFn: () => userApi.getAll(),
  });

  const outpassQuery = useQuery({
    queryKey: ["admin-analytics-outpass"],
    queryFn: () => outpassApi.getAll({}),
  });

  const meetingsQuery = useQuery({
    queryKey: ["admin-analytics-meetings"],
    queryFn: () => meetingApi.getAll(),
  });

  const staffQuery = useQuery({
    queryKey: ["admin-analytics-staff"],
    queryFn: () => staffApi.getAll(),
  });

  const feedbackQuery = useQuery({
    queryKey: ["admin-analytics-feedback"],
    queryFn: () => feedbackApi.getAll(),
  });

  const users = usersQuery.data?.data?.data || usersQuery.data?.data || [];
  const outpasses = outpassQuery.data?.data?.data || outpassQuery.data?.data || [];
  const meetings = meetingsQuery.data?.data || [];
  const staff = staffQuery.data?.data || [];
  const feedbacks = feedbackQuery.data?.data || [];

  const stats = {
    totalUsers: users.length,
    totalStudents: users.filter((u: {role?: string}) => u.role === "STUDENT").length,
    totalStaff: staff.length,
    totalOutpasses: outpasses.length,
    pendingOutpasses: outpasses.filter((o: {status?: string}) => o.status === "PENDING").length,
    approvedOutpasses: outpasses.filter((o: {status?: string}) => o.status === "APPROVED").length,
    totalMeetings: meetings.length,
    pendingMeetings: meetings.filter((m: {status?: string}) => m.status === "PENDING").length,
    approvedMeetings: meetings.filter((m: {status?: string}) => m.status === "APPROVED").length,
    completedMeetings: meetings.filter((m: {status?: string}) => m.status === "COMPLETED").length,
    totalFeedback: feedbacks.length,
    avgFeedbackRating:
      feedbacks.length > 0
        ? (feedbacks.reduce((sum: number, f: {rating?: number}) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
        : "0.0",
  };

  const isLoading =
    usersQuery.isLoading ||
    outpassQuery.isLoading ||
    meetingsQuery.isLoading ||
    staffQuery.isLoading ||
    feedbackQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Key performance indicators and system metrics.</p>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground p-8">Loading analytics data...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalStaff}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Feedback Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgFeedbackRating} ⭐</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Outpass Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Outpasses</span>
                    <span className="text-2xl font-bold">{stats.totalOutpasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-xl font-semibold text-yellow-600">{stats.pendingOutpasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="text-xl font-semibold text-green-600">{stats.approvedOutpasses}</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: stats.totalOutpasses
                          ? `${(stats.approvedOutpasses / stats.totalOutpasses) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {stats.totalOutpasses
                      ? `${((stats.approvedOutpasses / stats.totalOutpasses) * 100).toFixed(0)}% approval rate`
                      : "No data"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meeting Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Meetings</span>
                    <span className="text-2xl font-bold">{stats.totalMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-xl font-semibold text-yellow-600">{stats.pendingMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="text-xl font-semibold text-green-600">{stats.approvedMeetings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-xl font-semibold text-blue-600">{stats.completedMeetings}</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: stats.totalMeetings
                          ? `${(stats.completedMeetings / stats.totalMeetings) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {stats.totalMeetings
                      ? `${((stats.completedMeetings / stats.totalMeetings) * 100).toFixed(0)}% completion rate`
                      : "No data"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feedback Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Total Feedback</p>
                  <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Average Rating</p>
                  <p className="text-2xl font-bold">{stats.avgFeedbackRating} / 5.0</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Satisfaction</p>
                  <p className="text-2xl font-bold">
                    {stats.totalFeedback > 0
                      ? `${((parseFloat(stats.avgFeedbackRating) / 5) * 100).toFixed(0)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
