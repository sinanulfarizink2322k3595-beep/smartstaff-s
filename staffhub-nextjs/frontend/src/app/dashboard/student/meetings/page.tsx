"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { meetingApi, staffApi } from "@/lib/api";
import { format } from "date-fns";

type MeetingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

interface Meeting {
  id: string;
  title: string;
  description: string;
  staffId: string;
  staffName?: string;
  meetingDate: string;
  duration: number;
  status: MeetingStatus;
  rejectionReason?: string;
  createdAt: string;
}

interface Staff {
  id: string;
  userId: string;
  user: {
    fullName: string;
    department: string;
  };
}

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", label: "Pending" },
  APPROVED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950", label: "Approved" },
  REJECTED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", label: "Rejected" },
  CANCELLED: { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950", label: "Cancelled" },
  COMPLETED: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950", label: "Completed" },
};

export default function StudentMeetingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    staffId: "",
    meetingDate: "",
    duration: "30",
  });

  // Fetch meetings
  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await meetingApi.getAll();
      return response.data.meetings || response.data || [];
    },
  });

  // Fetch staff list
  const { data: staffList } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await staffApi.getAll();
      return response.data.staff || response.data || [];
    },
  });

  // Create meeting mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => meetingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", staffId: "", meetingDate: "", duration: "30" });
      toast({
        title: "Success",
        description: "Meeting request submitted successfully",
      });
    },
    onError: (error: unknown) => {
      const apiError = error as {response?: {data?: {error?: string}}};
      toast({
        title: "Error",
        description: apiError.response?.data?.error || "Failed to create meeting",
        variant: "destructive",
      });
    },
  });

  // Delete meeting mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({
        title: "Success",
        description: "Meeting cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel meeting",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.staffId || !formData.meetingDate || !formData.duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleCancel = (meetingId: string) => {
    if (confirm("Are you sure you want to cancel this meeting?")) {
      deleteMutation.mutate(meetingId);
    }
  };

  // Filter meetings by status
  const filteredMeetings = meetings?.filter((meeting: Meeting) => 
    selectedStatus === "ALL" || meeting.status === selectedStatus
  ) || [];

  const statusCounts = {
    ALL: meetings?.length || 0,
    PENDING: meetings?.filter((m: Meeting) => m.status === "PENDING").length || 0,
    APPROVED: meetings?.filter((m: Meeting) => m.status === "APPROVED").length || 0,
    REJECTED: meetings?.filter((m: Meeting) => m.status === "REJECTED").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Book Meeting</h1>
          <p className="text-muted-foreground">Request and manage your meetings with staff.</p>
        </div>

        {/* Book Meeting Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Book Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book a Meeting</DialogTitle>
              <DialogDescription>
                Schedule a meeting with a staff member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Career Guidance, Project Discussion"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="staffId">Select Staff Member *</Label>
                <Select value={formData.staffId} onValueChange={(value) => setFormData({ ...formData, staffId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((staff: Staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.user.fullName} - {staff.user.department || "Staff"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the meeting purpose"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meetingDate">Date & Time *</Label>
                  <Input
                    id="meetingDate"
                    type="datetime-local"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Booking..." : "Book Meeting"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className="gap-2"
          >
            {status === "ALL" ? "All" : statusConfig[status as MeetingStatus]?.label}
            <span className="bg-background/20 px-2 py-0.5 rounded-full text-xs">
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Meetings List */}
      <div className="grid gap-4">
        {meetingsLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading meetings...</p>
            </CardContent>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {selectedStatus === "ALL" 
                  ? "No meetings yet. Click 'Book Meeting' to schedule one."
                  : `No ${selectedStatus.toLowerCase()} meetings.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting: Meeting) => {
            const config = statusConfig[meeting.status];
            const StatusIcon = config.icon;
            const canCancel = meeting.status === "PENDING" || meeting.status === "APPROVED";

            return (
              <Card key={meeting.id}>
                <CardHeader className={`${config.bg} border-b`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {meeting.staffName || "Staff Member"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(meeting.meetingDate), "MMM dd, yyyy 'at' hh:mm a")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {meeting.duration} minutes
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                      </div>
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(meeting.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {(meeting.description || meeting.rejectionReason) && (
                  <CardContent className="p-6 space-y-3">
                    {meeting.description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      </div>
                    )}
                    {meeting.rejectionReason && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{meeting.rejectionReason}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
