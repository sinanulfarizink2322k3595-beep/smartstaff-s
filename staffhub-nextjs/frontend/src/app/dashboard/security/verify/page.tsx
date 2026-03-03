"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, XCircle, Clock, AlertCircle, QrCode, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { outpassApi } from "@/lib/api";
import { format } from "date-fns";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

interface OutpassVerification {
  id: string;
  studentName: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  status: VerificationStatus;
  gateStatus?: string;
  remarks?: string;
}

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", label: "Pending" },
  APPROVED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950", label: "Approved" },
  REJECTED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950", label: "Rejected" },
  PROCESSED: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950", label: "Processed" },
};

export default function SecurityVerifyPage() {
  const [searchId, setSearchId] = useState("");
  const [selectedOutpass, setSelectedOutpass] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all outpasses for verification queue
  const { data: outpasses, isLoading } = useQuery({
    queryKey: ["outpass-verification"],
    queryFn: async () => {
      const response = await outpassApi.getAll();
      return response.data.data || response.data.outpasses || response.data || [];
    },
  });

  // Update gate status mutation
  const updateGateStatusMutation = useMutation({
    mutationFn: (data: { id: string; gateStatus: string; remarks?: string }) =>
      outpassApi.updateGateStatus(data.id, { gateStatus: data.gateStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outpass-verification"] });
      setIsDialogOpen(false);
      setRemarks("");
      setSelectedOutpass(null);
      toast({
        title: "Success",
        description: "Gate status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Search for outpass
  const searchedOutpass = searchId
    ? outpasses?.find((o: any) => o.id.includes(searchId) || o.studentName.toLowerCase().includes(searchId.toLowerCase()))
    : null;

  const handleVerify = (outpass: any, status: string) => {
    setSelectedOutpass(outpass);
    setIsDialogOpen(true);
  };

  const handleConfirmVerification = (status: string) => {
    if (!selectedOutpass) return;

    updateGateStatusMutation.mutate({
      id: selectedOutpass.id,
      gateStatus: status,
      remarks,
    });
  };

  // Pending verification queue (outpasses with APPROVED status that need gate processing)
  const verificationQueue = outpasses?.filter((o: any) => o.status === "APPROVED" && o.gateStatus !== "PROCESSED") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Verify Outpass</h1>
        <p className="text-muted-foreground">Validate outpasses at the gate with scan/lookup and verification.</p>
      </div>

      {/* Search/Scan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search or Scan Outpass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter outpass ID or student name"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setShowQrScanner(!showQrScanner)}
              className="gap-2"
            >
              {showQrScanner ? <EyeOff className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
              {showQrScanner ? "Close" : "QR Code"}
            </Button>
          </div>

          {showQrScanner && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed">
              <p className="text-center text-muted-foreground">QR Scanner ready - point camera at QR code</p>
            </div>
          )}

          {searchedOutpass && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium">Outpass Found:</p>
              <p className="text-lg font-bold mt-2">{searchedOutpass.studentName}</p>
              <p className="text-sm text-muted-foreground">{searchedOutpass.destination}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
          <p className="text-sm text-muted-foreground">{verificationQueue.length} outpasses pending gate verification</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading verification queue...</p>
          ) : verificationQueue.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No outpasses pending verification</p>
          ) : (
            <div className="space-y-4">
              {verificationQueue.map((outpass: any) => {
                const config = statusConfig[outpass.status as VerificationStatus] || statusConfig.PENDING;
                const StatusIcon = config.icon;

                return (
                  <div key={outpass.id} className={`p-4 rounded-lg border-2 ${config.bg}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          <h3 className="font-bold text-lg">{outpass.studentName}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Destination</p>
                            <p className="font-medium">{outpass.destination}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Departure</p>
                            <p className="font-medium">
                              {format(new Date(outpass.departureTime), "MMM dd, yyyy hh:mm a")}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Outpass ID</p>
                            <p className="font-mono text-xs bg-background px-2 py-1 rounded w-fit">
                              {outpass.id.substring(0, 12)}...
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gate Status</p>
                            <p className="font-medium">{outpass.gateStatus || "Pending"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Dialog open={isDialogOpen && selectedOutpass?.id === outpass.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOutpass(outpass);
                                setIsDialogOpen(true);
                              }}
                            >
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Process Gate Verification</DialogTitle>
                              <DialogDescription>
                                Mark the outpass as processed or rejected at the gate
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Student: {outpass.studentName}</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {outpass.destination} - {format(new Date(outpass.departureTime), "MMM dd")}
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="remarks">Verification Notes</Label>
                                <Textarea
                                  id="remarks"
                                  placeholder="Add any notes about the verification..."
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleConfirmVerification("REJECTED")}
                                disabled={updateGateStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleConfirmVerification("PROCESSED")}
                                disabled={updateGateStatusMutation.isPending}
                              >
                                {updateGateStatusMutation.isPending ? "Processing..." : "Allow Through"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Processed</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : (
            <div className="space-y-2">
              {outpasses
                ?.filter((o: any) => o.gateStatus === "PROCESSED")
                .slice(0, 5)
                .map((outpass: any) => (
                  <div key={outpass.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{outpass.studentName}</p>
                      <p className="text-xs text-muted-foreground">{outpass.destination}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">Processed</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
