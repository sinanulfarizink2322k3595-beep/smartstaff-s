"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { meetingApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type MeetingStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

interface Meeting {
  id: string;
  purpose: string;
  meetingType: string;
  requestedTime: string;
  status: MeetingStatus;
  staffRemarks?: string | null;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    rollNumber?: string | null;
  };
  staff?: {
    id: string;
    name: string;
    title?: string | null;
  };
}

const badgeClass: Record<MeetingStatus, string> = {
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function AdminMeetingsPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | MeetingStatus>("ALL");
  const [search, setSearch] = useState("");
  const [remarksById, setRemarksById] = useState<Record<string, string>>({});

  const meetingsQuery = useQuery({
    queryKey: ["admin-meetings", statusFilter],
    queryFn: async () => {
      const response = await meetingApi.getAll({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MeetingStatus }) => {
      return meetingApi.updateStatus(id, {
        status,
        rejectionReason: remarksById[id] || undefined,
      });
    },
    onSuccess: async () => {
      toast({ title: "Updated", description: "Meeting status updated successfully." });
      await meetingsQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.response?.data?.error || "Could not update meeting status",
        variant: "destructive",
      });
    },
  });

  const meetings: Meeting[] = useMemo(() => {
    const payload = meetingsQuery.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }, [meetingsQuery.data]);

  const filteredMeetings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter((meeting) => {
      const studentName = meeting.student?.fullName?.toLowerCase() || "";
      const staffName = meeting.staff?.name?.toLowerCase() || "";
      return (
        meeting.purpose.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        staffName.includes(q)
      );
    });
  }, [meetings, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Meetings</h1>
        <p className="text-muted-foreground">Monitor meeting requests and approvals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meetings.filter((m) => m.status === "PENDING").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meetings.filter((m) => m.status === "APPROVED").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{meetings.filter((m) => m.status === "COMPLETED").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meetings Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by student, staff or purpose"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | MeetingStatus)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <Button variant="outline" onClick={() => meetingsQuery.refetch()}>
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Staff</th>
                  <th className="text-left p-3">Purpose</th>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((meeting) => {
                  const isPending = meeting.status === "PENDING";
                  return (
                    <tr key={meeting.id} className="border-t align-top">
                      <td className="p-3">
                        <div className="font-medium">{meeting.student?.fullName || "-"}</div>
                        <div className="text-xs text-muted-foreground">{meeting.student?.rollNumber || "-"}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{meeting.staff?.name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{meeting.staff?.title || "-"}</div>
                      </td>
                      <td className="p-3">{meeting.purpose}</td>
                      <td className="p-3">{new Date(meeting.requestedTime).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass[meeting.status]}`}>
                          {meeting.status}
                        </span>
                      </td>
                      <td className="p-3 space-y-2 min-w-[240px]">
                        <Input
                          placeholder="Remarks (optional)"
                          value={remarksById[meeting.id] || ""}
                          onChange={(e) =>
                            setRemarksById((prev) => ({
                              ...prev,
                              [meeting.id]: e.target.value,
                            }))
                          }
                          disabled={!isPending}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: meeting.id, status: "APPROVED" })}
                            disabled={!isPending || updateStatusMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ id: meeting.id, status: "REJECTED" })}
                            disabled={!isPending || updateStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMeetings.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      {meetingsQuery.isLoading ? "Loading meetings..." : "No meeting requests found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
