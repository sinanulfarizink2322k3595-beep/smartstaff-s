"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Calendar, MapPin, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeEvent, useRealtimeRefetch } from "@/hooks/use-realtime";
import { outpassApi } from "@/lib/api";
import { format } from "date-fns";

type OutpassStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface Outpass {
  id: string;
  reason: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  status: OutpassStatus;
  remarks?: string;
  rejectionReason?: string;
  createdAt: string;
  gateStatus?: string;
}

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", label: "Pending" },
  APPROVED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950", label: "Approved" },
  REJECTED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", label: "Rejected" },
  CANCELLED: { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950", label: "Cancelled" },
};

export default function StudentOutpassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [syncNotif, setSyncNotif] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    reason: "",
    destination: "",
    departureTime: "",
    returnTime: "",
  });

  // Auto-refetch when outpasses are updated
  useRealtimeRefetch(['outpasses'], ['outpass:approve', 'outpass:reject', 'outpass:update']);

  // Show sync notification
  useRealtimeEvent('outpass:update', () => {
    setSyncNotif(true);
    setTimeout(() => setSyncNotif(false), 2000);
  });

  // Fetch outpasses
  const { data: outpasses, isLoading } = useQuery({
    queryKey: ["outpasses"],
    queryFn: async () => {
      const response = await outpassApi.getAll();
      return response.data.data || response.data.outpasses || response.data || [];
    },
  });

  // Create outpass mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => outpassApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outpasses"] });
      setIsDialogOpen(false);
      setFormData({ reason: "", destination: "", departureTime: "", returnTime: "" });
      toast({
        title: "Success",
        description: "Outpass request submitted successfully",
      });
    },
    onError: (error: unknown) => {
      const apiError = error as {response?: {data?: {error?: string}}};
      toast({
        title: "Error",
        description: apiError?.response?.data?.error || "Failed to create outpass",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason || !formData.destination || !formData.departureTime || !formData.returnTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.departureTime) > new Date(formData.returnTime)) {
      toast({
        title: "Validation Error",
        description: "Return time must be after departure time",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  // Filter outpasses by status
  const filteredOutpasses = outpasses?.filter((outpass: Outpass) => 
    selectedStatus === "ALL" || outpass.status === selectedStatus
  ) || [];

  const statusCounts = {
    ALL: outpasses?.length || 0,
    PENDING: outpasses?.filter((o: Outpass) => o.status === "PENDING").length || 0,
    APPROVED: outpasses?.filter((o: Outpass) => o.status === "APPROVED").length || 0,
    REJECTED: outpasses?.filter((o: Outpass) => o.status === "REJECTED").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Outpasses</h1>
          <p className="text-muted-foreground">Track your outpass requests and status.</p>
        </div>

        <div className="flex items-center gap-4">
          {syncNotif && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">Status updated live</span>
            </div>
          )}

          {/* Create Outpass Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Request Outpass
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request New Outpass</DialogTitle>
              <DialogDescription>
                Fill in the details below to submit an outpass request
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for outpass"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  placeholder="Enter destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureTime">Departure Date & Time *</Label>
                  <Input
                    id="departureTime"
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="returnTime">Return Date & Time *</Label>
                  <Input
                    id="returnTime"
                    type="datetime-local"
                    value={formData.returnTime}
                    onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
            </Dialog>
          </div>
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
            {status === "ALL" ? "All" : statusConfig[status as OutpassStatus]?.label}
            <span className="bg-background/20 px-2 py-0.5 rounded-full text-xs">
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </Button>
        ))}
      </div>

      {/* Outpass List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading outpasses...</p>
            </CardContent>
          </Card>
        ) : filteredOutpasses.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {selectedStatus === "ALL" 
                  ? "No outpass requests yet. Click 'Request Outpass' to create one."
                  : `No ${selectedStatus.toLowerCase()} outpasses.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOutpasses.map((outpass: Outpass) => {
            const config = statusConfig[outpass.status];
            const StatusIcon = config.icon;

            return (
              <Card key={outpass.id} className="overflow-hidden">
                <CardHeader className={`${config.bg} border-b`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{outpass.reason}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {outpass.destination}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(outpass.departureTime), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Status Timeline */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Status Timeline</h4>
                    <div className="relative pl-6 space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

                      {/* Submitted */}
                      <div className="relative">
                        <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        <div>
                          <p className="font-medium text-sm">Request Submitted</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(outpass.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                      </div>

                      {/* Current Status */}
                      {outpass.status !== "PENDING" && (
                        <div className="relative">
                          <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-background ${
                            outpass.status === "APPROVED" ? "bg-green-500" : "bg-red-500"
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{config.label}</p>
                            {outpass.remarks && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Remarks: {outpass.remarks}
                              </p>
                            )}
                            {outpass.rejectionReason && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                Reason: {outpass.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Gate Status */}
                      {outpass.status === "APPROVED" && outpass.gateStatus && (
                        <div className="relative">
                          <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
                          <div>
                            <p className="font-medium text-sm">Gate Status</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {outpass.gateStatus.toLowerCase().replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pending indicator */}
                      {outpass.status === "PENDING" && (
                        <div className="relative">
                          <div className="absolute -left-6 w-4 h-4 rounded-full bg-yellow-500 border-2 border-background animate-pulse" />
                          <div>
                            <p className="font-medium text-sm">Awaiting Approval</p>
                            <p className="text-xs text-muted-foreground">
                              Your request is being reviewed
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Duration Info */}
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">
                          {format(new Date(outpass.departureTime), "MMM dd, yyyy 'at' hh:mm a")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium">
                          {format(new Date(outpass.returnTime), "MMM dd, yyyy 'at' hh:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
