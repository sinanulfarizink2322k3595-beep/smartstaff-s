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
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { toast } from "sonner";
import {
  Download,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";

interface ReportData {
  date: string;
  exits: number;
  returns: number;
  lateReturns: number;
}

interface FrequentUser {
  name: string;
  staff_id: string;
  department: string;
  outpass_count: number;
  avg_duration: number;
  late_count: number;
}

interface LateReturnRecord {
  staff_name: string;
  staff_id: string;
  date: string;
  minutes_late: number;
  destination: string;
}

const SecurityReports = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [frequentUsers, setFrequentUsers] = useState<FrequentUser[]>([]);
  const [lateReturns, setLateReturns] = useState<LateReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    // Update dates based on range selection
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case "today":
        start.setDate(end.getDate());
        break;
      case "7days":
        start.setDate(end.getDate() - 7);
        break;
      case "30days":
        start.setDate(end.getDate() - 30);
        break;
      case "custom":
        // Keep custom dates
        return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [dateRange]);

  const fetchReports = useCallback(async () => {
    try {
      // Get gate logs from localStorage
      const allLogs = JSON.parse(localStorage.getItem("gate_logs") || "[]");

      // Filter logs by date range
      const logsData = (allLogs as Record<string, unknown>[]).filter((log) => {
        const logDate = (log.verified_at as string).split("T")[0];
        return logDate >= startDate && logDate <= endDate;
      });

      if (logsData.length === 0) {
        setReportData([]);
        setFrequentUsers([]);
        setLateReturns([]);
        setLoading(false);
        return;
      }

      // Fetch outpass details
      const outpassIds = [...new Set(logsData.map((l) => l.outpass_id))] as string[];
      const { data: outpassData } = await supabase
        .from("outpass_requests")
        .select("id, student_id, destination, departure_time, return_time")
        .in("id", outpassIds);

      // Fetch student details
      if (outpassData) {
        const studentIds = [...new Set(outpassData.map((o) => o.student_id))] as string[];
        const { data: studentData } = await supabase
          .from("profiles")
          .select("id, full_name, department")
          .in("id", studentIds);

        const outpassMap = new Map(outpassData.map((o) => [o.id, o]));
        const studentMap = new Map(
          (studentData || []).map((s) => [s.id, s])
        );

        // Generate daily report
        const dailyStats = new Map<string, ReportData>();

        for (const log of logsData) {
          const date = log.verified_at.split("T")[0];
          if (!dailyStats.has(date)) {
            dailyStats.set(date, {
              date,
              exits: 0,
              returns: 0,
              lateReturns: 0,
            });
          }

          const stat = dailyStats.get(date);
          if (log.gate_action === "exit") {
            stat.exits++;
          } else {
            stat.returns++;
            // Check if late
            const outpass = outpassMap.get(log.outpass_id);
            if (outpass) {
              const expectedReturn = new Date(outpass.return_time);
              const actualReturn = new Date(log.verified_at);
              if (actualReturn > expectedReturn) {
                stat.lateReturns++;
              }
            }
          }
        }

        setReportData(Array.from(dailyStats.values()));

        // Generate late return records
        const lateRecords: LateReturnRecord[] = [];
        for (const log of logsData) {
          if (log.gate_action === "entry") {
            const outpass = outpassMap.get(log.outpass_id);
            if (outpass) {
              const expectedReturn = new Date(outpass.return_time);
              const actualReturn = new Date(log.verified_at);
              const minutesLate =
                (actualReturn.getTime() - expectedReturn.getTime()) / (1000 * 60);

              if (minutesLate > 0) {
                const student = studentMap.get(outpass.student_id);
                lateRecords.push({
                  staff_name: student?.full_name || "Unknown",
                  staff_id: outpass.student_id,
                  date: log.verified_at.split("T")[0],
                  minutes_late: Math.round(minutesLate),
                  destination: outpass.destination,
                });
              }
            }
          }
        }

        setLateReturns(lateRecords.slice(0, 50)); // Top 50

        // Generate frequent users
        const frequentMap = new Map<
          string,
          {
            name: string;
            staff_id: string;
            department: string;
            outpass_count: number;
            total_duration: number;
            late_count: number;
          }
        >();

        for (const log of logsData) {
          if (log.gate_action === "exit") {
            const outpass = outpassMap.get(log.outpass_id);
            const student = outpass
              ? studentMap.get(outpass.student_id)
              : null;

            if (outpass) {
              const key = outpass.student_id;
              if (!frequentMap.has(key)) {
                frequentMap.set(key, {
                  name: student?.full_name || "Unknown",
                  staff_id: outpass.student_id,
                  department: student?.department || "Unknown",
                  outpass_count: 0,
                  total_duration: 0,
                  late_count: 0,
                });
              }

              const record = frequentMap.get(key)!;
              record.outpass_count++;

              // Calculate duration if return exists
              const returnLog = logsData.find(
                (l) =>
                  l.outpass_id === log.outpass_id &&
                  l.gate_action === "entry" &&
                  l.verified_at > log.verified_at
              );

              if (returnLog) {
                const duration =
                  (new Date(returnLog.verified_at).getTime() -
                    new Date(log.verified_at).getTime()) /
                  (1000 * 60);
                record.total_duration += duration;

                // Check if late
                if (
                  new Date(returnLog.verified_at) >
                  new Date(outpass.return_time)
                ) {
                  record.late_count++;
                }
              }
            }
          }
        }

        const frequentList = Array.from(frequentMap.values())
          .map((u) => ({
            ...u,
            avg_duration: Math.round(u.total_duration / u.outpass_count),
          }))
          .sort((a, b) => b.outpass_count - a.outpass_count)
          .slice(0, 20);

        setFrequentUsers(frequentList);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to load reports";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportReport = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date",
      "Total Exits",
      "Total Returns",
      "Late Returns",
      "Late %",
    ];
    const rows = reportData.map((r) => [
      r.date,
      r.exits,
      r.returns,
      r.lateReturns,
      r.returns > 0
        ? ((r.lateReturns / r.returns) * 100).toFixed(1) + "%"
        : "0%",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell: string | number) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const totalExits = reportData.reduce((sum, r) => sum + r.exits, 0);
  const totalReturns = reportData.reduce((sum, r) => sum + r.returns, 0);
  const totalLate = reportData.reduce((sum, r) => sum + r.lateReturns, 0);
  const latePercentage =
    totalReturns > 0 ? ((totalLate / totalReturns) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and exit/return statistics
            </p>
          </div>
          <Button
            onClick={handleExportReport}
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <>
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  From
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    EXITS
                  </p>
                  <p className="text-lg font-bold">{totalExits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    RETURNS
                  </p>
                  <p className="text-lg font-bold">{totalReturns}</p>
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
                    LATE RETURNS
                  </p>
                  <p className="text-lg font-bold">{totalLate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    LATE %
                  </p>
                  <p className="text-lg font-bold">{latePercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend Chart */}
        {reportData.length > 0 && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Daily Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="exits"
                    stroke="#10b981"
                    name="Exits"
                  />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="#3b82f6"
                    name="Returns"
                  />
                  <Line
                    type="monotone"
                    dataKey="lateReturns"
                    stroke="#ef4444"
                    name="Late Returns"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Frequent Users */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Frequent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : frequentUsers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Staff</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead align="center">Outpasses</TableHead>
                      <TableHead align="center">Avg Duration</TableHead>
                      <TableHead align="center">Late Returns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {frequentUsers.map((user) => (
                      <TableRow key={user.staff_id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.staff_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.department}
                        </TableCell>
                        <TableCell className="text-sm text-center font-semibold">
                          {user.outpass_count}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {user.avg_duration} min
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          <span
                            className={
                              user.late_count > 0
                                ? "text-warning font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {user.late_count}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Late Returns List */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Late Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : lateReturns.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No late returns
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Staff</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead align="right">Minutes Late</TableHead>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lateReturns.map((record, i) => (
                      <TableRow key={i} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-semibold">
                              {record.staff_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.staff_id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.destination}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold text-warning">
                          +{record.minutes_late} min
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

export default SecurityReports;
