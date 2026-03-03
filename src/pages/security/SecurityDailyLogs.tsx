import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  LogOut,
  LogIn,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface DailyLog {
  id: string;
  staff_name: string;
  staff_id: string;
  department?: string;
  destination: string;
  exit_time: string;
  return_time?: string;
  status: "outside" | "returned" | "late";
  notes?: string;
}

const SecurityDailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterStatus, setFilterStatus] = useState<"all" | "outside" | "returned" | "late">("all");

  const fetchDailyLogs = useCallback(async () => {
    try {
      // Get gate logs from localStorage
      const allLogs = JSON.parse(localStorage.getItem("gate_logs") || "[]");

      // Filter by selected date
      const filteredByDate = allLogs.filter((log: any) => {
        const logDate = new Date(log.verified_at).toISOString().split("T")[0];
        return logDate === selectedDate;
      });

      if (filteredByDate.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Fetch outpass details
      const outpassIds = [...new Set(filteredByDate.map((l: any) => l.outpass_id))] as string[];
      const { data: outpassData } = await supabase
        .from("outpass_requests")
        .select(
          "id, student_id, destination, departure_time, return_time"
        )
        .in("id", outpassIds);

      // Fetch student details
      if (outpassData) {
        const studentIds = [...new Set(outpassData.map((o: any) => o.student_id))];
        const { data: studentData } = await supabase
          .from("profiles")
          .select("id, full_name, department")
          .in("id", studentIds);

        const outpassMap = new Map(outpassData.map((o: any) => [o.id, o]));
        const studentMap = new Map(
          (studentData || []).map((s: any) => [s.id, s])
        );

        // Process logs to create daily summary
        const processedLogs: { [key: string]: DailyLog } = {};

        for (const log of filteredByDate) {
          const outpass = outpassMap.get(log.outpass_id);
          const student = outpass
            ? studentMap.get(outpass.student_id)
            : null;

          const key = outpass?.student_id || log.id;

          if (!processedLogs[key]) {
            processedLogs[key] = {
              id: log.outpass_id,
              staff_name: student?.full_name || "Unknown",
              staff_id: outpass?.student_id || "N/A",
              department: student?.department || "N/A",
              destination: outpass?.destination || "N/A",
              exit_time: "",
              status: "outside",
              notes: log.notes,
            };
          }

          if (log.gate_action === "exit") {
            processedLogs[key].exit_time = log.verified_at;
          } else if (log.gate_action === "entry") {
            processedLogs[key].return_time = log.verified_at;
            
            // Check if late
            if (outpass?.return_time) {
              const expectedReturn = new Date(outpass.return_time);
              const actualReturn = new Date(log.verified_at);
              processedLogs[key].status =
                actualReturn > expectedReturn ? "late" : "returned";
            } else {
              processedLogs[key].status = "returned";
            }
          }
        }

        setLogs(Object.values(processedLogs));
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to load logs";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyLogs();
  }, [selectedDate, fetchDailyLogs]);

  const filteredLogs = useMemo(() => {
    if (filterStatus === "all") return logs;
    return logs.filter((log) => log.status === filterStatus);
  }, [logs, filterStatus]);

  const getStats = () => {
    return {
      total: logs.length,
      outside: logs.filter((l) => l.status === "outside").length,
      returned: logs.filter((l) => l.status === "returned").length,
      late: logs.filter((l) => l.status === "late").length,
    };
  };

  const getChartData = () => {
    const stats = getStats();
    return [
      { name: "Outside", value: stats.outside, fill: "#f59e0b" },
      { name: "Returned", value: stats.returned, fill: "#10b981" },
      { name: "Late", value: stats.late, fill: "#ef4444" },
    ];
  };

  const getDepartmentStats = () => {
    const deptMap = new Map<string, number>();
    logs.forEach((log) => {
      const dept = log.department || "Unknown";
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    return Array.from(deptMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  };

  const stats = getStats();
  const chartData = getChartData();
  const deptStats = getDepartmentStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Daily Logs</h1>
            <p className="text-muted-foreground mt-1">
              Daily activity summary and staff location tracking
            </p>
          </div>
          <div className="w-40">
            <label className="text-sm font-semibold mb-2 block">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TOTAL
                  </p>
                  <p className="text-lg font-bold">{stats.total}</p>
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
                    OUTSIDE
                  </p>
                  <p className="text-lg font-bold">{stats.outside}</p>
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
                    RETURNED
                  </p>
                  <p className="text-lg font-bold">{stats.returned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    LATE
                  </p>
                  <p className="text-lg font-bold">{stats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.name}: ${entry.value}`
                      }
                      outerRadius={80}
                      fill="#000"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">By Department</CardTitle>
            </CardHeader>
            <CardContent>
              {deptStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deptStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div>
          <label className="text-sm font-semibold mb-2 block">Filter Status</label>
          <Select
            value={filterStatus}
            onValueChange={(v: string) => setFilterStatus((v as any) || "all")}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="outside">Currently Outside</SelectItem>
              <SelectItem value="returned">Returned On Time</SelectItem>
              <SelectItem value="late">Late Returns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Staff Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No logs found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Staff</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Exit Time</TableHead>
                      <TableHead>Return Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold">{log.staff_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.staff_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{log.department}</TableCell>
                        <TableCell className="text-sm">{log.destination}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.exit_time
                            ? new Date(log.exit_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.return_time
                            ? new Date(log.return_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.status === "outside"
                                ? "bg-warning text-warning-foreground"
                                : log.status === "late"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-success text-success-foreground"
                            }
                          >
                            {log.status === "outside"
                              ? "Outside"
                              : log.status === "late"
                              ? "Late Return"
                              : "Returned"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default SecurityDailyLogs;
