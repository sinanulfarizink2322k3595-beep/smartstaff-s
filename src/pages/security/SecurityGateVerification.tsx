import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { securityApi } from "@/lib/security-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  MapPin,
  FileText,
  LogIn,
  LogOut,
  QrCode,
  Plus,
} from "lucide-react";

interface OutpassDetail {
  id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  destination: string;
  reason: string;
  departure_time: string;
  return_time: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  requested_by_security?: boolean;
  created_at: string;
}

interface GateLog {
  id: string;
  outpass_id: string;
  gate_action: "exit" | "entry";
  verified_at: string;
  verified_by: string;
  notes?: string;
}

const SecurityGateVerification = () => {
  const [outpasses, setOutpasses] = useState<OutpassDetail[]>([]);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOutpass, setSelectedOutpass] = useState<OutpassDetail | null>(
    null
  );
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [gateAction, setGateAction] = useState<"exit" | "entry" | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [manualIdInput, setManualIdInput] = useState("");
  const [searchMode, setSearchMode] = useState<"search" | "manual">("search");

  useEffect(() => {
    fetchData();
    // Refetch every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch approved outpasses for today
      const today = new Date().toISOString().split("T")[0];
      const { data: outpassData, error: outpassError } = await supabase
        .from("outpass_requests")
        .select(
          "id, student_id, destination, reason, departure_time, return_time, status, approved_by, requested_by_security, created_at"
        )
        .eq("status", "approved")
        .gte("departure_time", `${today}T00:00:00`)
        .order("departure_time", { ascending: false });

      if (outpassError) throw outpassError;

      // Fetch student details
      if (outpassData) {
        const studentIds = [...new Set(outpassData.map((o) => o.student_id))];
        const { data: studentData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds);

        const studentMap = new Map(
          (studentData || []).map((s) => [s.id, s])
        );

        const enrichedOutpasses = outpassData.map((o) => ({
          ...o,
          student_name: studentMap.get(o.student_id)?.full_name || "Unknown",
          student_email: studentMap.get(o.student_id)?.email,
        }));

        setOutpasses(enrichedOutpasses);
      }

      // Fetch gate logs from API
      try {
        const gateLogsResponse = await securityApi.getGateLogs(1, 100);
        const gateLogsData = gateLogsResponse.data || [];
        // Convert API response to matching format
        const formattedLogs = gateLogsData.map((log) => ({
          id: log.id,
          outpass_id: log.outpassId,
          gate_action: log.gateStatus?.toLowerCase() || 'exit',
          verified_at: log.gateVerifiedAt || new Date().toISOString(),
          verified_by: log.verifiedBy || 'security-staff',
          notes: log.notes || '',
        }));
        setGateLogs(formattedLogs);
      } catch (apiError) {
        // Fallback to localStorage if API fails
        const gateLogsData = JSON.parse(localStorage.getItem("gate_logs") || "[]");
        setGateLogs(gateLogsData);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to load data";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutpasses = useMemo(() => {
    return outpasses.filter((o) =>
      o.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [outpasses, searchTerm]);

  const getApprovedCount = () =>
    outpasses.filter((o) => o.status === "approved").length;

  const getTodayExits = () =>
    gateLogs.filter((l) => l.gate_action === "exit").length;

  const getTodayReturns = () =>
    gateLogs.filter((l) => l.gate_action === "entry").length;

  const getOutsideCount = () =>
    outpasses.filter((o) => {
      const exitLog = gateLogs.find(
        (l) => l.outpass_id === o.id && l.gate_action === "exit"
      );
      const returnLog = gateLogs.find(
        (l) => l.outpass_id === o.id && l.gate_action === "entry"
      );
      return exitLog && !returnLog;
    }).length;

  const handleVerifyStaff = async () => {
    if (!selectedOutpass || !gateAction) {
      toast.error("Please select action and outpass");
      return;
    }

    setVerifying(true);
    try {
      // Call API to create gate log
      const response = await securityApi.createGateLog(
        selectedOutpass.id,
        gateAction.toUpperCase() as 'EXIT' | 'ENTRY',
        verifyNotes
      );

      toast.success(
        `Staff ${gateAction === "exit" ? "exit" : "entry"} recorded successfully!`
      );

      setVerifyDialogOpen(false);
      setSelectedOutpass(null);
      setGateAction(null);
      setVerifyNotes("");
      fetchData();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to verify staff";
      toast.error(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualIdInput.trim()) {
      toast.error("Please enter an ID or name");
      return;
    }

    const found = outpasses.find(
      (o) =>
        o.student_id.toLowerCase() === manualIdInput.toLowerCase() ||
        o.student_name.toLowerCase().includes(manualIdInput.toLowerCase())
    );

    if (found) {
      setSelectedOutpass(found);
      setSearchMode("search");
      setManualIdInput("");
    } else {
      toast.error("Outpass not found");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Gate Verification
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify staff entry and exit with approved outpasses
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedOutpass(null);
              setGateAction(null);
              setVerifyNotes("");
              setVerifyDialogOpen(true);
            }}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Verify Entry/Exit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    APPROVED
                  </p>
                  <p className="text-lg font-bold">{getApprovedCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TODAY EXITS
                  </p>
                  <p className="text-lg font-bold">{getTodayExits()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TODAY RETURNS
                  </p>
                  <p className="text-lg font-bold">{getTodayReturns()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    OUTSIDE NOW
                  </p>
                  <p className="text-lg font-bold">{getOutsideCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setSearchTerm("")}
                variant="outline"
                className="gap-2"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Approved Outpasses List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Approved Outpasses</h2>
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
            ) : filteredOutpasses.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No approved outpasses
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOutpasses.map((outpass) => {
                const exitLog = gateLogs.find(
                  (l) =>
                    l.outpass_id === outpass.id && l.gate_action === "exit"
                );
                const returnLog = gateLogs.find(
                  (l) =>
                    l.outpass_id === outpass.id && l.gate_action === "entry"
                );
                const isOutside = exitLog && !returnLog;
                const isReturned = exitLog && returnLog;

                return (
                  <Card
                    key={outpass.id}
                    className={`border-0 shadow-card cursor-pointer transition-all hover:shadow-lg ${
                      isReturned ? "opacity-60" : ""
                    } ${isOutside ? "ring-2 ring-warning" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">
                                {outpass.student_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {outpass.student_id}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold mb-1">
                                DESTINATION
                              </p>
                              <p className="text-sm font-medium">
                                {outpass.destination}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-semibold mb-1">
                                REASON
                              </p>
                              <p className="text-sm font-medium">
                                {outpass.reason}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              OUT: {new Date(outpass.departure_time).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              RETURN: {new Date(outpass.return_time).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                            </div>
                          </div>

                          {exitLog && (
                            <div className="text-xs text-muted-foreground mt-2">
                              EXIT LOGGED: {new Date(exitLog.verified_at).toLocaleTimeString()}
                            </div>
                          )}
                          {returnLog && (
                            <div className="text-xs text-muted-foreground">
                              RETURNED: {new Date(returnLog.verified_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex gap-2">
                            {!exitLog && (
                              <Button
                                onClick={() => {
                                  setSelectedOutpass(outpass);
                                  setGateAction("exit");
                                  setVerifyDialogOpen(true);
                                }}
                                className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                                size="sm"
                              >
                                <LogOut className="w-3 h-3" />
                                Exit
                              </Button>
                            )}
                            {exitLog && !returnLog && (
                              <Button
                                onClick={() => {
                                  setSelectedOutpass(outpass);
                                  setGateAction("entry");
                                  setVerifyDialogOpen(true);
                                }}
                                className="gap-2 bg-info text-info-foreground hover:bg-info/90"
                                size="sm"
                              >
                                <LogIn className="w-3 h-3" />
                                Return
                              </Button>
                            )}
                          </div>

                          <div className="text-right">
                            {isReturned && (
                              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" />
                                Returned
                              </div>
                            )}
                            {isOutside && (
                              <div className="flex items-center gap-1 text-warning text-xs font-semibold">
                                <MapPin className="w-3 h-3" />
                                Outside
                              </div>
                            )}
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
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOutpass
                ? `Verify ${gateAction === "exit" ? "Exit" : "Entry"}`
                : "Search Staff"}
            </DialogTitle>
            {!selectedOutpass && (
              <DialogDescription>
                Enter staff ID or name to verify
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {!selectedOutpass ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Staff ID or Name</Label>
                  <Input
                    placeholder="Enter staff ID or name..."
                    value={manualIdInput}
                    onChange={(e) => setManualIdInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleManualSearch();
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleManualSearch}
                    className="flex-1 gradient-primary text-primary-foreground"
                  >
                    Search
                  </Button>
                  <Button
                    onClick={() => setVerifyDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      STAFF
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedOutpass.student_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      DESTINATION
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedOutpass.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      ACTION
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {gateAction === "exit" ? "Leaving Campus" : "Returning to Campus"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyStaff}
                    disabled={verifying}
                    className="flex-1 gradient-primary text-primary-foreground gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {verifying
                      ? "Verifying..."
                      : gateAction === "exit"
                      ? "Confirm Exit"
                      : "Confirm Return"}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOutpass(null);
                      setGateAction(null);
                      setVerifyNotes("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SecurityGateVerification;
