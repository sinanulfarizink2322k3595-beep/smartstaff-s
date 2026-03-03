"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, CheckCircle, AlertCircle, Phone, Mail, MapPin, Flame, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeEvent, useBroadcastUpdate } from "@/hooks/use-realtime";
import { format } from "date-fns";

type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type EscalationStatus = "REPORTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";

interface EmergencyRequest {
  id: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  location: string;
  priority: PriorityLevel;
  status: EscalationStatus;
  description: string;
  createdAt: string;
  responseTime?: string;
  assignedTo?: string;
  resolution?: string;
}

const priorityConfig = {
  CRITICAL: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", icon: Flame, label: "Critical", order: 0 },
  HIGH: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", icon: AlertTriangle, label: "High", order: 1 },
  MEDIUM: { color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", icon: AlertCircle, label: "Medium", order: 2 },
  LOW: { color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", icon: Clock, label: "Low", order: 3 },
};

const statusConfig = {
  REPORTED: { color: "text-gray-600", label: "Reported" },
  ACKNOWLEDGED: { color: "text-yellow-600", label: "Acknowledged" },
  IN_PROGRESS: { color: "text-blue-600", label: "In Progress" },
  RESOLVED: { color: "text-green-600", label: "Resolved" },
};

// Mock emergency data
const mockEmergencies: EmergencyRequest[] = [
  {
    id: "emg-001",
    studentName: "Rahul Kumar",
    studentPhone: "+91-9876543210",
    studentEmail: "rahul@test.com",
    location: "Campus Gate A",
    priority: "CRITICAL",
    status: "IN_PROGRESS",
    description: "Medical emergency - student collapsed near gate",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    assignedTo: "Security Guard - John",
    responseTime: "2 minutes",
  },
  {
    id: "emg-002",
    studentName: "Priya Singh",
    studentPhone: "+91-9123456789",
    studentEmail: "priya@test.com",
    location: "Hostel Block C",
    priority: "HIGH",
    status: "ACKNOWLEDGED",
    description: "Unauthorized access attempt reported",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    responseTime: "5 minutes",
  },
  {
    id: "emg-003",
    studentName: "Amit Patel",
    studentPhone: "+91-8765432109",
    studentEmail: "amit@test.com",
    location: "Parking Area",
    priority: "MEDIUM",
    status: "RESOLVED",
    description: "Vehicle issue - keys locked inside car",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    responseTime: "20 minutes",
    resolution: "Assisted with vehicle unlock, no damage",
  },
];

export default function SecurityEmergencyPage() {
  const [statusFilter, setStatusFilter] = useState<EscalationStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "ALL">("ALL");
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [syncNotif, setSyncNotif] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - in real app, fetch from API
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>(mockEmergencies);
  
  // Real-time synchronization
  const broadcastUpdate = useBroadcastUpdate('emergency:update');

  useRealtimeEvent('emergency:update', (data) => {
    if (Array.isArray(data)) {
      setEmergencies(data);
      setSyncNotif(true);
      setTimeout(() => setSyncNotif(false), 2000);
    }
  });

  // Handle status update
  const handleStatusUpdate = (requestId: string, newStatus: EscalationStatus, resolution?: string) => {
    const updated = emergencies.map((req) =>
      req.id === requestId
        ? {
            ...req,
            status: newStatus,
            responseTime:
              newStatus === "ACKNOWLEDGED"
                ? Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 1000 / 60) + " minutes"
                : req.responseTime,
            resolution: resolution || req.resolution,
            assignedTo: assignedTo || req.assignedTo,
          }
        : req
    );
    
    setEmergencies(updated);
    
    // Broadcast the update
    broadcastUpdate(updated);

    toast({
      title: "Success",
      description: `Request status updated to ${newStatus}`,
    });

    setIsDetailsOpen(false);
    setResponse("");
    setAssignedTo("");
  };

  // Filter emergencies
  const filteredEmergencies = emergencies
    .filter((req) => statusFilter === "ALL" || req.status === statusFilter)
    .filter((req) => priorityFilter === "ALL" || req.priority === priorityFilter)
    .sort((a, b) => priorityConfig[a.priority].order - priorityConfig[b.priority].order);

  // Get status badge
  const getStatusBadge = (status: EscalationStatus) => {
    const config = statusConfig[status];
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${config.color} bg-opacity-20`}>
        {config.label}
      </span>
    );
  };

  const criticalCount = emergencies.filter((r) => r.priority === "CRITICAL" && r.status !== "RESOLVED").length;
  const highCount = emergencies.filter((r) => r.priority === "HIGH" && r.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Emergency Requests</h1>
        <p className="text-muted-foreground">Handle urgent requests with priority escalation and response tracking.</p>
      </div>

      {/* Alert Summary */}
      {criticalCount > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <Flame className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">Critical Alert</p>
            <p className="text-sm text-red-800 dark:text-red-200">{criticalCount} critical emergencies require immediate attention</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Filter by Priority</Label>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityLevel | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Filter by Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EscalationStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="REPORTED">Reported</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Emergency Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Requests
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{filteredEmergencies.length} request(s) matching filters</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredEmergencies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No emergency requests</p>
          ) : (
            filteredEmergencies.map((request) => {
              const priorityConfig_ = priorityConfig[request.priority];
              const PriorityIcon = priorityConfig_.icon;

              return (
                <div key={request.id} className={`p-4 rounded-lg border-2 ${priorityConfig_.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <PriorityIcon className={`w-6 h-6 ${priorityConfig_.color}`} />
                      <div>
                        <h3 className="font-bold text-lg">{request.studentName}</h3>
                        <p className="text-sm text-muted-foreground">{priorityConfig_.label} Priority</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{request.studentPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{request.studentEmail}</span>
                    </div>
                  </div>

                  <div className="bg-background rounded p-3 mb-3">
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Reported: {format(new Date(request.createdAt), "hh:mm a")}</span>
                    {request.responseTime && <span>Response: {request.responseTime}</span>}
                  </div>

                  <Dialog open={isDetailsOpen && selectedRequest?.id === request.id} onOpenChange={setIsDetailsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className={
                          request.status === "RESOLVED"
                            ? ""
                            : request.status === "IN_PROGRESS"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        }
                      >
                        {request.status === "RESOLVED" ? "View Details" : "Take Action"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Emergency Response</DialogTitle>
                        <DialogDescription>{request.studentName} - {request.priority}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded">
                          <p className="font-medium mb-1">Issue</p>
                          <p className="text-sm">{request.description}</p>
                        </div>
                        <div>
                          <Label htmlFor="assignedTo">Assign To</Label>
                          <Input
                            id="assignedTo"
                            placeholder="Guard name or department"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="response">Response/Resolution</Label>
                          <Textarea
                            id="response"
                            placeholder="Describe actions taken or resolution"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                          Cancel
                        </Button>
                        {request.status === "REPORTED" && (
                          <Button
                            onClick={() => handleStatusUpdate(request.id, "ACKNOWLEDGED")}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {request.status === "ACKNOWLEDGED" && (
                          <Button
                            onClick={() => handleStatusUpdate(request.id, "IN_PROGRESS")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start Response
                          </Button>
                        )}
                        {(request.status === "ACKNOWLEDGED" || request.status === "IN_PROGRESS") && (
                          <Button onClick={() => handleStatusUpdate(request.id, "RESOLVED", response)}>
                            Mark Resolved
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Resolution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{emergencies.filter((r) => r.status === "REPORTED").length}</p>
              <p className="text-sm text-muted-foreground">Reported</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{emergencies.filter((r) => r.status === "ACKNOWLEDGED").length}</p>
              <p className="text-sm text-muted-foreground">Acknowledged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{emergencies.filter((r) => r.status === "IN_PROGRESS").length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{emergencies.filter((r) => r.status === "RESOLVED").length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
