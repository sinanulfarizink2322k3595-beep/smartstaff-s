import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  LogOut,
  LogIn,
  Clock,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface GateLogDetail {
  id: string;
  outpass_id: string;
  gate_action: "exit" | "entry";
  verified_at: string;
  verified_by: string;
  notes?: string;
  student_name?: string;
  student_id?: string;
  destination?: string;
  departure_time?: string;
  return_time?: string;
}

const SecurityExitLogs = () => {
  const [logs, setLogs] = useState<GateLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "exit" | "entry">("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchLogs = useCallback(async () => {
    try {
      // Get gate logs from localStorage
      const allLogs = JSON.parse(localStorage.getItem("gate_logs") || "[]");

      // Filter by selected date
      const filteredByDate = (allLogs as Record<string, unknown>[]).filter((log) => {
        const logDate = new Date(log.verified_at as string).toISOString().split("T")[0];
        return logDate === selectedDate;
      });

      // Fetch outpass details for these logs
      if (filteredByDate.length > 0) {
        const outpassIds = [...new Set(filteredByDate.map((l) => l.outpass_id as string))] as string[];
        const { data: outpassData } = await supabase
          .from("outpass_requests")
          .select(
            "id, student_id, destination, departure_time, return_time"
          )
          .in("id", outpassIds);

        // Fetch student details
        if (outpassData) {
          const studentIds = [...new Set(outpassData.map((o) => o.student_id))];
          const { data: studentData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", studentIds);

          const outpassMap = new Map(outpassData.map((o) => [o.id, o]));
          const studentMap = new Map(
            (studentData || []).map((s) => [s.id, s])
          );

          const enrichedLogs = filteredByDate.map((log) => {
            const outpass = outpassMap.get(log.outpass_id as string);
            const student = outpass
              ? studentMap.get(outpass.student_id)
              : null;

            return {
              ...log,
              student_name: student?.full_name || "Unknown",
              student_id: outpass?.student_id || "N/A",
              destination: outpass?.destination || "N/A",
              departure_time: outpass?.departure_time,
              return_time: outpass?.return_time,
            };
          });

          setLogs(enrichedLogs);
        }
      } else {
        setLogs([]);
      }
    } catch (error: unknown) {
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchLogs();
    // Refetch every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.destination?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || log.gate_action === filterType;

      return matchesSearch && matchesType;
    });
  }, [logs, searchTerm, filterType]);

  const getTodayStats = () => {
    const exits = logs.filter((l) => l.gate_action === "exit").length;
    const entries = logs.filter((l) => l.gate_action === "entry").length;
    return { exits, entries };
  };

  const getLateReturns = () => {
    return logs.filter((log) => {
      if (log.gate_action !== "entry" || !log.return_time) return false;
      const returnTime = new Date(log.return_time).getTime();
      const actualReturn = new Date(log.verified_at).getTime();
      return actualReturn > returnTime;
    });
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const headers = [
      "Timestamp",
      "Action",
      "Staff Name",
      "Staff ID",
      "Destination",
      "Verified By",
      "Notes",
    ];
    const rows = filteredLogs.map((log) => [
      new Date(log.verified_at).toLocaleString(),
      log.gate_action === "exit" ? "Exit" : "Entry",
      log.student_name,
      log.student_id,
      log.destination,
      log.verified_by,
      log.notes || "-",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell: unknown) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gate-logs-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const stats = getTodayStats();
  const lateReturns = getLateReturns();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Exit & Entry Logs</h1>
            <p className="text-muted-foreground mt-1">
              Today's gate entry and exit records
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    EXITS
                  </p>
                  <p className="text-lg font-bold">{stats.exits}</p>
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
                    ENTRIES
                  </p>
                  <p className="text-lg font-bold">{stats.entries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    LATE RETURNS
                  </p>
                  <p className="text-lg font-bold">{lateReturns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TOTAL LOGS
                  </p>
                  <p className="text-lg font-bold">{filteredLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Filter Type</Label>
            <Select value={filterType} onValueChange={(v: string) => setFilterType(v as "all" | "exit" | "entry")}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="exit">Exits Only</SelectItem>
                <SelectItem value="entry">Entries Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Search Staff
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Name, ID, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Late Returns Alert */}
        {lateReturns.length > 0 && (
          <Card className="border-l-4 border-l-warning bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1">Late Return Alert</p>
                  <div className="text-xs space-y-1">
                    {lateReturns.slice(0, 3).map((log) => (
                      <p key={log.id} className="text-muted-foreground">
                        <span className="font-medium">{log.student_name}</span>{" "}
                        returned late at{" "}
                        {new Date(log.verified_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ))}
                    {lateReturns.length > 3 && (
                      <p className="text-muted-foreground">
                        +{lateReturns.length - 3} more late returns
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Gate Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <LogOut className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No logs found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const isLate =
                        log.gate_action === "entry" &&
                        log.return_time &&
                        new Date(log.verified_at).getTime() >
                          new Date(log.return_time).getTime();

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.verified_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {log.gate_action === "exit" ? (
                                <>
                                  <LogOut className="w-4 h-4 text-success" />
                                  <span className="text-sm font-medium">
                                    Exit
                                  </span>
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-4 h-4 text-info" />
                                  <span className="text-sm font-medium">
                                    Entry
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-semibold">
                                {log.student_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.student_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.destination}
                          </TableCell>
                          <TableCell>
                            {isLate ? (
                              <div className="flex items-center gap-1 text-warning text-xs font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                Late
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                                <CheckCircle className="w-3 h-3" />
                                OK
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SecurityExitLogs;
