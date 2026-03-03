import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest, MeetingRequest } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
  MapPin,
  User,
  Search,
} from "lucide-react";

interface CombinedRequest {
  id: string;
  type: "outpass" | "meeting";
  title: string;
  description: string;
  staff_name?: string;
  destination?: string;
  reason?: string;
  meeting_type?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  date: string;
  time: string;
  created_at: string;
  requested_time?: string;
  departure_time?: string;
}

const StudentRequestHistory = () => {
  const { profile } = useAuth();
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "outpass" | "meeting">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<CombinedRequest | null>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!profile) return;

    try {
      const [outpassRes, meetingRes] = await Promise.all([
        supabase
          .from("outpass_requests")
          .select("*, staff_members(name)")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("meeting_requests")
          .select("*, staff_members(name)")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false }),
      ]);

      if (outpassRes.data)
        setOutpassRequests(outpassRes.data as OutpassRequest[]);
      if (meetingRes.data)
        setMeetingRequests(meetingRes.data as MeetingRequest[]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to load requests";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [profile, fetchRequests]);

  // Combine and transform requests
  const combinedRequests: CombinedRequest[] = useMemo(() => {
    const outpass = outpassRequests.map((req) => ({
      id: req.id,
      type: "outpass" as const,
      title: `Outpass Request - ${req.destination}`,
      description: req.reason || "No reason provided",
      destination: req.destination,
      reason: req.reason,
      staff_name: req.staff_members?.name || "Staff Member",
      status: req.status,
      date: new Date(req.departure_time).toLocaleDateString(),
      time: new Date(req.departure_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      created_at: req.created_at,
      departure_time: req.departure_time,
    }));

    const meeting = meetingRequests.map((req) => ({
      id: req.id,
      type: "meeting" as const,
      title: `Meeting Request - ${req.meeting_type}`,
      description: req.purpose || req.meeting_type || "No details",
      meeting_type: req.meeting_type,
      staff_name: req.staff_members?.name || "Staff Member",
      status: req.status,
      date: new Date(req.requested_time).toLocaleDateString(),
      time: new Date(req.requested_time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      created_at: req.created_at,
      requested_time: req.requested_time,
    }));

    return [...outpass, ...meeting].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [outpassRequests, meetingRequests]);

  // Apply filters and search
  const filteredRequests = useMemo(() => {
    return combinedRequests.filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.staff_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || req.type === filterType;

      const matchesStatus =
        filterStatus === "all" || req.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [combinedRequests, searchTerm, filterType, filterStatus]);

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;

    setCanceling(true);
    try {
      const table =
        selectedRequest.type === "outpass"
          ? "outpass_requests"
          : "meeting_requests";

      // Use "rejected" status to represent cancelled requests
      const { error } = await supabase
        .from(table)
        .update({ status: "rejected" })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Update local state
      if (selectedRequest.type === "outpass") {
        setOutpassRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id ? { ...r, status: "rejected" } : r
          )
        );
      } else {
        setMeetingRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id ? { ...r, status: "rejected" } : r
          )
        );
      }

      setCancelDialogOpen(false);
      setSelectedRequest(null);
      toast.success("Request cancelled successfully");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to cancel request";
      toast.error(errMsg);
    } finally {
      setCanceling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning border border-warning/20",
      approved: "bg-success/10 text-success border border-success/20",
      rejected: "bg-destructive/10 text-destructive border border-destructive/20",
      completed: "bg-primary/10 text-primary border border-primary/20",
      cancelled: "bg-muted/20 text-muted-foreground border border-muted/30",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const pending = filteredRequests.filter((r) => r.status === "pending").length;
  const approved = filteredRequests.filter((r) => r.status === "approved" || r.status === "completed").length;
  const rejected = filteredRequests.filter((r) => r.status === "rejected").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Request History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your outpass and meeting requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TOTAL
                  </p>
                  <p className="text-lg font-bold">
                    {filteredRequests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    PENDING
                  </p>
                  <p className="text-lg font-bold">{pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    APPROVED
                  </p>
                  <p className="text-lg font-bold">{approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    REJECTED
                  </p>
                  <p className="text-lg font-bold">{rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, reason, or staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={(val: string) => setFilterType((val as any))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="outpass">Outpass</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No requests found
                </p>
                <p className="text-sm text-muted-foreground">
                  Adjust your filters or create a new request
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card
                key={`${request.type}-${request.id}`}
                className="border-0 shadow-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-3 rounded-lg ${
                        request.type === "outpass"
                          ? "bg-blue-500/10"
                          : "bg-purple-500/10"
                      }`}>
                        {request.type === "outpass" ? (
                          <MapPin className={`w-5 h-5 ${
                            request.type === "outpass"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`} />
                        ) : (
                          <Calendar className="w-5 h-5 text-purple-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {request.title}
                          </h3>
                          {getStatusIcon(request.status)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {request.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{request.staff_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{request.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{request.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {(request.status === "pending" || request.status === "approved") && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                            setCancelDialogOpen(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this{" "}
              {selectedRequest?.type === "outpass" ? "outpass" : "meeting"}{" "}
              request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 px-4 bg-muted/40 rounded-lg">
            <p className="text-sm font-semibold mb-2">{selectedRequest?.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {selectedRequest?.description}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setCancelDialogOpen(false)}
              variant="outline"
            >
              Keep Request
            </Button>
            <Button
              onClick={handleCancelRequest}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling ? "Cancelling..." : "Cancel Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentRequestHistory;
